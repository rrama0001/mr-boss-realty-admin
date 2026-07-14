import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // points to /api
  withCredentials: true, // important for cookies
});

export default api;
