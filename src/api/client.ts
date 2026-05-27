import axios from 'axios';

// For local development: http://localhost:8000
// For production: https://api.washio.com (via env variable)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const adminLogin = (username: string, password: string) => 
  api.post('/auth/admin/login', { username, password });

// Orders
export const getAllOrders = () => api.get('/orders');
export const getOrder = (orderId: string) => api.get(`/orders/${orderId}`);
export const updateOrderStatus = (orderId: string, status: string) => 
  api.put(`/orders/${orderId}/admin-status`, { status });
export const assignCourier = (orderId: string, courierId: string) => 
  api.put(`/orders/${orderId}/assign-courier`, { courier_id: courierId });
export const updatePaymentLink = (orderId: string, paymentLink: string) => 
  api.put(`/orders/${orderId}/payment-link`, { payment_link: paymentLink });
export const updatePaymentStatus = (orderId: string, paymentStatus: string) => 
  api.put(`/orders/${orderId}/payment-status`, { payment_status: paymentStatus });
export const approvePhotos = (orderId: string) => 
  api.put(`/orders/${orderId}/approve-photos`);
export const approvePhotosAfter = (orderId: string) => 
  api.put(`/orders/${orderId}/approve-photos-after`);
export const adminCancelOrder = (orderId: string) => 
  api.put(`/orders/${orderId}/admin-cancel`);
export const editOrder = (orderId: string, data: {
  location?: string;
  scheduled_time?: string;
  car_name?: string;
  car_plate?: string;
  car_color?: string;
  price?: number;
  client_phone?: string;
}) => api.put(`/orders/${orderId}/edit`, data);

// Couriers
export const getAllCouriers = () => api.get('/couriers');
export const createCourier = (data: { name: string; phone: string; password: string; whatsapp?: string }) => 
  api.post('/couriers', data);
export const updateCourier = (courierId: string, data: { name?: string; phone?: string; password?: string; whatsapp?: string; is_active?: boolean }) => 
  api.put(`/couriers/${courierId}`, data);
export const deleteCourier = (courierId: string) => api.delete(`/couriers/${courierId}`);

// Settings
export const getSettings = () => api.get('/settings');
export const getServicePrice = () => api.get('/settings/price');
export const updateServicePrice = (price: number) => api.put('/settings/price', { price });

// Admins
export const getAllAdmins = () => api.get('/admins');
export const createAdmin = (data: { username: string; password: string }) => 
  api.post('/admins', data);
export const updateAdmin = (adminId: string, data: { username?: string; password?: string }) => 
  api.put(`/admins/${adminId}`, data);
export const deleteAdmin = (adminId: string) => api.delete(`/admins/${adminId}`);

// Seed
export const seedData = () => api.post('/seed');

export default api;
