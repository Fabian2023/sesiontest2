import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/app";

const GuestDashboard = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data as Message[]);
      }

      setLoading(false);
    };

    fetchMessages();

    // Configurar suscripción en tiempo real para nuevos mensajes
    const subscription = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((prev) => [payload.new as Message, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Función para cerrar sesión y redirigir a /signin
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error cerrando sesión:", error);
    } else {
      navigate("/signin"); // Redirigir a /signin después de cerrar sesión
    }
  };

  return (
    <div className="container mx-auto py-8 bg-gradient-to-b from-blue-300 to-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Bienvenido, {profile?.full_name}!</h1>
        <button 
          onClick={handleLogout} 
          className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="bg-gray-100 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Mensajes del Admin</h2>

        {loading ? (
          <div>Loading messages...</div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="border p-4 rounded bg-white">
                <p className="mb-2">{message.content}</p>
                <p className="text-xs text-gray-500">
                  Publicado: {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay mensajes disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
