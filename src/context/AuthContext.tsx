
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile, AppRole } from "@/types/app";
import { toast } from "@/components/ui/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    setIsLoading(true);
    try {
      console.log("Fetching profile for user:", userId);
      
      // Primero intentamos con la consulta directa
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error en la primera consulta de perfil:', error);
        
        // Si falló la primera consulta, intentamos una consulta más simple
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error('Error en la segunda consulta de perfil:', profileError);
          throw profileError;
        }
        
        data = profileData;
      }
      
      if (data) {
        console.log("Profile data:", data);
        setProfile(data as Profile);
      } else {
        console.warn("No se encontró perfil para el usuario:", userId);
        // Si no hay perfil, pero tenemos un usuario autenticado, creamos uno básico
        // Esto es útil si las políticas RLS no permiten acceder al perfil creado automáticamente
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            id: userId,
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error al crear perfil:', insertError);
        } else {
          // Intentar obtener el perfil recién creado
          const { data: newProfile } = await supabase
            .from('profiles')
            .select()
            .eq('id', userId)
            .maybeSingle();
            
          if (newProfile) {
            setProfile(newProfile as Profile);
          }
        }
      }
    } catch (error) {
      console.error("Error inesperado al obtener perfil:", error);
      toast({ 
        title: "Error", 
        description: "No se pudo cargar tu perfil. Lo intentaremos más tarde.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isAdmin = profile?.role === 'admin';

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    session,
    user,
    profile,
    isAdmin,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
