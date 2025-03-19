
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Profile, Invitation, Message } from "@/types/app";

const AdminDashboard = () => {
  const { user } = useAuth();
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
      .from('profiles')
      .select('*');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } else {
      setUsers(usersData as Profile[]);
    }
    
    // Fetch invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from('invitations')
      .select('*');
    
    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      toast({ title: "Error", description: "Failed to load invitations", variant: "destructive" });
    } else {
      setInvitations(invitationsData as Invitation[]);
    }
    
    // Fetch messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*');
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    } else {
      setMessages(messagesData as Message[]);
    }
    
    setLoading(false);
  };

  const createInvitation = async () => {
    if (!newEmail.trim() || !user) return;
    
    const token = Math.random().toString(36).substring(2, 15);
    
    const { error } = await supabase
      .from('invitations')
      .insert({
        email: newEmail,
        token,
        created_by: user.id
      });
    
    if (error) {
      console.error('Error creating invitation:', error);
      toast({ title: "Error", description: "Failed to create invitation", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Invitation created successfully" });
      setNewEmail("");
      fetchData();
    }
  };

  const createMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        created_by: user.id
      });
    
    if (error) {
      console.error('Error creating message:', error);
      toast({ title: "Error", description: "Failed to create message", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Message created successfully" });
      setNewMessage("");
      fetchData();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
            <div className="space-y-4">
              {users.map((profile) => (
                <div key={profile.id} className="border p-3 rounded">
                  <p><strong>{profile.full_name}</strong></p>
                  <p className="text-sm text-gray-500">Role: {profile.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Invitations</h2>
            <div className="mb-6">
              <div className="flex space-x-2 mb-4">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email address"
                />
                <Button onClick={createInvitation}>Invite</Button>
              </div>

              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="border p-3 rounded">
                    <p>{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {invitation.accepted ? 'Accepted' : 'Pending'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <div className="mb-6">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message for all users..."
                className="mb-4"
              />
              <Button onClick={createMessage}>Post Message</Button>
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
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
