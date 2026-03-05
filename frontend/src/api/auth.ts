import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || '',
});

export const authApi = {
    login: async (credentials: any) => {
        const response = await api.post('/login', credentials);
        return response.data;
    },

    register: async (userData: any) => {
        const response = await api.post('/register', userData);
        return response.data;
    },

    getCurrentUser: async (token: string) => {
        // We assume there is a /me or /user/me endpoint to fetch current user session
        // Adjust this endpoint if your backend uses a different path for fetching user details.
        const response = await api.get('/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
};
