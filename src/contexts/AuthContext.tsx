import { createContext } from 'react';

export interface AuthContextType {
  user: { id: string; email?: string } | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
