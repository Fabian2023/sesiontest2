
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/app";

const GuestDashboard = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data as Message[]);
      }
      
      setLoading(false);
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [payload.new as Message, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {profile?.full_name}!</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Messages from Admin</h2>
        
        {loading ? (
          <div>Loading messages...</div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="border p-4 rounded">
                <p className="mb-2">{message.content}</p>
                <p className="text-xs text-gray-500">
                  Posted: {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No messages available.</p>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
