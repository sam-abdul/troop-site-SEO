import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { type UserDetails } from "../types/user";

interface AuthContextValue {
  eventUserID: string | null;
  eventFullUserDetails: UserDetails | null;
  setEventFullUserDetails: React.Dispatch<
    React.SetStateAction<UserDetails | null>
  >;
  setEventUserID: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [eventUserID, setEventUserID] = useState<string | null>(null);
  const [eventFullUserDetails, setEventFullUserDetails] =
    useState<UserDetails | null>(null);

  const value: AuthContextValue = {
    eventFullUserDetails,
    setEventFullUserDetails,
    eventUserID,
    setEventUserID,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
