import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || '',
});

export const authApi = {
    login: async (credentials: any) => {
        const response = await api.post('/user/login', credentials);
        console.log(response.data);
        return response.data;
    },

    register: async (userData: any) => {
        const response = await api.post('/user/register', userData);
        console.log(response.data);
        return response.data;
    },

    getCurrentUser: async (token: string) => {
        // We assume there is a /me or /user/me endpoint to fetch current user session
        // Adjust this endpoint if your backend uses a different path for fetching user details.
        const response = await api.get('/user/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(response.data);
        return response.data;
    }
};
