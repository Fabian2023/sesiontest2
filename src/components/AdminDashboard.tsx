import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Profile, Invitation, Message } from "@/types/app";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch users
    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select("*");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } else {
      setUsers(usersData as Profile[]);
    }

    // Fetch invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from("invitations")
      .select("*");

    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      });
    } else {
      setInvitations(invitationsData as Invitation[]);
    }

    // Fetch messages
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*");

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      setMessages(messagesData as Message[]);
    }

    setLoading(false);
  };

  const createInvitation = async () => {
    if (!newEmail.trim() || !user) return;

    const token = Math.random().toString(36).substring(2, 15);
    const invitationUrl = `${window.location.origin}/accept-invitation/${token}`;

    const { data, error } = await supabase.from("invitations").insert({
      email: newEmail,
      token,
      created_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expira en 7 días
    });

    if (error) {
      console.error("Error creating invitation:", error);
      toast({
        title: "Error",
        description: "Failed to create invitation",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: (
          <div className="flex flex-col space-y-2">
            <span>Invitacion creada! comparte el link:</span>
            <span className="text-blue-500 break-all">{invitationUrl}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(invitationUrl);
                toast({
                  title: "Copiado!",
                  description: "Link copiado en el portapapeles.",
                });
              }}
            >
              Copy Link
            </Button>
          </div>
        ),
      });

      setNewEmail("");
      fetchData();
    }
  };

  const createMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from("messages").insert({
      content: newMessage,
      created_by: user.id,
    });

    if (error) {
      console.error("Error creating message:", error);
      toast({
        title: "Error",
        description: "Failed to create message",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Message created successfully" });
      setNewMessage("");
      fetchData();
    }
  };

  return (
    <div className="container mx-auto py-8 bg-gradient-to-b from-blue-300 to-white">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Usuarios ({users.length})
            </h2>
            <div className="space-y-4 ">
              {users.map((profile) => (
                <div key={profile.id} className="border p-3 rounded bg-white">
                  <p>
                    <strong>{profile.full_name}</strong>
                  </p>
                  <p className="text-sm text-gray-500">Rol: {profile.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Invitaciones</h2>
            <div className="mb-6">
              <div className="flex space-x-2 mb-4 ">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email address"
                />
                <Button onClick={createInvitation}>Invitar</Button>
              </div>

              <div className="space-y-4 ">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="border p-3 rounded bg-white">
                    <p>{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      Expires:{" "}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Mensajes</h2>
            <div className="mb-6">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="escribe un mensaje para todos lo usuarios..."
                className="mb-4"
              />
              <Button onClick={createMessage}>Publicar mensaje</Button>
            </div>

            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border p-3 rounded">
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-500">
                    Posted: {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-4 py-2 w-56 rounded flex items-center justify-center"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
