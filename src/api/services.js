// src/api/services.js
import axios from 'axios';
import { BASE_URL } from './config';

// Base URL for service-related endpoints
const SERVICE_API_URL = `${BASE_URL}/services`; // Mounted at /api/services on backend

// Helper function to handle API errors
const handleApiError = (error, operation = 'API call') => {
  console.error(
    `Error during ${operation}:`,
    error.response?.data || error.message,
  );
  // Re-throw the error so the calling component can catch it and show appropriate messages
  throw (
    error.response?.data?.message ||
    error.message ||
    `Failed to perform ${operation}.`
  );
};

/**
 * Nayi service add karne ke liye. (Admin Panel)
 * Backend expects multipart/form-data at '/api/services/admin/add' for adding.
 * @param {object | FormData} serviceData - Service ki details. Can be plain object or FormData.
 * @param {string} token - Admin ka JWT token.
 * @returns {Promise<object>} - Add ki gayi service ka data.
 */
export const addService = async (serviceData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    if (serviceData instanceof FormData) {
      // Explicitly set multipart for React Native
      config.headers['Content-Type'] = 'multipart/form-data';
      config.transformRequest = formData => formData;
    }

    // Agar serviceData FormData instance hai, toh content-type ko automatically set kiya jayega axios dwara.
    // Aur endpoint '/admin/add' use hoga, jaisa ki aapke code mein tha.
    const url =
      serviceData instanceof FormData
        ? `${SERVICE_API_URL}/admin/add`
        : SERVICE_API_URL;

    const response = await axios.post(url, serviceData, config);
    return response.data;
  } catch (error) {
    handleApiError(error, 'add service');
  }
};

/**
 * Saari services fetch karne ke liye. (Admin aur Manager Panel dono)
 * @returns {Promise<Array<object>>} - Services ki list.
 */
export const getServices = async () => {
  try {
    const response = await axios.get(SERVICE_API_URL);
    return response.data;
  } catch (error) {
    handleApiError(error, 'get all services');
  }
};

/**
 * ID se service fetch karne ke liye. (Agar zaroorat ho toh)
 * @param {string} id - Service ki ID.
 * @returns {Promise<object>} - Service ka data.
 */
export const getServiceById = async id => {
  try {
    const response = await axios.get(`${SERVICE_API_URL}/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, `get service by ID ${id}`);
  }
};

/**
 * Service ko update karne ke liye. (Admin Panel)
 * @param {string} id - Service ki ID.
 * @param {object} updatedData - Updated service details.
 * @param {string} token - Admin ka JWT token.
 * @returns {Promise<object>} - Updated service ka data.
 */
export const updateService = async (id, updatedData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`, // Admin token required for updating
      },
    };
    if (updatedData instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      config.transformRequest = formData => formData;
    }
    // For non-FormData payloads, align fields with backend expectations
    const payload =
      updatedData instanceof FormData
        ? updatedData
        : (() => {
            const body = { ...updatedData };
            if (!body.name && body.serviceName) body.name = body.serviceName;
            if (Array.isArray(body.subServices)) {
              body.subServices = JSON.stringify(body.subServices);
            }
            return body;
          })();

    const response = await axios.put(
      `${SERVICE_API_URL}/admin/${id}`,
      payload,
      config,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, `update service ${id}`);
  }
};

/**
 * Service ko delete karne ke liye. (Admin Panel)
 * @param {string} id - Service ki ID.
 * @param {string} token - Admin ka JWT token.
 * @returns {Promise<object>} - Confirmation message.
 */
export const deleteService = async (id, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`, // Admin token required for deleting
      },
    };
    const response = await axios.delete(
      `${SERVICE_API_URL}/admin/${id}`,
      config,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, `delete service ${id}`);
  }
};
