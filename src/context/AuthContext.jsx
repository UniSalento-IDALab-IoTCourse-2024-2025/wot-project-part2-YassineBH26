import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function checkAuth() {
    try {
      const data = await fetchCurrentUser();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  async function login(username, password) {
    const data = await apiLogin(username, password);
    setUser(data.user);
    return data.user;
  }

  async function signup(userData) {
    return apiSignup(userData);
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}