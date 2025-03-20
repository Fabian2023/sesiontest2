
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Invitation } from "@/types/app";

const AcceptInvitation = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log("Token capturado desde useParams:", token);
    const fetchInvitation = async () => {
      if (!token) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('accepted', false)
        .single();

        
  console.log("Supabase response:", { data, error });
      
      if (error) {
        console.error('Error fetching invitation:', error);
        toast({ 
          title: "Invalid Invitation", 
          description: "This invitation is invalid or has already been used.",
          variant: "destructive" 
        });
        navigate("/");
      } else {
        const invitationData = data as Invitation;
        
        // Check if invitation has expired
        if (new Date(invitationData.expires_at) < new Date()) {
          toast({ 
            title: "Invitation Expired", 
            description: "This invitation has expired.",
            variant: "destructive" 
          });
          navigate("/");
        } else {
          setInvitation(invitationData);
        }
      }
      
      setLoading(false);
    };

    fetchInvitation();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !password || !invitation) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (authError) throw authError;
      
      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);
      
      if (updateError) throw updateError;
      
      toast({ title: "Success", description: "Account created successfully. You can now sign in." });
      navigate("/signin");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({ 
        title: "Error", 
        description: "Failed to create account. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-200 to-white">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-300 to-white">
      <div className="mx-auto w-full max-w-md p-8 space-y-8 bg-gray-100 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Aceptar Invitacion</h1>
          <p className="text-gray-600 mt-2">
          Has sido invitado a unirte. Crea tu cuenta a continuación.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={invitation?.email}
                disabled
                className="bg-gray-100"
              />
            </div>
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crea una contraseña"
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitting}
          >
            {submitting ? "Creando cuenta..." : "Crea tu cuenta"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitation;
