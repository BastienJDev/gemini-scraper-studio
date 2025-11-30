import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import users from "@/data/users.json";

type AuthUser = {
  email: string;
  password: string;
};

const AUTH_STORAGE_KEY = "vyzion-auth-token";
const AUTH_USER_KEY = "vyzion-auth-user";

type AuthContextValue = {
  isAuthenticated: boolean;
  userEmail?: string;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedEmail = localStorage.getItem(AUTH_USER_KEY);
    if (storedAuth === "true" && storedEmail) {
      setIsAuthenticated(true);
      setUserEmail(storedEmail);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const login = (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const match = (users as AuthUser[]).find(
        (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
      );

      if (match) {
        setIsAuthenticated(true);
        setUserEmail(match.email);
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        localStorage.setItem(AUTH_USER_KEY, match.email);
        return true;
      }

      return false;
    };

    const logout = () => {
      setIsAuthenticated(false);
      setUserEmail(undefined);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    };

    return { isAuthenticated, userEmail, login, logout };
  }, [isAuthenticated, userEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
