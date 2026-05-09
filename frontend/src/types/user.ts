export interface User {
  id: string;
  email: string;
  brand_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupPayload {
  email: string;
  password: string;
  brand_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
