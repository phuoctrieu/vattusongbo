import { ToolCondition } from '../types';

const BASE_URL = '/api'; // Nginx sẽ proxy request bắt đầu bằng /api xuống backend

// Helper để gọi API
const request = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Materials
  getMaterials: () => request('/materials'),
  addMaterial: (data: any) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id: number, data: any) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id: number) => request(`/materials/${id}`, { method: 'DELETE' }),

  // Warehouses
  getWarehouses: () => request('/warehouses'),
  addWarehouse: (name: string, location: string) => request('/warehouses', { method: 'POST', body: JSON.stringify({ name, location }) }),
  updateWarehouse: (id: number, name: string, location: string) => request(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify({ name, location }) }),
  deleteWarehouse: (id: number) => request(`/warehouses/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  addSupplier: (data: any) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: any) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: number) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Users & Auth
  getUsers: () => request('/users'),
  addUser: (user: any) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
  deleteUser: (id: number) => request(`/users/${id}`, { method: 'DELETE' }),
  login: (username: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Transactions
  getTransactions: () => request('/transactions'),
  stockIn: (data: any) => request('/transactions/in', { method: 'POST', body: JSON.stringify(data) }),
  stockOut: (data: any) => request('/transactions/out', { method: 'POST', body: JSON.stringify(data) }),
  borrowTool: (data: any) => request('/transactions/borrow', { method: 'POST', body: JSON.stringify(data) }),
  returnTool: (borrowId: number, returnDate: string, condition: ToolCondition) => 
    request('/transactions/return', { method: 'POST', body: JSON.stringify({ borrowId, returnDate, condition }) }),
  
  // Others
  createInventoryCheck: (data: any) => request('/inventory-checks', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryChecks: () => request('/inventory-checks'),
  getLogs: () => request('/logs'),
};