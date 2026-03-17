import { authResponseSchema } from '@/schema/authResponse';
import type { loginSchema } from '@/schema/loginCred';
import { registerSchema } from '@/schema/resgisterCred';
import axios from 'axios';
import type z from 'zod';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || '',
});


export const authApi = {
  login: async (credentials: z.infer<typeof loginSchema>) => {
    const response = await api.post("/api/v1/user/login", credentials);

    console.log(response.data);
    return authResponseSchema.parse(response.data);
  },

  register: async (userData: z.infer<typeof registerSchema>) => {
    const response = await api.post("/api/v1/user/register", userData);
    console.log(response.data);
    return authResponseSchema.parse(response.data);
  },

  getCurrentUser: async (token: string) => {
    // We assume there is a /me or /user/me endpoint to fetch current user session
    // Adjust this endpoint if your backend uses a different path for fetching user details.
    const response = await api.get("/api/v1/user/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return authResponseSchema.parse(response.data);
  },
};
