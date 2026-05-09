import axios from "axios";
import { getToken, removeToken } from "./auth";
import { AuthResponse, LoginPayload, SignupPayload, User } from "@/types/user";
import { Blog, BlogListResponse, GenerateRequest } from "@/types/blog";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: async (payload: SignupPayload) => {
    const { data } = await api.post<AuthResponse>("/api/auth/signup", payload);
    return data;
  },
  login: async (payload: LoginPayload) => {
    const { data } = await api.post<AuthResponse>("/api/auth/login", payload);
    return data;
  },
  me: async () => {
    const { data } = await api.get<User>("/api/auth/me");
    return data;
  },
};

export const blogAPI = {
  generate: async (payload: GenerateRequest) => {
    const { data } = await api.post<Blog>("/api/blog/generate", payload);
    return data;
  },
  list: async () => {
    const { data } = await api.get<BlogListResponse>("/api/blog/list");
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<Blog>(`/api/blog/${id}`);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/api/blog/${id}`);
  },
};

export default api;
