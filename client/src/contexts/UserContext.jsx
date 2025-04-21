import React, { createContext, useContext } from "react";
import { useAuth } from "@clerk/clerk-react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, isLoaded } = useAuth();

  return (
    <UserContext.Provider value={{ user, loading: !isLoaded }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
