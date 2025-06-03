const API_BASE_URL = 'http://localhost:3000/api';

const API_ENDPOINTS = {
    auth: {
        login: `${API_BASE_URL}/auth/login`,
        register: `${API_BASE_URL}/auth/register`,
        profile: `${API_BASE_URL}/auth/profile`
    },
    tasks: {
        base: `${API_BASE_URL}/tasks`,
        stats: `${API_BASE_URL}/tasks/stats`,
        get: (id) => `${API_BASE_URL}/tasks/${id}`,
        update: (id) => `${API_BASE_URL}/tasks/${id}`,
        delete: (id) => `${API_BASE_URL}/tasks/${id}`
    },
    categories: {
        base: `${API_BASE_URL}/categories`,
        get: (id) => `${API_BASE_URL}/categories/${id}`,
        update: (id) => `${API_BASE_URL}/categories/${id}`,
        delete: (id) => `${API_BASE_URL}/categories/${id}`
    },
    users: {
        settings: `${API_BASE_URL}/users/settings`,
        uploadImage: `${API_BASE_URL}/users/upload-image`,
        deleteImage: `${API_BASE_URL}/users/delete-image`
    }
};

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Set auth token to localStorage
const setAuthToken = (token) => localStorage.setItem('authToken', token);

// Remove auth token from localStorage
const removeAuthToken = () => localStorage.removeItem('authToken');

// Get auth headers for API requests
const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Get profile image URL with fallback to default
const getProfileImageUrl = (imageUrl) => {
    return imageUrl || 'images/default-user.jpg';
};
