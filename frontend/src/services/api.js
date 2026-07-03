import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token to all requests if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("pos_token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

/* ============================================================
   CUSTOMERS
============================================================ */
export const getCustomerCount = async () => {
  const { data } = await API.get("/customers/count");
  return data;
};

export const getAllCustomers = async () => {
  const { data } = await API.get("/customers");
  return data;
};

export const addCustomer = async (customer) => {
  const { data } = await API.post("/customers", customer);
  return data;
};

export const updateCustomer = async (id, customerData) => {
  const { data } = await API.put(`/customers/${id}`, customerData);
  return data;
};

export const deleteCustomer = async (id) => {
  const { data } = await API.delete(`/customers/${id}`);
  return data;
};

/* ============================================================
   SUPPLIERS
============================================================ */
export const getSupplierCount = async () => {
  const { data } = await API.get("/suppliers/count");
  return data;
};

export const getAllSuppliers = async () => {
  const { data } = await API.get("/suppliers");
  return data;
};

export const addSupplier = async (supplier) => {
  const { data } = await API.post("/suppliers", supplier);
  return data;
};

export const updateSupplier = async (id, supplierData) => {
  const { data } = await API.put(`/suppliers/${id}`, supplierData);
  return data;
};

export const deleteSupplier = async (id) => {
  const { data } = await API.delete(`/suppliers/${id}`);
  return data;
};

export const searchSuppliers = async (searchTerm = "") => {
  const { data } = await API.get(`/suppliers/search?search=${searchTerm}`);
  return data;
};

// Supplier Invoices (Final Settlement)
export const saveSupplierInvoice = async (invoiceData) => {
  const { data } = await API.post("/supplier-invoices", invoiceData);
  return data;
};

/* ============================================================
   ARRIVALS
============================================================ */
export const getAllArrivals = async () => {
  const { data } = await API.get("/arrivals");
  return data;
};

export const addArrival = async (arrival) => {
  const { data } = await API.post("/arrivals", arrival);
  return data;
};

export const updateArrival = async (id, arrival) => {
  const { data } = await API.put(`/arrivals/${id}`, arrival);
  return data;
};

export const deleteArrival = async (id) => {
  const { data } = await API.delete(`/arrivals/${id}`);
  return data;
};

export const searchArrivals = async (searchTerm = "") => {
  const { data } = await API.get(`/arrivals/search?search=${searchTerm}`);
  return data;
};

// Update purchased quantity after selling from arrival
// Accept an object with { addedItems, amount }
export const updateArrivalPurchase = async (id, { addedItems, amount }) => {
  const { data } = await API.put(`/arrivals/${id}/purchase`, {
    addedItems: Number(addedItems),
    amount: Number(amount),
  });
  return data;
};

/* ============================================================
   ITEMS
============================================================ */
export const getItems = async () => {
  const { data } = await API.get("/items");
  return data;
};

export const addItem = async (itemData) => {
  const { data } = await API.post("/items", itemData);
  return data;
};

export const updateItem = async (id, itemData) => {
  const { data } = await API.put(`/items/${id}`, itemData);
  return data;
};

export const deleteItem = async (id) => {
  const { data } = await API.delete(`/items/${id}`);
  return data;
};

/* ============================================================
   INVOICES
============================================================ */
export const getInvoiceNumber = async (type, id) => {
  const { data } = await API.get(`/invoice-number?type=${type}&id=${id}`);
  return data;
};

// Save invoice (arrivalId can be null)
export const saveInvoice = async (invoiceData) => {
  const payload = {
    ...invoiceData,
    arrivalId: invoiceData.arrivalId || null,
  };
  const { data } = await API.post("/save-invoice", payload);
  return data;
};
// Auth & Users
export const getUsers = async () => (await API.get('/auth/users')).data;
export const createUser = async (userData) => (await API.post('/auth/users', userData)).data;
export const deleteUser = async (id) => (await API.delete(`/auth/users/${id}`)).data;
export const updatePassword = async (id, newPassword) => (await API.put(`/auth/users/${id}/password`, { newPassword })).data;
// Invoices
export const getInvoices = async (searchId = '') => {
  const { data } = await API.get("/save-invoice");
  return data;
};

export const updateInvoice = async (id, invoiceData) => {
  const { data } = await API.put(`/save-invoice/${id}`, invoiceData);
  return data;
};

export const deleteInvoice = async (id) => {
  const { data } = await API.delete(`/save-invoice/${id}`);
  return data;
};

export const getCustomerInvoices = async (customerId) => {
  const { data } = await API.get(`/save-invoice/customer/${customerId}`);
  return data;
};

export const getSupplierArrivals = async (supplierId) => {
  const { data } = await API.get(`/arrivals/supplier/${supplierId}`);
  return data;
};

// ==========================================
// PAYMENTS API
// ============================================================
export const getAllPayments = async () => {
  const { data } = await API.get('/payments');
  return data;
};

export const addPayment = async (paymentData) => {
  const { data } = await API.post('/payments', paymentData);
  return data;
};

export const getCustomerPayments = async (customerId) => {
  const { data } = await API.get(`/payments/customer/${customerId}`);
  return data;
};

export const getSupplierPayments = async (supplierId) => {
  const { data } = await API.get(`/payments/supplier/${supplierId}`);
  return data;
};

/* ============================================================
   PENDING INVOICES
============================================================ */
export const getPendingInvoices = async () => {
  const { data } = await API.get("/pending-invoice");
  return data;
};

export const addPendingInvoice = async (invoiceData) => {
  const { data } = await API.post("/pending-invoice", invoiceData);
  return data;
};

export const updatePendingInvoice = async (id, updatedData) => {
  const { data } = await API.put(`/pending-invoice/${id}`, updatedData);
  return data;
};

export const deletePendingInvoice = async (id) => {
  const { data } = await API.delete(`/pending-invoice/${id}`);
  return data;
};

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Server Error. Please try again.";
    console.error("API Error:", msg);
    return Promise.reject(new Error(msg));
  }
);

export default API;
