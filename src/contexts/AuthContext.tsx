import { createContext } from 'react';

export interface AuthContextType {
  user: { 
    id: string; 
    email?: string; 
    user_metadata?: {
      role?: string;
    }
  } | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
