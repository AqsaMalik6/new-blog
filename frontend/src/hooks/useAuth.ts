import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { getToken, removeToken, setToken } from "@/lib/auth";
import { LoginPayload, SignupPayload, User } from "@/types/user";
import { toast } from "sonner";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authAPI.me();
        setUser(userData);
      } catch (error) {
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    try {
      const data = await authAPI.login(payload);
      setToken(data.access_token);
      setUser(data.user);
      router.push("/workspace");
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Invalid email or password";
      toast.error(msg);
      throw error;
    }
  };

  const signup = async (payload: SignupPayload) => {
    try {
      const data = await authAPI.signup(payload);
      setToken(data.access_token);
      setUser(data.user);
      router.push("/workspace");
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Signup failed";
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    isLoading,
    login,
    signup,
    logout,
  };
};
