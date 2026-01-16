import { User } from "@supabase/supabase-js";

export interface UserProfile extends User {
  full_name: string;
  role: string;
}

export interface UserContextType {
  user: UserProfile | null;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
}
