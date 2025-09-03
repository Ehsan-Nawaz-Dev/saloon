// src/api/services.js
import axios from 'axios';
import { BASE_URL } from './config';
import { createAuthenticatedInstance } from '../utils/authUtils';

// Base URL for service-related endpoints
const SERVICE_API_URL = `${BASE_URL}/services`;

// Helper function to handle API errors
const handleApiError = (error, operation = 'API call') => {
  console.error(
    `Error during ${operation}:`,
    error.response?.data || error.message,
  );
  throw (
    error.response?.data?.message ||
    error.message ||
    `Failed to perform ${operation}.`
  );
};

// Helper function to process service data for backend compatibility
const processServiceData = data => {
  const processed = { ...data };

  // Ensure title field is present (backend expects 'title')
  if (processed.serviceName && !processed.title) {
    processed.title = processed.serviceName;
  }
  if (processed.name && !processed.title) {
    processed.title = processed.name;
  }

  // Process sub-services to match backend expectations
  if (Array.isArray(processed.subServices)) {
    const processedSubServices = processed.subServices.map(sub => ({
      name: sub.name || sub.subServiceName, // Backend expects 'name'
      price: parseFloat(sub.price) || 0, // Convert to number
      time: sub.time,
      description: sub.description,
      image: sub.image || sub.subServiceImage, // Backend expects 'image'
    }));
    processed.subServices = JSON.stringify(processedSubServices);
  }

  console.log('Processed service data:', processed);
  return processed;
};

/**
 * Add new service
 */
export const addService = async serviceData => {
  try {
    console.log('addService called with:', serviceData);

    const config = await createAuthenticatedInstance();

    let processedData = serviceData;

    if (serviceData instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      config.transformRequest = formData => formData;
    } else {
      processedData = processServiceData(serviceData);
    }

    // Fixed endpoint: /api/services/admin/add
    const url = `${SERVICE_API_URL}/admin/add`;

    const response = await axios.post(url, processedData, config);
    return response.data;
  } catch (error) {
    handleApiError(error, 'add service');
  }
};

/**
 * Get all services
 */
export const getServices = async () => {
  try {
    // Fixed endpoint: /api/services (no token required for public access)
    const response = await axios.get(SERVICE_API_URL);
    return response.data;
  } catch (error) {
    handleApiError(error, 'get all services');
  }
};

/**
 * Get service by ID
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
 * Update service
 */
export const updateService = async (id, updatedData) => {
  try {
    console.log('updateService called with:', { id, updatedData });

    const config = await createAuthenticatedInstance();

    let processedData = updatedData;

    if (updatedData instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      config.transformRequest = formData => formData;
    } else {
      processedData = processServiceData(updatedData);
    }

    // Fixed endpoint: /api/services/admin/:id
    const response = await axios.put(
      `${SERVICE_API_URL}/admin/${id}`,
      processedData,
      config,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, `update service ${id}`);
  }
};

/**
 * Delete service
 */
export const deleteService = async id => {
  try {
    const config = await createAuthenticatedInstance();
    // Fixed endpoint: /api/services/admin/:id
    const response = await axios.delete(
      `${SERVICE_API_URL}/admin/${id}`,
      config,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, `delete service ${id}`);
  }
};
