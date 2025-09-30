import api from './api';
import { jwtDecode } from 'jwt-decode';

class AuthService {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login/', credentials);
      const { user, tokens } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, tokens };
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      return decodedToken.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Get user role
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  // Check if user is admin
  isAdmin() {
    return this.getUserRole() === 'admin';
  }

  // Check if user is truck owner
  isTruckOwner() {
    return this.getUserRole() === 'user';
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile/', profileData);
      const updatedUser = response.data;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  }
}

export default new AuthService();
