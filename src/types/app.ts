
import type { Database } from "@/integrations/supabase/types";

// App role type based on the enum in the database
export type AppRole = 'admin' | 'guest';

// Profile type based on our profiles table
export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  role: AppRole;
}

// Invitation type based on our invitations table
export interface Invitation {
  id: string;
  email: string;
  token: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
  accepted_at: string | null;
}

// Message type based on our messages table
export interface Message {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Export database type from Supabase for convenience
export type { Database };
