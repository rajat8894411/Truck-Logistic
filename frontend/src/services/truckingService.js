import api from './api';

class TruckingService {
  // Dashboard APIs
  async getAdminDashboard() {
    const response = await api.get('/dashboard/admin/');
    return response.data;
  }

  async getTruckOwnerDashboard() {
    const response = await api.get('/dashboard/truck-owner/');
    return response.data;
  }

  // Requirements APIs
  async getRequirements(params = {}) {
    const response = await api.get('/requirements/', { params });
    return response.data;
  }

  async getRequirement(id) {
    const response = await api.get(`/requirements/${id}/`);
    return response.data;
  }

  async createRequirement(data) {
    const response = await api.post('/requirements/', data);
    return response.data;
  }

  async updateRequirement(id, data) {
    const response = await api.put(`/requirements/${id}/`, data);
    return response.data;
  }

  async deleteRequirement(id) {
    const response = await api.delete(`/requirements/${id}/`);
    return response.data;
  }

  async getRequirementBids(id) {
    const response = await api.get(`/requirements/${id}/bids/`);
    return response.data;
  }

  async searchRequirements(params) {
    const response = await api.get('/search/requirements/', { params });
    return response.data;
  }

  // Trucks APIs
  async getTrucks() {
    const response = await api.get('/trucks/');
    return response.data;
  }

  async getTruck(id) {
    const response = await api.get(`/trucks/${id}/`);
    return response.data;
  }

  async createTruck(data) {
    const response = await api.post('/trucks/', data);
    return response.data;
  }

  async updateTruck(id, data) {
    const response = await api.put(`/trucks/${id}/`, data);
    return response.data;
  }

  async deleteTruck(id) {
    const response = await api.delete(`/trucks/${id}/`);
    return response.data;
  }

  // Bids APIs
  async getBids() {
    const response = await api.get('/bids/');
    return response.data;
  }

  async getBid(id) {
    const response = await api.get(`/bids/${id}/`);
    return response.data;
  }

  async createBid(data) {
    const response = await api.post('/bids/', data);
    return response.data;
  }

  async updateBid(id, data) {
    const response = await api.put(`/bids/${id}/`, data);
    return response.data;
  }

  async patchBid(id, data) {
    const response = await api.patch(`/bids/${id}/`, data);
    return response.data;
  }

  async respondToBid(id, data) {
    const response = await api.patch(`/bids/${id}/respond/`, data);
    return response.data;
  }

  async deleteBid(id) {
    const response = await api.delete(`/bids/${id}/`);
    return response.data;
  }

  // Orders APIs
  async getOrders() {
    const response = await api.get('/orders/');
    return response.data;
  }

  async getOrder(id) {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  }

  async updateOrderStatus(id, data) {
    const response = await api.patch(`/orders/${id}/update_status/`, data);
    return response.data;
  }

  // Location APIs
  async getLocations(orderId) {
    const response = await api.get('/locations/', { 
      params: orderId ? { order_id: orderId } : {} 
    });
    return response.data;
  }

  async createLocation(data) {
    const response = await api.post('/locations/', data);
    return response.data;
  }

  async getCurrentLocation(orderId) {
    const response = await api.get(`/orders/${orderId}/current-location/`);
    return response.data;
  }

  async getOrderLocations(orderId) {
    const response = await api.get('/locations/', { params: { order_id: orderId } });
    return response.data;
  }

  // Notifications APIs
  async getNotifications() {
    const response = await api.get('/notifications/');
    return response.data;
  }

  async markNotificationRead(id) {
    const response = await api.patch(`/notifications/${id}/mark_read/`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await api.patch('/notifications/mark_all_read/');
    return response.data;
  }

  // Profile APIs
  async getProfile() {
    const response = await api.get('/auth/profile/');
    return response.data;
  }

  async updateProfile(data) {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  }

  async changePassword(data) {
    const response = await api.put('/auth/change-password/', data);
    return response.data;
  }
}

export default new TruckingService();
