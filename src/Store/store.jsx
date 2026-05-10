// store.js
import { configureStore, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ==============================================
// 📡 API Configuration
// ==============================================

// Use a hardcoded URL or a window environment variable
const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Error handler helper
const handleError = (error, thunkAPI) => {
  const message = error.response?.data?.message || error.message || "Une erreur est survenue";
  return thunkAPI.rejectWithValue(message);
};

// ==============================================
// 🔐 AUTH ACTIONS
// ==============================================

export const login = createAsyncThunk("auth/login", async (credentials, thunkAPI) => {
  try {
    const response = await api.post("/login", credentials);
    const { user, token, message } = response.data;
    
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    
    return { user, token };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    await api.post("/logout");
  } catch (error) {
    // Ignore logout errors
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
});

export const fetchMe = createAsyncThunk("auth/me", async (_, thunkAPI) => {
  try {
    const response = await api.get("/me");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📝 CHECK/REMISE ACTIONS
// ==============================================

export const fetchChecks = createAsyncThunk("checks/fetchAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/checks${params ? `?${params}` : ""}`);
    return response.data.checks || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCheckById = createAsyncThunk("checks/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/checks/${id}`);
    return response.data.check || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createCheck = createAsyncThunk("checks/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/checks", data);
    return response.data.check || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateCheck = createAsyncThunk("checks/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/checks/${id}`, data);
    return response.data.check || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteCheck = createAsyncThunk("checks/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/checks/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const uploadCheckFiles = createAsyncThunk("checks/uploadFiles", async ({ id, files }, thunkAPI) => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files[]", file);
    });
    
    const response = await api.post(`/checks/${id}/upload-files`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { id, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteCheckFile = createAsyncThunk("checks/deleteFile", async ({ id, fileName }, thunkAPI) => {
  try {
    await api.delete(`/checks/${id}/files/${fileName}`);
    return { id, fileName };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCheckSummary = createAsyncThunk("checks/fetchSummary", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/checks/summary${params ? `?${params}` : ""}`);
    return response.data.summary || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCheckFilterOptions = createAsyncThunk("checks/fetchFilterOptions", async (_, thunkAPI) => {
  try {
    const response = await api.get("/checks/filter-options");
    return response.data.options || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const exportChecks = createAsyncThunk("checks/export", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/checks/export${params ? `?${params}` : ""}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 👥 CLIENT ACTIONS
// ==============================================

export const fetchClients = createAsyncThunk("clients/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/clients");
    return response.data.clients || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchClientById = createAsyncThunk("clients/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/clients/${id}`);
    return response.data.client || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createClient = createAsyncThunk("clients/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/clients", data);
    return response.data.client || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateClient = createAsyncThunk("clients/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/clients/${id}`, data);
    return response.data.client || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteClient = createAsyncThunk("clients/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/clients/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const searchClients = createAsyncThunk("clients/search", async (query, thunkAPI) => {
  try {
    const response = await api.get(`/clients/search?q=${query}`);
    return response.data.clients || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getClientVehicles = createAsyncThunk("clients/getVehicles", async (clientId, thunkAPI) => {
  try {
    const response = await api.get(`/clients/${clientId}/vehicles`);
    return { clientId, vehicles: response.data.vehicles || response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getClientSales = createAsyncThunk("clients/getSales", async (clientId, thunkAPI) => {
  try {
    const response = await api.get(`/clients/${clientId}/sales`);
    return { clientId, sales: response.data.sales || response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📦 PRODUCT ACTIONS
// ==============================================

export const fetchProducts = createAsyncThunk("products/fetchAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/produits${params ? `?${params}` : ""}`);
    return response.data.produits || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchProductById = createAsyncThunk("products/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/produits/${id}`);
    return response.data.produit || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createProduct = createAsyncThunk("products/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/produits", data);
    return response.data.produit || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateProduct = createAsyncThunk("products/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/produits/${id}`, data);
    return response.data.produit || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteProduct = createAsyncThunk("products/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/produits/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCategories = createAsyncThunk("products/fetchCategories", async (_, thunkAPI) => {
  try {
    const response = await api.get("/produits-categories");
    return response.data.categories || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const addDevicesToProduct = createAsyncThunk("products/addDevices", async ({ productId, imeis }, thunkAPI) => {
  try {
    const response = await api.post(`/produits/${productId}/devices`, { imeis });
    return { productId, devices: response.data.devices || response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 🚗 VEHICLE ACTIONS
// ==============================================

export const fetchVehicles = createAsyncThunk("vehicles/fetchAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/vehicules${params ? `?${params}` : ""}`);
    return response.data.vehicules || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchVehicleById = createAsyncThunk("vehicles/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/vehicules/${id}`);
    return response.data.vehicule || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createVehicle = createAsyncThunk("vehicles/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/vehicules", data);
    return response.data.vehicule || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateVehicle = createAsyncThunk("vehicles/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/vehicules/${id}`, data);
    return response.data.vehicule || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteVehicle = createAsyncThunk("vehicles/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/vehicules/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const assignDeviceToVehicle = createAsyncThunk("vehicles/assignDevice", async ({ vehicleId, gps_device_id }, thunkAPI) => {
  try {
    const response = await api.post(`/vehicules/${vehicleId}/assign-device`, { gps_device_id });
    return { vehicleId, device: response.data.device || response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const removeDeviceFromVehicle = createAsyncThunk("vehicles/removeDevice", async ({ vehicleId, gps_device_id }, thunkAPI) => {
  try {
    await api.delete(`/vehicules/${vehicleId}/remove-device`, { data: { gps_device_id } });
    return { vehicleId, deviceId: gps_device_id };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📍 GPS DEVICE ACTIONS
// ==============================================

export const fetchGpsDevices = createAsyncThunk("gpsDevices/fetchAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/gps-devices${params ? `?${params}` : ""}`);
    return response.data.devices || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchGpsDeviceById = createAsyncThunk("gpsDevices/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/gps-devices/${id}`);
    return response.data.device || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createGpsDevice = createAsyncThunk("gpsDevices/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/gps-devices", data);
    return response.data.device || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateGpsDevice = createAsyncThunk("gpsDevices/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/gps-devices/${id}`, data);
    return response.data.device || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteGpsDevice = createAsyncThunk("gpsDevices/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/gps-devices/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const bulkImportGpsDevices = createAsyncThunk("gpsDevices/bulkImport", async ({ produit_id, imeis }, thunkAPI) => {
  try {
    const response = await api.post("/gps-devices/bulk-import", { produit_id, imeis });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getAvailableDevices = createAsyncThunk("gpsDevices/getAvailable", async (productId, thunkAPI) => {
  try {
    const response = await api.get(`/produits/${productId}/available-devices`);
    return { productId, devices: response.data.devices || response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 💰 SALE ACTIONS
// ==============================================

export const fetchSales = createAsyncThunk("sales/fetchAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/ventes${params ? `?${params}` : ""}`);
    return response.data.ventes || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchSaleById = createAsyncThunk("sales/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/ventes/${id}`);
    return response.data.vente || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});
export const createSale = createAsyncThunk("sales/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/ventes", data);
    return response.data.vente || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const confirmSale = createAsyncThunk("sales/confirm", async (id, thunkAPI) => {
  try {
    const response = await api.post(`/ventes/${id}/confirm`);
    return response.data.vente || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const cancelSale = createAsyncThunk("sales/cancel", async (id, thunkAPI) => {
  try {
    const response = await api.post(`/ventes/${id}/cancel`);
    return response.data.vente || { id, status: "cancelled" };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteSale = createAsyncThunk("sales/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/ventes/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchSaleStats = createAsyncThunk("sales/fetchStats", async (_, thunkAPI) => {
  try {
    const response = await api.get("/sales/stats");
    return response.data.stats || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateSale = createAsyncThunk("sales/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/ventes/${id}`, data);
    return response.data.vente || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📍 GPS ACTIVATION ACTIONS (UPDATED with new fields)
// ==============================================

export const fetchSalesForActivation = createAsyncThunk("activations/fetchSales", async (_, thunkAPI) => {
  try {
    const response = await api.get("/activations/sales");
    return response.data.sales || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchSaleActivationDetails = createAsyncThunk("activations/fetchSaleDetails", async (saleId, thunkAPI) => {
  try {
    const response = await api.get(`/activations/sales/${saleId}/details`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const activateDevices = createAsyncThunk("activations/activate", async ({ saleId, activations }, thunkAPI) => {
  try {
    const response = await api.post(`/activations/sales/${saleId}/activate`, { activations });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchActivations = createAsyncThunk("activations/fetchAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/activations${params ? `?${params}` : ""}`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchActivationById = createAsyncThunk("activations/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/activations/${id}`);
    return response.data.activation || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateActivation = createAsyncThunk("activations/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/activations/${id}`, data);
    return response.data.activation || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteActivation = createAsyncThunk("activations/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/activations/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchActivationStats = createAsyncThunk("activations/fetchStats", async (_, thunkAPI) => {
  try {
    const response = await api.get("/activations/stats");
    return response.data.stats || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const renewActivation = createAsyncThunk("activations/renew", async ({ id, plan_abonnement, price }, thunkAPI) => {
  try {
    const response = await api.post(`/activations/${id}/renew`, { plan_abonnement, price });
    return response.data.activation || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const suspendActivation = createAsyncThunk("activations/suspend", async ({ id, reason }, thunkAPI) => {
  try {
    const response = await api.post(`/activations/${id}/suspend`, { reason });
    return response.data.activation || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const reactivateActivation = createAsyncThunk("activations/reactivate", async (id, thunkAPI) => {
  try {
    const response = await api.post(`/activations/${id}/reactivate`);
    return response.data.activation || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const bulkActivateDevices = createAsyncThunk("activations/bulkActivate", async ({ saleId, activations }, thunkAPI) => {
  try {
    const response = await api.post(`/activations/sales/${saleId}/bulk-activate`, { activations });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const exportActivations = createAsyncThunk("activations/export", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/activations/export${params ? `?${params}` : ""}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 💰 SALE PAYMENT ACTIONS
// ==============================================

export const addSalePayment = createAsyncThunk("sales/addPayment", async ({ id, amount, method, reference, notes }, thunkAPI) => {
  try {
    const response = await api.post(`/ventes/${id}/payments`, { amount, method, reference, notes });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getSalePaymentHistory = createAsyncThunk("sales/getPaymentHistory", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/ventes/${id}/payments`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateSalePaymentInfo = createAsyncThunk("sales/updatePaymentInfo", async ({ id, payment_due_date, payment_method }, thunkAPI) => {
  try {
    const response = await api.put(`/ventes/${id}/payment`, { payment_due_date, payment_method });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateSalePayment = createAsyncThunk("sales/updatePayment", async ({ saleId, paymentId, amount, method, reference }, thunkAPI) => {
  try {
    const response = await api.put(`/ventes/${saleId}/payments/${paymentId}`, { amount, method, reference });
    return { saleId, paymentId, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteSalePayment = createAsyncThunk("sales/deletePayment", async ({ saleId, paymentId }, thunkAPI) => {
  try {
    const response = await api.delete(`/ventes/${saleId}/payments/${paymentId}`);
    return { saleId, paymentId, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 👤 USER ACTIONS
// ==============================================

export const fetchUsers = createAsyncThunk("users/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/utilisateurs");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchUserById = createAsyncThunk("users/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/utilisateurs/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createUser = createAsyncThunk("users/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/utilisateurs", data);
    return response.data.utilisateur || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateUser = createAsyncThunk("users/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/utilisateurs/${id}`, data);
    return response.data.utilisateur || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteUser = createAsyncThunk("users/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/utilisateurs/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const toggleUserStatus = createAsyncThunk("users/toggleStatus", async (id, thunkAPI) => {
  try {
    const response = await api.patch(`/utilisateurs/${id}/toggle-status`);
    return response.data.user || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 👤 PROFILE ACTIONS
// ==============================================

export const fetchProfile = createAsyncThunk("profile/fetch", async (_, thunkAPI) => {
  try {
    const response = await api.get("/profile");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateProfile = createAsyncThunk("profile/update", async (data, thunkAPI) => {
  try {
    const response = await api.put("/profile", data);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const changePassword = createAsyncThunk("profile/changePassword", async (data, thunkAPI) => {
  try {
    const response = await api.put("/profile/change-password", data);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📊 DASHBOARD STATS
// ==============================================

export const fetchDashboardStats = createAsyncThunk("dashboard/fetchStats", async (_, thunkAPI) => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 🎯 SLICES
// ==============================================

// Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user") || "null"),
    token: localStorage.getItem("token"),
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem("token"),
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    updateAuthUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload.user) {
          state.user = { ...state.user, ...action.payload.user };
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      });
  },
});

// Checks Slice
const checksSlice = createSlice({
  name: "checks",
  initialState: {
    list: [],
    selected: null,
    summary: null,
    filterOptions: {
      villes: [],
      codes_agence: [],
      noms_agence: [],
      types_remise: [],
      clients: [],
    },
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
  },
  reducers: {
    clearCheckError: (state) => {
      state.error = null;
    },
    clearSelectedCheck: (state) => {
      state.selected = null;
    },
    setPage: (state, action) => {
      state.pagination.current_page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChecks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChecks.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.list = action.payload.data;
          state.pagination = {
            current_page: action.payload.current_page || 1,
            last_page: action.payload.last_page || 1,
            per_page: action.payload.per_page || 15,
            total: action.payload.total || 0,
          };
        } else {
          state.list = Array.isArray(action.payload) ? action.payload : [];
        }
      })
      .addCase(fetchChecks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCheckById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCheckById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCheckById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCheck.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateCheck.fulfilled, (state, action) => {
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(deleteCheck.fulfilled, (state, action) => {
        state.list = state.list.filter(c => c.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
      })
      .addCase(uploadCheckFiles.fulfilled, (state, action) => {
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1 && action.payload.data.check) {
          state.list[index] = action.payload.data.check;
        }
        if (state.selected?.id === action.payload.id && action.payload.data.check) {
          state.selected = action.payload.data.check;
        }
      })
      .addCase(deleteCheckFile.fulfilled, (state, action) => {
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1 && action.payload.data?.check) {
          state.list[index] = action.payload.data.check;
        }
        if (state.selected?.id === action.payload.id && action.payload.data?.check) {
          state.selected = action.payload.data.check;
        }
      })
      .addCase(fetchCheckSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(fetchCheckFilterOptions.fulfilled, (state, action) => {
        state.filterOptions = action.payload;
      });
  },
});

// Clients Slice
const clientsSlice = createSlice({
  name: "clients",
  initialState: {
    list: [],
    selected: null,
    vehicles: {},
    sales: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearClientError: (state) => {
      state.error = null;
    },
    clearSelectedClient: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.list = state.list.filter(c => c.id !== action.payload);
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getClientVehicles.fulfilled, (state, action) => {
        state.vehicles[action.payload.clientId] = action.payload.vehicles;
      })
      .addCase(getClientSales.fulfilled, (state, action) => {
        state.sales[action.payload.clientId] = action.payload.sales;
      });
  },
});

// Products Slice
const productsSlice = createSlice({
  name: "products",
  initialState: {
    list: [],
    selected: null,
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

// Vehicles Slice
const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearVehicleError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.list.findIndex(v => v.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.list = state.list.filter(v => v.id !== action.payload);
      });
  },
});

// GPS Devices Slice
const gpsDevicesSlice = createSlice({
  name: "gpsDevices",
  initialState: {
    list: [],
    selected: null,
    availableByProduct: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearDeviceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGpsDevices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGpsDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchGpsDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchGpsDeviceById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createGpsDevice.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateGpsDevice.fulfilled, (state, action) => {
        const index = state.list.findIndex(d => d.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(deleteGpsDevice.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d.id !== action.payload);
      })
      .addCase(getAvailableDevices.fulfilled, (state, action) => {
        state.availableByProduct[action.payload.productId] = action.payload.devices;
      });
  },
});

// Sales Slice
const salesSlice = createSlice({
  name: "sales",
  initialState: {
    list: [],
    selected: null,
    stats: null,
    paymentHistory: null,
    paymentSummary: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSaleError: (state) => {
      state.error = null;
    },
    clearPaymentHistory: (state) => {
      state.paymentHistory = null;
      state.paymentSummary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSaleById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(confirmSale.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(cancelSale.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(deleteSale.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id !== action.payload);
      })
      .addCase(fetchSaleStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(updateSale.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(addSalePayment.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.vente.id);
        if (index !== -1) state.list[index] = action.payload.vente;
        if (state.selected?.id === action.payload.vente.id) state.selected = action.payload.vente;
        
        if (state.paymentHistory) {
          state.paymentHistory = [...(state.paymentHistory || []), action.payload.payment];
          state.paymentSummary = {
            total: action.payload.vente.total,
            amount_paid: action.payload.vente.amount_paid,
            remaining_amount: action.payload.vente.remaining_amount,
            payment_status: action.payload.vente.payment_status,
          };
        }
      })
      .addCase(getSalePaymentHistory.fulfilled, (state, action) => {
        state.paymentHistory = action.payload.payment_history;
        state.paymentSummary = action.payload.payment_summary;
      })
      .addCase(updateSalePaymentInfo.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.vente.id);
        if (index !== -1) state.list[index] = action.payload.vente;
        if (state.selected?.id === action.payload.vente.id) state.selected = action.payload.vente;
      })
      .addCase(updateSalePayment.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.saleId);
        if (index !== -1 && action.payload.data.vente) {
          state.list[index] = action.payload.data.vente;
        }
        if (state.selected?.id === action.payload.saleId && action.payload.data.vente) {
          state.selected = action.payload.data.vente;
        }
        if (state.paymentHistory && action.payload.data.payment_summary) {
          state.paymentSummary = action.payload.data.payment_summary;
        }
      })
      .addCase(deleteSalePayment.fulfilled, (state, action) => {
        const index = state.list.findIndex(s => s.id === action.payload.saleId);
        if (index !== -1 && action.payload.data.vente) {
          state.list[index] = action.payload.data.vente;
        }
        if (state.selected?.id === action.payload.saleId && action.payload.data.vente) {
          state.selected = action.payload.data.vente;
        }
        if (state.paymentHistory && action.payload.data.payment_summary) {
          state.paymentSummary = action.payload.data.payment_summary;
        }
      });
  },
});

// Activations Slice (UPDATED with new fields support)
const activationsSlice = createSlice({
  name: "activations",
  initialState: {
    sales: [],
    selectedSale: null,
    list: [],
    selected: null,
    stats: null,
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    },
  },
  reducers: {
    clearActivationError: (state) => {
      state.error = null;
    },
    clearSelectedSale: (state) => {
      state.selectedSale = null;
    },
    setActivationPage: (state, action) => {
      state.pagination.current_page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sales for activation
      .addCase(fetchSalesForActivation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesForActivation.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSalesForActivation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch sale activation details
      .addCase(fetchSaleActivationDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleActivationDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSale = action.payload;
      })
      .addCase(fetchSaleActivationDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Activate devices
      .addCase(activateDevices.pending, (state) => {
        state.loading = true;
      })
      .addCase(activateDevices.fulfilled, (state) => {
        state.loading = false;
        state.selectedSale = null;
      })
      .addCase(activateDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Bulk activate devices
      .addCase(bulkActivateDevices.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkActivateDevices.fulfilled, (state) => {
        state.loading = false;
        state.selectedSale = null;
      })
      .addCase(bulkActivateDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch all activations
      .addCase(fetchActivations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.pagination = {
          current_page: action.payload.current_page || 1,
          last_page: action.payload.last_page || 1,
          per_page: action.payload.per_page || 20,
          total: action.payload.total || 0,
        };
      })
      .addCase(fetchActivations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single activation
      .addCase(fetchActivationById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivationById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchActivationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update activation
      .addCase(updateActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      // Delete activation
      .addCase(deleteActivation.fulfilled, (state, action) => {
        state.list = state.list.filter(a => a.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
      })
      // Renew activation
      .addCase(renewActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      // Suspend activation
      .addCase(suspendActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      // Reactivate activation
      .addCase(reactivateActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      // Fetch stats
      .addCase(fetchActivationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

// Users Slice
const usersSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex(u => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(u => u.id !== action.payload);
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex(u => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

// Dashboard Slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ==============================================
// 🏪 CONFIGURE STORE
// ==============================================

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    checks: checksSlice.reducer,
    clients: clientsSlice.reducer,
    products: productsSlice.reducer,
    vehicles: vehiclesSlice.reducer,
    gpsDevices: gpsDevicesSlice.reducer,
    sales: salesSlice.reducer,
    users: usersSlice.reducer,
    dashboard: dashboardSlice.reducer,
    activations: activationsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// ==============================================
// 📤 EXPORT ACTIONS
// ==============================================

export const { clearAuthError, updateAuthUser } = authSlice.actions;
export const { clearClientError, clearSelectedClient } = clientsSlice.actions;
export const { clearProductError } = productsSlice.actions;
export const { clearVehicleError } = vehiclesSlice.actions;
export const { clearDeviceError } = gpsDevicesSlice.actions;
export const { clearSaleError, clearPaymentHistory } = salesSlice.actions;
export const { clearUserError } = usersSlice.actions;
export const { clearCheckError, clearSelectedCheck, setPage } = checksSlice.actions;
export const { clearActivationError, clearSelectedSale, setActivationPage } = activationsSlice.actions;

// ==============================================
// 📥 SELECTORS
// ==============================================

// Auth Selectors
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

// Checks Selectors
export const selectChecks = (state) => state.checks.list;
export const selectSelectedCheck = (state) => state.checks.selected;
export const selectChecksSummary = (state) => state.checks.summary;
export const selectChecksFilterOptions = (state) => state.checks.filterOptions;
export const selectChecksLoading = (state) => state.checks.loading;
export const selectChecksError = (state) => state.checks.error;
export const selectChecksPagination = (state) => state.checks.pagination;

// Clients Selectors
export const selectClients = (state) => state.clients.list;
export const selectSelectedClient = (state) => state.clients.selected;
export const selectClientsLoading = (state) => state.clients.loading;
export const selectClientVehicles = (state, clientId) => state.clients.vehicles[clientId] || [];
export const selectClientSales = (state, clientId) => state.clients.sales[clientId] || [];

// Products Selectors
export const selectProducts = (state) => state.products.list;
export const selectSelectedProduct = (state) => state.products.selected;
export const selectCategories = (state) => state.products.categories;
export const selectProductsLoading = (state) => state.products.loading;

// Vehicles Selectors
export const selectVehicles = (state) => state.vehicles.list;
export const selectSelectedVehicle = (state) => state.vehicles.selected;
export const selectVehiclesLoading = (state) => state.vehicles.loading;

// GPS Devices Selectors
export const selectGpsDevices = (state) => state.gpsDevices.list;
export const selectSelectedDevice = (state) => state.gpsDevices.selected;
export const selectAvailableDevices = (state, productId) => state.gpsDevices.availableByProduct[productId] || [];
export const selectDevicesLoading = (state) => state.gpsDevices.loading;

// Sales Selectors
export const selectSales = (state) => state.sales.list;
export const selectSelectedSale = (state) => state.sales.selected;
export const selectSaleStats = (state) => state.sales.stats;
export const selectSalesLoading = (state) => state.sales.loading;
export const selectPaymentHistory = (state) => state.sales.paymentHistory;
export const selectPaymentSummary = (state) => state.sales.paymentSummary;

// Activations Selectors
export const selectSalesForActivation = (state) => state.activations.sales;
export const selectSelectedSaleActivation = (state) => state.activations.selectedSale;
export const selectActivations = (state) => state.activations.list;
export const selectSelectedActivation = (state) => state.activations.selected;
export const selectActivationStats = (state) => state.activations.stats;
export const selectActivationsLoading = (state) => state.activations.loading;
export const selectActivationsError = (state) => state.activations.error;
export const selectActivationsPagination = (state) => state.activations.pagination;

// Users Selectors
export const selectUsers = (state) => state.users.list;
export const selectSelectedUser = (state) => state.users.selected;
export const selectUsersLoading = (state) => state.users.loading;

// Dashboard Selectors
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectDashboardLoading = (state) => state.dashboard.loading;

export default store;