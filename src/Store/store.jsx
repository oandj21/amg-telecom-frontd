// store.js
import { configureStore, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ==============================================
// 📡 API Configuration
// ==============================================

const API_URL = window.REACT_APP_API_URL || "https://amg-telecom-backd-production.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  } catch (error) {}
  finally {
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

export const addTechnicianPaymentWithFiles = createAsyncThunk(
    "technicianPayments/addWithFiles", 
    async ({ userId, formData }, thunkAPI) => {
        try {
            const response = await api.post(`/technician-payments/${userId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            return handleError(error, thunkAPI);
        }
    }
);

export const downloadTechnicianPaymentFile = createAsyncThunk(
    "technicianPayments/downloadFile",
    async ({ userId, paymentId, fileId, fileName }, thunkAPI) => {
        try {
            const response = await api.get(
                `/technician-payments/${userId}/${paymentId}/files/${fileId}/download`,
                { responseType: 'blob' }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            return handleError(error, thunkAPI);
        }
    }
);

export const deleteTechnicianPaymentFile = createAsyncThunk(
    "technicianPayments/deleteFile",
    async ({ userId, paymentId, fileId }, thunkAPI) => {
        try {
            const response = await api.delete(`/technician-payments/${userId}/${paymentId}/files/${fileId}`);
            return { userId, paymentId, fileId, data: response.data };
        } catch (error) {
            return handleError(error, thunkAPI);
        }
    }
);

export const deleteTechnicianPaymentById = createAsyncThunk(
    "technicianPayments/deletePayment",
    async ({ userId, paymentId }, thunkAPI) => {
        try {
            const response = await api.delete(`/technician-payments/${userId}/${paymentId}`);
            return { userId, paymentId, data: response.data };
        } catch (error) {
            return handleError(error, thunkAPI);
        }
    }
);

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
    
    files.forEach((file, index) => {
      if (file instanceof File || file instanceof Blob) {
        formData.append(`files[${index}]`, file, file.name || `file_${index}`);
      } else if (file && file.file) {
        formData.append(`files[${index}]`, file.file, file.name);
      } else {
        formData.append(`files[${index}]`, file);
      }
    });
    
    console.log('Uploading files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    const response = await api.post(`/checks/${id}/upload-files`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { id, data: response.data };
  } catch (error) {
    console.error('Upload error details:', error.response?.data);
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

export const markChequeEncaisse = createAsyncThunk("checks/markEncaisse", async ({ checkId, saleId, paymentId }, thunkAPI) => {
  try {
    const response = await api.post(`/checks/${checkId}/mark-encaisse`, { sale_id: saleId, payment_id: paymentId });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📍 GPS ACTIVATION PAYMENT ACTIONS with payment_type
// ==============================================

export const fetchActivationPaymentHistory = createAsyncThunk("activations/fetchPaymentHistory", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/activations/${id}/payments`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const addActivationPayment = createAsyncThunk("activations/addPayment", async ({ id, amount, method, payment_type, reference, notes }, thunkAPI) => {
  try {
    const response = await api.post(`/activations/${id}/payments`, { 
      amount, 
      method, 
      payment_type,
      reference, 
      notes 
    });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const addActivationChequePayment = createAsyncThunk("activations/addChequePayment", async ({ id, amount, payment_type, cheque_number, bank_name, notes }, thunkAPI) => {
  try {
    const response = await api.post(`/activations/${id}/cheque-payment`, { 
      amount, 
      payment_type,
      cheque_number, 
      bank_name, 
      notes 
    });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateActivationPayment = createAsyncThunk("activations/updatePayment", async ({ id, paymentId, amount, method, payment_type, reference }, thunkAPI) => {
  try {
    const response = await api.put(`/activations/${id}/payments/${paymentId}`, { 
      amount, 
      method, 
      payment_type,
      reference 
    });
    return { id, paymentId, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteActivationPayment = createAsyncThunk("activations/deletePayment", async ({ id, paymentId }, thunkAPI) => {
  try {
    const response = await api.delete(`/activations/${id}/payments/${paymentId}`);
    return { id, paymentId, data: response.data };
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

export const fetchAvailableImeis = createAsyncThunk("gpsDevices/fetchAvailableImeis", async (_, thunkAPI) => {
  try {
    const response = await api.get("/gps-devices", { params: { status: 'available' } });
    const devices = response.data.devices || response.data;
    
    const imeis = devices.map(d => ({
      id: d.id,
      imei: d.imei,
      produit_id: d.produit_id,
      produit_nom: d.produit?.nom || 'GPS'
    }));
    return imeis;
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

export const addChequePayment = createAsyncThunk("sales/addChequePayment", async ({ id, amount, cheque_number, bank_name, notes }, thunkAPI) => {
  try {
    const response = await api.post(`/ventes/${id}/cheque-payment`, { amount, cheque_number, bank_name, notes });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getPendingChequePayments = createAsyncThunk("sales/getPendingChequePayments", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/ventes/${id}/pending-cheque-payments`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📍 GPS ACTIVATION ACTIONS
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
    // Add per_page=1000 to get all activations (or use 'all' if your backend supports it)
    const params = new URLSearchParams({ ...filters, per_page: 1000 }).toString();
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

export const createStandaloneActivation = createAsyncThunk("activations/createStandalone", async (data, thunkAPI) => {
  try {
    const response = await api.post("/activations/standalone", data);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createInstallation = createAsyncThunk("activations/createInstallation", async (data, thunkAPI) => {
  try {
    const response = await api.post("/installations", data);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📝 CHEQUE PAYMENTS (Combined Sales + Activations)
// ==============================================

export const fetchClientsWithChequePaymentsAll = createAsyncThunk("clients/fetchChequeClientsAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/payments/cheque-clients-all");
    return response.data.clients || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 💸 DEPENSE ACTIONS
// ==============================================

export const fetchDepenses = createAsyncThunk("depenses/fetchAll", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/depenses${params ? `?${params}` : ""}`);
    return response.data.depenses || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchDepenseById = createAsyncThunk("depenses/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/depenses/${id}`);
    return response.data.depense || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const createDepense = createAsyncThunk("depenses/create", async (data, thunkAPI) => {
  try {
    const response = await api.post("/depenses", data);
    return response.data.depense || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateDepense = createAsyncThunk("depenses/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/depenses/${id}`, data);
    return response.data.depense || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteDepense = createAsyncThunk("depenses/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/depenses/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchDepenseStats = createAsyncThunk("depenses/fetchStats", async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/depenses/stats${params ? `?${params}` : ""}`);
    return response.data.stats || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchDepenseCategories = createAsyncThunk("depenses/fetchCategories", async (_, thunkAPI) => {
  try {
    const response = await api.get("/depenses/categories");
    return response.data.categories || response.data;
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
// 💰 ADMIN PAYMENT ACTIONS
// ==============================================

export const addAdminPayment = createAsyncThunk("adminPayments/add", async ({ userId, amount, description, date }, thunkAPI) => {
  try {
    const response = await api.post(`/admin-payments/${userId}`, { amount, description, date });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getAdminPayments = createAsyncThunk("adminPayments/get", async (userId, thunkAPI) => {
  try {
    const response = await api.get(`/admin-payments/${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getAllAdminPayments = createAsyncThunk("adminPayments/getAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/all-admin-payments");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteAdminPayment = createAsyncThunk("adminPayments/delete", async ({ userId, paymentIndex }, thunkAPI) => {
  try {
    const response = await api.delete(`/admin-payments/${userId}/${paymentIndex}`);
    return { userId, paymentIndex, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 💰 TECHNICIAN PAYMENT ACTIONS
// ==============================================

export const addTechnicianPayment = createAsyncThunk("technicianPayments/add", async ({ userId, type, amount, count, date }, thunkAPI) => {
  try {
    const response = await api.post(`/technician-payments/${userId}`, { type, amount, count, date });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getTechnicianPayments = createAsyncThunk("technicianPayments/get", async (userId, thunkAPI) => {
  try {
    const response = await api.get(`/technician-payments/${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const getAllTechnicianPayments = createAsyncThunk("technicianPayments/getAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/all-technician-payments");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteTechnicianPayment = createAsyncThunk("technicianPayments/delete", async ({ userId, paymentIndex }, thunkAPI) => {
  try {
    const response = await api.delete(`/technician-payments/${userId}/${paymentIndex}`);
    return { userId, paymentIndex, data: response.data };
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
// ⚙️ SETTINGS ACTIONS
// ==============================================

export const fetchCompanyInfo = createAsyncThunk("settings/fetchCompanyInfo", async (_, thunkAPI) => {
  try {
    const response = await api.get("/settings/company");
    return response.data.company_info || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateCompanyInfo = createAsyncThunk("settings/updateCompanyInfo", async (data, thunkAPI) => {
  try {
    const response = await api.put("/settings/company", data);
    return response.data.company_info || response.data;
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
// 📋 TECHNICIAN REPORTS ACTIONS
// ==============================================

export const fetchTechnicianReports = createAsyncThunk("technicianReports/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/technician-reports");
    return response.data.reports || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchTechnicianReportById = createAsyncThunk("technicianReports/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/technician-reports/${id}`);
    return response.data.report || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const saveTechnicianReport = createAsyncThunk("technicianReports/save", async (data, thunkAPI) => {
  try {
    const response = await api.post("/technician-reports", data);
    return response.data.report || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteTechnicianReport = createAsyncThunk("technicianReports/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/technician-reports/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// ==============================================
// 📋 DASHBOARD REPORTS ACTIONS (Rapport Manuel)
// ==============================================

export const fetchReports = createAsyncThunk("reports/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/reports");
    return response.data.reports || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchReportById = createAsyncThunk("reports/fetchById", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/reports/${id}`);
    return response.data.report || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const saveReport = createAsyncThunk("reports/save", async (data, thunkAPI) => {
  try {
    const response = await api.post("/reports", data);
    return response.data.report || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateReport = createAsyncThunk("reports/update", async ({ id, ...data }, thunkAPI) => {
  try {
    const response = await api.put(`/reports/${id}`, data);
    return response.data.report || response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteReport = createAsyncThunk("reports/delete", async (id, thunkAPI) => {
  try {
    await api.delete(`/reports/${id}`);
    return id;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const downloadReport = createAsyncThunk("reports/download", async (id, thunkAPI) => {
  try {
    const response = await api.get(`/download-report/${id}`, {
      responseType: "blob",
    });
    return { id, blob: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});
// ==================== INVOICE ACTIONS ====================

// In store.jsx, verify these endpoints:
export const fetchNextInvoiceNumber = createAsyncThunk("invoices/fetchNextNumber", async (_, thunkAPI) => {
  try {
    const response = await api.get("/invoices/next-number");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCurrentInvoiceNumber = createAsyncThunk("invoices/fetchCurrentNumber", async (_, thunkAPI) => {
  try {
    const response = await api.get("/invoices/current-number");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const updateInvoiceCounter = createAsyncThunk("invoices/updateCounter", async (value, thunkAPI) => {
  try {
    const response = await api.post("/invoices/set-counter", { value });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const resetInvoiceCounterAction = createAsyncThunk("invoices/resetCounter", async (_, thunkAPI) => {
  try {
    const response = await api.post("/invoices/reset-counter");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCounterInfo = createAsyncThunk("invoices/fetchCounterInfo", async (_, thunkAPI) => {
  try {
    const response = await api.get("/invoices/counter-info");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// DEVIS management
export const fetchNextDevisNumber = createAsyncThunk("invoices/fetchNextDevis", async (_, thunkAPI) => {
  try {
    const response = await api.get("/invoices/next-devis");
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const saveDevis = createAsyncThunk("invoices/saveDevis", async ({ clientId, devisNumber }, thunkAPI) => {
  try {
    const response = await api.post("/invoices/track-devis", { client_id: clientId, devis_number: devisNumber });
    return response.data;
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchClientDevis = createAsyncThunk("invoices/fetchClientDevis", async (clientId, thunkAPI) => {
  try {
    const response = await api.get(`/invoices/client-devis/${clientId}`);
    return { clientId, devis: response.data.devis };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

// Individual invoice tracking (gray button)
export const saveIndividualInvoice = createAsyncThunk("invoices/saveIndividual", async ({ clientId, itemId, invoiceNumber }, thunkAPI) => {
  try {
    console.log('📤 SAVE INDIVIDUAL INVOICE - Payload:', { 
      client_id: clientId, 
      item_id: itemId, 
      invoice_number: invoiceNumber 
    });
    
    const response = await api.post("/invoices/track-individual", { 
      client_id: clientId, 
      item_id: itemId, 
      invoice_number: invoiceNumber 
    });
    
    console.log('📥 SAVE RESPONSE:', response.data);
    
    // Return the data in a consistent format
    return { 
      clientId, 
      itemId, 
      invoiceNumber, 
      data: response.data 
    };
  } catch (error) {
    console.error('❌ SAVE ERROR:', error.response?.data || error.message);
    return handleError(error, thunkAPI);
  }
});

export const checkIndividualInvoiceStatus = createAsyncThunk("invoices/checkIndividual", async ({ clientId, itemId }, thunkAPI) => {
  try {
    const response = await api.get(`/invoices/track-individual/${clientId}/${itemId}`);
    return { clientId, itemId, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchIndividualInvoiceNumber = createAsyncThunk("invoices/fetchIndividualNumber", async ({ clientId, itemId }, thunkAPI) => {
  try {
    const response = await api.get(`/invoices/track-individual/number/${clientId}/${itemId}`);
    return { clientId, itemId, invoiceNumber: response.data.invoice_number };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});
export const fetchGeneratedIndividualItems = createAsyncThunk("invoices/fetchGeneratedItems", async (clientId, thunkAPI) => {
  try {
    console.log('📤 API Call: GET /invoices/track-individual/items/', clientId);
    const response = await api.get(`/invoices/track-individual/items/${clientId}`);
    console.log('📥 API Response status:', response.status);
    console.log('📥 API Response data:', response.data);
    
    // The API returns { success: true, items: [...] }
    const items = response.data.items || [];
    console.log('📥 Extracted items:', items);
    
    return { clientId, items: items };
  } catch (error) {
    console.error('❌ Error fetching generated items:', error);
    return handleError(error, thunkAPI);
  }
});

// Combined invoice tracking (red button)
export const saveCombinedInvoice = createAsyncThunk("invoices/saveCombined", async ({ clientId, invoiceNumber, itemIds }, thunkAPI) => {
  try {
    const response = await api.post("/invoices/track-combined", { 
      client_id: clientId, 
      invoice_number: invoiceNumber, 
      item_ids: itemIds 
    });
    return { clientId, invoiceNumber, itemIds, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const checkCombinedInvoiceStatus = createAsyncThunk("invoices/checkCombined", async (clientId, thunkAPI) => {
  try {
    const response = await api.get(`/invoices/track-combined/${clientId}`);
    return { clientId, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCombinedInvoiceNumber = createAsyncThunk("invoices/fetchCombinedNumber", async (clientId, thunkAPI) => {
  try {
    const response = await api.get(`/invoices/track-combined/number/${clientId}`);
    return { clientId, invoiceNumber: response.data.invoice_number };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const fetchCombinedInvoiceItems = createAsyncThunk("invoices/fetchCombinedItems", async (clientId, thunkAPI) => {
  try {
    const response = await api.get(`/invoices/track-combined/items/${clientId}`);
    return { clientId, items: response.data.items };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const checkItemInCombinedStatus = createAsyncThunk("invoices/checkItemInCombined", async ({ clientId, itemId }, thunkAPI) => {
  try {
    const response = await api.get(`/invoices/track-combined/check-item/${clientId}/${itemId}`);
    return { clientId, itemId, inCombined: response.data.in_combined };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const removeItemFromCombined = createAsyncThunk("invoices/removeCombinedItem", async ({ clientId, itemId }, thunkAPI) => {
  try {
    const response = await api.delete(`/invoices/track-combined/item/${clientId}/${itemId}`);
    return { clientId, itemId, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});

export const deleteCombinedTrackingAction = createAsyncThunk("invoices/deleteCombined", async (clientId, thunkAPI) => {
  try {
    const response = await api.delete(`/invoices/track-combined/${clientId}`);
    return { clientId, data: response.data };
  } catch (error) {
    return handleError(error, thunkAPI);
  }
});
// ==============================================
// 🎯 UI SLICE (simple refresh counter)
// ==============================================
const uiSlice = createSlice({
  name: "ui",
  initialState: { refreshCounter: 0 },
  reducers: {
    triggerSidebarRefresh: (state) => {
      state.refreshCounter += 1;
    },
  },
});

export const { triggerSidebarRefresh } = uiSlice.actions;

// ==============================================
// 🔁 MIDDLEWARE – listens for successful mutations
// ==============================================
const refreshMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const actionTypes = [
    "checks/create/fulfilled",
    "checks/update/fulfilled",
    "checks/delete/fulfilled",
    "technicianPayments/deletePayment/fulfilled",
    "technicianPayments/addWithFiles/fulfilled",
    "activations/createStandalone/fulfilled",
    "activations/createInstallation/fulfilled",
    "activations/update/fulfilled",
    "activations/delete/fulfilled",
    "sales/create/fulfilled",
    "sales/update/fulfilled",
    "sales/delete/fulfilled",
    "sales/addPayment/fulfilled",
    "sales/updatePayment/fulfilled",
    "sales/deletePayment/fulfilled",
    "activations/addPayment/fulfilled",
    "activations/updatePayment/fulfilled",
    "activations/deletePayment/fulfilled",
  ];
  if (actionTypes.includes(action.type)) {
    store.dispatch(triggerSidebarRefresh());
  }
  return result;
};
// ==============================================
// 🎯 SLICES
// ==============================================

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

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    companyInfo: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
    },
    clearSettingsSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.companyInfo = action.payload;
        localStorage.setItem('company_info', JSON.stringify(action.payload));
      })
      .addCase(fetchCompanyInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCompanyInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCompanyInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.companyInfo = action.payload;
        state.success = true;
        localStorage.setItem('company_info', JSON.stringify(action.payload));
      })
      .addCase(updateCompanyInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

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

const gpsDevicesSlice = createSlice({
  name: "gpsDevices",
  initialState: {
    list: [],
    selected: null,
    availableByProduct: {},
    availableImeis: [],
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
      })
      .addCase(fetchAvailableImeis.fulfilled, (state, action) => {
        state.availableImeis = action.payload;
      });
  },
});

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

const depensesSlice = createSlice({
  name: "depenses",
  initialState: {
    list: [],
    selected: null,
    stats: null,
    categories: [],
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
    clearDepenseError: (state) => {
      state.error = null;
    },
    clearSelectedDepense: (state) => {
      state.selected = null;
    },
    setDepensePage: (state, action) => {
      state.pagination.current_page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepenses.fulfilled, (state, action) => {
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
      .addCase(fetchDepenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDepenseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepenseById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchDepenseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDepense.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateDepense.fulfilled, (state, action) => {
        const index = state.list.findIndex(d => d.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(deleteDepense.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
      })
      .addCase(fetchDepenseStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchDepenseCategories.fulfilled, (state, action) => {
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

// ==================== FIXED ACTIVATIONS SLICE ====================
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
    // Store full list for accurate counts across the app
    fullList: [],
    fullListLoaded: false,
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
    setFullList: (state, action) => {
      state.fullList = action.payload;
      state.fullListLoaded = true;
    },
  },
  extraReducers: (builder) => {
    builder
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
      // ==================== FIXED: Handle paginated response correctly ====================
      .addCase(fetchActivations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivations.fulfilled, (state, action) => {
        state.loading = false;
        
        const payload = action.payload;
        
        // Case 1: Response has data and pagination metadata
        if (payload && payload.data && Array.isArray(payload.data)) {
          state.list = payload.data;
          state.pagination = {
            current_page: payload.current_page || 1,
            last_page: payload.last_page || 1,
            per_page: payload.per_page || 20,
            total: payload.total || payload.data.length,
          };
        }
        // Case 2: Response has activations array and pagination metadata
        else if (payload && payload.activations && Array.isArray(payload.activations)) {
          state.list = payload.activations;
          state.pagination = {
            current_page: payload.current_page || 1,
            last_page: payload.last_page || 1,
            per_page: payload.per_page || 20,
            total: payload.total || payload.activations.length,
          };
        }
        // Case 3: Response is a plain array (no pagination metadata)
        else if (Array.isArray(payload)) {
          state.list = payload;
          // Calculate pagination based on array length
          const perPage = state.pagination.per_page || 20;
          state.pagination = {
            current_page: 1,
            last_page: Math.max(1, Math.ceil(payload.length / perPage)),
            per_page: perPage,
            total: payload.length,
          };
        }
        // Case 4: Empty or unexpected response
        else {
          state.list = [];
          state.pagination = {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 0,
          };
        }
      })
      .addCase(fetchActivations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.list = [];
      })
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
      .addCase(updateActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
        // Also update fullList if it exists
        if (state.fullListLoaded) {
          const fullIndex = state.fullList.findIndex(a => a.id === action.payload.id);
          if (fullIndex !== -1) state.fullList[fullIndex] = action.payload;
        }
      })
      .addCase(deleteActivation.fulfilled, (state, action) => {
        state.list = state.list.filter(a => a.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
        if (state.fullListLoaded) {
          state.fullList = state.fullList.filter(a => a.id !== action.payload);
        }
      })
      .addCase(renewActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
        if (state.fullListLoaded) {
          const fullIndex = state.fullList.findIndex(a => a.id === action.payload.id);
          if (fullIndex !== -1) state.fullList[fullIndex] = action.payload;
        }
      })
      .addCase(suspendActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
        if (state.fullListLoaded) {
          const fullIndex = state.fullList.findIndex(a => a.id === action.payload.id);
          if (fullIndex !== -1) state.fullList[fullIndex] = action.payload;
        }
      })
      .addCase(reactivateActivation.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
        if (state.fullListLoaded) {
          const fullIndex = state.fullList.findIndex(a => a.id === action.payload.id);
          if (fullIndex !== -1) state.fullList[fullIndex] = action.payload;
        }
      })
      .addCase(fetchActivationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(createStandaloneActivation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createStandaloneActivation.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload.activation);
        if (state.stats) {
          state.stats.total_activations += 1;
          if (action.payload.activation.status === 'active') state.stats.active_activations += 1;
        }
        if (state.fullListLoaded) {
          state.fullList.unshift(action.payload.activation);
        }
      })
      .addCase(createStandaloneActivation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createInstallation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createInstallation.fulfilled, (state, action) => {
        state.loading = false;
        const newActivations = action.payload.activations || [];
        state.list.unshift(...newActivations);
        if (state.stats) {
          state.stats.total_activations += newActivations.length;
          state.stats.active_activations += newActivations.filter(a => a.status === 'active').length;
        }
        if (state.fullListLoaded) {
          state.fullList.unshift(...newActivations);
        }
      })
      .addCase(createInstallation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

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

// ==============================================
// 💰 ADMIN PAYMENTS SLICE
// ==============================================
const adminPaymentsSlice = createSlice({
  name: "adminPayments",
  initialState: {
    currentAdminPayments: null,
    allAdminsPayments: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearAdminPaymentsError: (state) => {
      state.error = null;
    },
    clearAdminPaymentsSuccess: (state) => {
      state.success = false;
    },
    clearCurrentAdminPayments: (state) => {
      state.currentAdminPayments = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdminPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAdminPayments = action.payload;
        state.error = null;
      })
      .addCase(getAdminPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAllAdminPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAdminPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.allAdminsPayments = action.payload;
        state.error = null;
      })
      .addCase(getAllAdminPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addAdminPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addAdminPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        if (state.currentAdminPayments && state.currentAdminPayments.user?.id === action.payload.summary?.user?.id) {
          state.currentAdminPayments.summary = action.payload.summary;
        }
      })
      .addCase(addAdminPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(deleteAdminPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdminPayment.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentAdminPayments && state.currentAdminPayments.user?.id === action.payload.userId) {
          if (state.currentAdminPayments.summary) {
            state.currentAdminPayments.summary = action.payload.data.summary;
          }
        }
        if (state.allAdminsPayments) {
          const adminIndex = state.allAdminsPayments.admins?.findIndex(
            a => a.user.id === action.payload.userId
          );
          if (adminIndex !== -1 && adminIndex !== undefined && state.allAdminsPayments.admins[adminIndex]) {
            state.allAdminsPayments.admins[adminIndex].payments = action.payload.data.summary.payments;
            state.allAdminsPayments.admins[adminIndex].total = action.payload.data.summary.total;
            state.allAdminsPayments.grand_total = state.allAdminsPayments.admins.reduce(
              (sum, admin) => sum + (admin.total || 0), 0
            );
          }
        }
      })
      .addCase(deleteAdminPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ==============================================
// 💰 TECHNICIAN PAYMENTS SLICE
// ==============================================

const technicianPaymentsSlice = createSlice({
  name: "technicianPayments",
  initialState: {
    currentTechnicianPayments: null,
    allTechniciansPayments: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearTechnicianPaymentsError: (state) => {
      state.error = null;
    },
    clearTechnicianPaymentsSuccess: (state) => {
      state.success = false;
    },
    clearCurrentTechnicianPayments: (state) => {
      state.currentTechnicianPayments = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTechnicianPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTechnicianPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTechnicianPayments = action.payload;
        state.error = null;
      })
      .addCase(getTechnicianPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAllTechnicianPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTechnicianPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.allTechniciansPayments = action.payload;
        state.error = null;
      })
      .addCase(getAllTechnicianPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addTechnicianPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addTechnicianPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        if (state.currentTechnicianPayments && state.currentTechnicianPayments.user?.id === action.payload.summary?.user?.id) {
          state.currentTechnicianPayments.summary = action.payload.summary;
        }
      })
      .addCase(addTechnicianPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(deleteTechnicianPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTechnicianPayment.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTechnicianPayments && state.currentTechnicianPayments.user?.id === action.payload.userId) {
          if (state.currentTechnicianPayments.summary) {
            state.currentTechnicianPayments.summary = action.payload.data.summary;
          }
        }
        if (state.allTechniciansPayments) {
          const techIndex = state.allTechniciansPayments.technicians?.findIndex(
            t => t.user.id === action.payload.userId
          );
          if (techIndex !== -1 && techIndex !== undefined && state.allTechniciansPayments.technicians[techIndex]) {
            state.allTechniciansPayments.technicians[techIndex].payments = action.payload.data.summary.all_payments;
            state.allTechniciansPayments.technicians[techIndex].activation_total = action.payload.data.summary.activation.total;
            state.allTechniciansPayments.technicians[techIndex].vente_total = action.payload.data.summary.vente.total;
            state.allTechniciansPayments.technicians[techIndex].grand_total = action.payload.data.summary.grand_total;
            state.allTechniciansPayments.technicians[techIndex].activation_count = action.payload.data.summary.activation.count;
            state.allTechniciansPayments.technicians[techIndex].vente_count = action.payload.data.summary.vente.count;
            
            if (state.allTechniciansPayments.grand_totals) {
              state.allTechniciansPayments.grand_totals.activation_total = state.allTechniciansPayments.technicians.reduce(
                (sum, tech) => sum + (tech.activation_total || 0), 0
              );
              state.allTechniciansPayments.grand_totals.vente_total = state.allTechniciansPayments.technicians.reduce(
                (sum, tech) => sum + (tech.vente_total || 0), 0
              );
              state.allTechniciansPayments.grand_totals.all_total = 
                state.allTechniciansPayments.grand_totals.activation_total + 
                state.allTechniciansPayments.grand_totals.vente_total;
            }
          }
        }
      })
      .addCase(deleteTechnicianPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

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
// 📋 TECHNICIAN REPORTS SLICE
// ==============================================

const technicianReportsSlice = createSlice({
  name: "technicianReports",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearTechnicianReportsError: (state) => {
      state.error = null;
    },
    clearTechnicianReportsSuccess: (state) => {
      state.success = false;
    },
    clearSelectedReport: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTechnicianReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTechnicianReports.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTechnicianReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTechnicianReportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTechnicianReportById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchTechnicianReportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveTechnicianReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveTechnicianReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.list.unshift(action.payload);
      })
      .addCase(saveTechnicianReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(deleteTechnicianReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTechnicianReport.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(r => r.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      })
      .addCase(deleteTechnicianReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ==============================================
// 📋 DASHBOARD REPORTS SLICE
// ==============================================

const reportsSlice = createSlice({
  name: "reports",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearReportsError: (state) => {
      state.error = null;
    },
    clearReportsSuccess: (state) => {
      state.success = false;
    },
    clearSelectedReport: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchReportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchReportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.list.unshift(action.payload);
      })
      .addCase(saveReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(updateReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.list.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(r => r.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
// ==================== INVOICES SLICE ====================

const invoicesSlice = createSlice({
  name: "invoices",
  initialState: {
    currentInvoiceNumber: null,
    currentDevisNumber: null,
    counterInfo: null,
    generatedIndividualItems: [], // ADD THIS - for persistent gray button state
    generatedItems: {},
    individualNumbers: {},
    combinedGenerated: {},
    combinedNumbers: {},
    combinedItems: {},
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearInvoiceError: (state) => {
      state.error = null;
    },
    clearInvoiceSuccess: (state) => {
      state.success = false;
    },
    clearInvoiceCache: (state) => {
      state.generatedItems = {};
      state.combinedItems = {};
      state.combinedGenerated = {};
      state.combinedNumbers = {};
      state.individualNumbers = {};
      state.generatedIndividualItems = []; // ADD THIS
    },
    clearClientInvoiceCache: (state, action) => {
      const clientId = action.payload;
      delete state.generatedItems[clientId];
      delete state.combinedItems[clientId];
      delete state.combinedGenerated[clientId];
      delete state.combinedNumbers[clientId];
      state.generatedIndividualItems = []; // ADD THIS
      Object.keys(state.individualNumbers).forEach(key => {
        if (key.startsWith(`${clientId}_`)) {
          delete state.individualNumbers[key];
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNextInvoiceNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNextInvoiceNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoiceNumber = action.payload.invoice_number;
        state.success = true;
      })
      .addCase(fetchNextInvoiceNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentInvoiceNumber.fulfilled, (state, action) => {
        state.currentInvoiceNumber = action.payload.invoice_number;
      })
      .addCase(fetchCounterInfo.fulfilled, (state, action) => {
        state.counterInfo = action.payload.info;
      })
      .addCase(resetInvoiceCounterAction.fulfilled, (state, action) => {
        state.currentInvoiceNumber = action.payload.invoice_number;
        if (state.counterInfo) {
          state.counterInfo.invoice.current = 1;
          state.counterInfo.invoice.formatted = 'F01';
        }
      })
      .addCase(fetchNextDevisNumber.fulfilled, (state, action) => {
        state.currentDevisNumber = action.payload.devis_number;
      })
      // ADD THIS - Store generated individual items in Redux for persistence
      .addCase(fetchGeneratedIndividualItems.fulfilled, (state, action) => {
        state.generatedIndividualItems = action.payload.items || [];
        state.generatedItems[action.payload.clientId] = action.payload.items || [];
      })
      .addCase(checkIndividualInvoiceStatus.fulfilled, (state, action) => {
        const key = `${action.payload.clientId}_${action.payload.itemId}`;
        if (action.payload.data.generated && action.payload.data.invoice_number) {
          state.individualNumbers[key] = action.payload.data.invoice_number;
        }
      })
      .addCase(fetchIndividualInvoiceNumber.fulfilled, (state, action) => {
        if (action.payload.invoiceNumber) {
          const key = `${action.payload.clientId}_${action.payload.itemId}`;
          state.individualNumbers[key] = action.payload.invoiceNumber;
        }
      })
      .addCase(saveIndividualInvoice.fulfilled, (state, action) => {
        const key = `${action.payload.clientId}_${action.payload.itemId}`;
        state.individualNumbers[key] = action.payload.invoiceNumber;
        if (state.generatedItems[action.payload.clientId]) {
          if (!state.generatedItems[action.payload.clientId].includes(action.payload.itemId)) {
            state.generatedItems[action.payload.clientId].push(action.payload.itemId);
          }
        } else {
          state.generatedItems[action.payload.clientId] = [action.payload.itemId];
        }
        // Also update generatedIndividualItems for persistence
        if (!state.generatedIndividualItems.includes(action.payload.itemId)) {
          state.generatedIndividualItems.push(action.payload.itemId);
        }
      })
      .addCase(checkCombinedInvoiceStatus.fulfilled, (state, action) => {
        state.combinedGenerated[action.payload.clientId] = action.payload.data.generated;
        if (action.payload.data.generated && action.payload.data.invoice_number) {
          state.combinedNumbers[action.payload.clientId] = action.payload.data.invoice_number;
        }
      })
      .addCase(fetchCombinedInvoiceNumber.fulfilled, (state, action) => {
        if (action.payload.invoiceNumber) {
          state.combinedNumbers[action.payload.clientId] = action.payload.invoiceNumber;
        }
      })
      .addCase(fetchCombinedInvoiceItems.fulfilled, (state, action) => {
        state.combinedItems[action.payload.clientId] = action.payload.items;
      })
      .addCase(saveCombinedInvoice.fulfilled, (state, action) => {
        state.combinedGenerated[action.payload.clientId] = true;
        state.combinedNumbers[action.payload.clientId] = action.payload.invoiceNumber;
        state.combinedItems[action.payload.clientId] = action.payload.itemIds;
      })
      .addCase(removeItemFromCombined.fulfilled, (state, action) => {
        const clientId = action.payload.clientId;
        const itemId = action.payload.itemId;
        if (state.combinedItems[clientId]) {
          state.combinedItems[clientId] = state.combinedItems[clientId].filter(id => id !== itemId);
        }
      })
      .addCase(deleteCombinedTrackingAction.fulfilled, (state, action) => {
        const clientId = action.payload.clientId;
        state.combinedGenerated[clientId] = false;
        state.combinedItems[clientId] = [];
        state.combinedNumbers[clientId] = null;
      });
  },
});

// Export actions
export const { 
  clearInvoiceError, 
  clearInvoiceSuccess, 
  clearInvoiceCache,
  clearClientInvoiceCache 
} = invoicesSlice.actions;


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
    settings: settingsSlice.reducer,
    activations: activationsSlice.reducer,
    depenses: depensesSlice.reducer,
    adminPayments: adminPaymentsSlice.reducer,
    technicianPayments: technicianPaymentsSlice.reducer,
    technicianReports: technicianReportsSlice.reducer,
    reports: reportsSlice.reducer, 
    invoices: invoicesSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(refreshMiddleware),
});

// ==============================================
// 📤 EXPORT ACTIONS
// ==============================================
export const { 
  clearDepenseError, 
  clearSelectedDepense, 
  setDepensePage 
} = depensesSlice.actions;
export const { clearAuthError, updateAuthUser } = authSlice.actions;
export const { clearClientError, clearSelectedClient } = clientsSlice.actions;
export const { clearProductError } = productsSlice.actions;
export const { clearVehicleError } = vehiclesSlice.actions;
export const { clearDeviceError } = gpsDevicesSlice.actions;
export const { clearSaleError, clearPaymentHistory } = salesSlice.actions;
export const { clearUserError } = usersSlice.actions;
export const { clearCheckError, clearSelectedCheck, setPage } = checksSlice.actions;
export const { 
  clearActivationError, 
  clearSelectedSale, 
  setActivationPage,
  setFullList 
} = activationsSlice.actions;
export const { clearSettingsError, clearSettingsSuccess } = settingsSlice.actions;
export const { 
  clearAdminPaymentsError, 
  clearAdminPaymentsSuccess, 
  clearCurrentAdminPayments 
} = adminPaymentsSlice.actions;
export const { 
  clearTechnicianPaymentsError, 
  clearTechnicianPaymentsSuccess, 
  clearCurrentTechnicianPayments 
} = technicianPaymentsSlice.actions;

// ==============================================
// 📤 EXPORT SELECTORS
// ==============================================

// Settings selectors
export const selectCompanyInfo = (state) => state.settings.companyInfo;
export const selectSettingsLoading = (state) => state.settings.loading;
export const selectSettingsError = (state) => state.settings.error;
export const selectSettingsSuccess = (state) => state.settings.success;

// Auth selectors
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

// Checks selectors
export const selectChecks = (state) => state.checks.list;
export const selectSelectedCheck = (state) => state.checks.selected;
export const selectChecksSummary = (state) => state.checks.summary;
export const selectChecksFilterOptions = (state) => state.checks.filterOptions;
export const selectChecksLoading = (state) => state.checks.loading;
export const selectChecksError = (state) => state.checks.error;
export const selectChecksPagination = (state) => state.checks.pagination;

// Depenses selectors
export const selectDepenses = (state) => state.depenses.list;
export const selectSelectedDepense = (state) => state.depenses.selected;
export const selectDepensesStats = (state) => state.depenses.stats;
export const selectDepensesCategories = (state) => state.depenses.categories;
export const selectDepensesLoading = (state) => state.depenses.loading;
export const selectDepensesError = (state) => state.depenses.error;
export const selectDepensesPagination = (state) => state.depenses.pagination;

// Clients selectors
export const selectClients = (state) => state.clients.list;
export const selectSelectedClient = (state) => state.clients.selected;
export const selectClientsLoading = (state) => state.clients.loading;
export const selectClientVehicles = (state, clientId) => state.clients.vehicles[clientId] || [];
export const selectClientSales = (state, clientId) => state.clients.sales[clientId] || [];

// Products selectors
export const selectProducts = (state) => state.products.list;
export const selectSelectedProduct = (state) => state.products.selected;
export const selectCategories = (state) => state.products.categories;
export const selectProductsLoading = (state) => state.products.loading;

// Vehicles selectors
export const selectVehicles = (state) => state.vehicles.list;
export const selectSelectedVehicle = (state) => state.vehicles.selected;
export const selectVehiclesLoading = (state) => state.vehicles.loading;

// GPS Devices selectors
export const selectGpsDevices = (state) => state.gpsDevices.list;
export const selectSelectedDevice = (state) => state.gpsDevices.selected;
export const selectAvailableDevices = (state, productId) => state.gpsDevices.availableByProduct[productId] || [];
export const selectAvailableImeis = (state) => state.gpsDevices.availableImeis;
export const selectDevicesLoading = (state) => state.gpsDevices.loading;

// Sales selectors
export const selectSales = (state) => state.sales.list;
export const selectSelectedSale = (state) => state.sales.selected;
export const selectSaleStats = (state) => state.sales.stats;
export const selectSalesLoading = (state) => state.sales.loading;
export const selectPaymentHistory = (state) => state.sales.paymentHistory;
export const selectPaymentSummary = (state) => state.sales.paymentSummary;

// Activations selectors
export const selectSalesForActivation = (state) => state.activations.sales;
export const selectSelectedSaleActivation = (state) => state.activations.selectedSale;
export const selectActivations = (state) => state.activations.list;
export const selectFullActivationsList = (state) => state.activations.fullList;
export const selectFullActivationsLoaded = (state) => state.activations.fullListLoaded;
export const selectSelectedActivation = (state) => state.activations.selected;
export const selectActivationStats = (state) => state.activations.stats;
export const selectActivationsLoading = (state) => state.activations.loading;
export const selectActivationsError = (state) => state.activations.error;
export const selectActivationsPagination = (state) => state.activations.pagination;

// Users selectors
export const selectUsers = (state) => state.users.list;
export const selectSelectedUser = (state) => state.users.selected;
export const selectUsersLoading = (state) => state.users.loading;

// Dashboard selectors
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectDashboardLoading = (state) => state.dashboard.loading;

// Admin Payments selectors
export const selectCurrentAdminPayments = (state) => state.adminPayments.currentAdminPayments;
export const selectAllAdminsPayments = (state) => state.adminPayments.allAdminsPayments;
export const selectAdminPaymentsLoading = (state) => state.adminPayments.loading;
export const selectAdminPaymentsError = (state) => state.adminPayments.error;
export const selectAdminPaymentsSuccess = (state) => state.adminPayments.success;

// Technician Payments selectors
export const selectCurrentTechnicianPayments = (state) => state.technicianPayments.currentTechnicianPayments;
export const selectAllTechniciansPayments = (state) => state.technicianPayments.allTechniciansPayments;
export const selectTechnicianPaymentsLoading = (state) => state.technicianPayments.loading;
export const selectTechnicianPaymentsError = (state) => state.technicianPayments.error;
export const selectTechnicianPaymentsSuccess = (state) => state.technicianPayments.success;
export const { 
  clearTechnicianReportsError, 
  clearTechnicianReportsSuccess, 
  clearSelectedReport 
} = technicianReportsSlice.actions;

// Technician Reports selectors
export const selectTechnicianReports = (state) => state.technicianReports.list;
export const selectSelectedReport = (state) => state.technicianReports.selected;
export const selectTechnicianReportsLoading = (state) => state.technicianReports.loading;
export const selectTechnicianReportsError = (state) => state.technicianReports.error;
export const selectTechnicianReportsSuccess = (state) => state.technicianReports.success;
// Export selectors
export const selectCurrentInvoiceNumber = (state) => state.invoices.currentInvoiceNumber;
export const selectCurrentDevisNumber = (state) => state.invoices.currentDevisNumber;
export const selectCounterInfo = (state) => state.invoices.counterInfo;
export const selectInvoiceLoading = (state) => state.invoices.loading;
export const selectInvoiceError = (state) => state.invoices.error;
export const selectInvoiceSuccess = (state) => state.invoices.success;
export const selectGeneratedItems = (state, clientId) => state.invoices.generatedItems[clientId] || [];
export const selectIndividualInvoiceNumber = (state, clientId, itemId) => 
  state.invoices.individualNumbers[`${clientId}_${itemId}`];
export const selectIsIndividualGenerated = (state, clientId, itemId) => 
  !!state.invoices.individualNumbers[`${clientId}_${itemId}`];
export const selectCombinedGenerated = (state, clientId) => state.invoices.combinedGenerated[clientId] || false;
export const selectCombinedNumber = (state, clientId) => state.invoices.combinedNumbers[clientId];
export const selectCombinedItems = (state, clientId) => state.invoices.combinedItems[clientId] || [];
export const selectRefreshCounter = (state) => state.ui.refreshCounter;

export const selectIsItemInCombined = (state, clientId, itemId) => 
  state.invoices.combinedItems[clientId]?.includes(itemId) || false;
export default store;