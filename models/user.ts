export interface User {
  id: number;
  name?: string;
  email: string;
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  id?: number;
  name?: string;
  mail?: string;
  profile_picture?: string;
}