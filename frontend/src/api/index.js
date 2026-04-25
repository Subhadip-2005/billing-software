import axios from "axios";

const API = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000") + "/api";

// Auto-attach token to every request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const loginUser = (data) => axios.post(`${API}/auth/login`, data);
export const getMe = () => axios.get(`${API}/auth/me`);

// Medicines
export const getMedicines = (params) => axios.get(`${API}/medicines`, { params });
export const addMedicine = (data) => axios.post(`${API}/medicines`, data);
export const updateMedicine = (id, data) => axios.put(`${API}/medicines/${id}`, data);
export const deleteMedicine = (id) => axios.delete(`${API}/medicines/${id}`);
export const getMedicineByBarcode = (barcode) => axios.get(`${API}/medicines/barcode/${barcode}`);

// Customers
export const getCustomers = (params) => axios.get(`${API}/customers`, { params });
export const addCustomer = (data) => axios.post(`${API}/customers`, data);
export const getCustomerHistory = (id) => axios.get(`${API}/customers/${id}/history`);

// Invoices
export const createInvoice = (data) => axios.post(`${API}/invoices`, data);
export const getInvoices = (params) => axios.get(`${API}/invoices`, { params });
export const getInvoiceById = (id) => axios.get(`${API}/invoices/${id}`);

// Reports
export const getDashboardStats = () => axios.get(`${API}/reports/dashboard`);
export const getSalesReport = (params) => axios.get(`${API}/reports/sales`, { params });
export const getLowStockAlerts = () => axios.get(`${API}/reports/low-stock`);
export const getExpiryAlerts = () => axios.get(`${API}/reports/expiry`);