export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    avatar_url?: string;
  }
  
  export interface AuthResponse {
    message: string;
    token: string;
    user: User;
  }

  export interface RegisterResponse{
    message: string;
    user: User;
  }
  
  export interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  }