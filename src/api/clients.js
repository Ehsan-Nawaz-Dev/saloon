// Client API functions
import axios from 'axios';
import { BASE_URL } from './config';
import { createAuthenticatedInstance } from '../utils/authUtils';

// Add new client
export const addClient = async clientData => {
  try {
    const authInstance = await createAuthInstance();
    const response = await authInstance.post('/api/clients/add', clientData);
    return response.data;
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};

// Get all clients
export const getAllClients = async () => {
  try {
    const authInstance = await createAuthInstance();
    const response = await authInstance.get('/api/clients/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

// Get client by ID
export const getClientById = async clientId => {
  try {
    const authInstance = await createAuthInstance();
    const response = await authInstance.get(`/api/clients/${clientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

// Update client
export const updateClient = async (clientId, clientData) => {
  try {
    const authInstance = await createAuthInstance();
    const response = await authInstance.put(
      `/api/clients/${clientId}`,
      clientData,
    );
    return response.data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// Delete client
export const deleteClient = async clientId => {
  try {
    const authInstance = await createAuthInstance();
    const response = await authInstance.delete(`/api/clients/${clientId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Search clients
export const searchClients = async searchTerm => {
  try {
    const authInstance = await createAuthInstance();
    const response = await authInstance.get(
      `/api/clients/search?q=${searchTerm}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
};

// Get client statistics
export const getClientStats = async () => {
  try {
    const authInstance = await createAuthInstance();
    const response = await authInstance.get('/api/clients/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching client stats:', error);
    throw error;
  }
};

// Auto-generate client from bill data
export const generateClientFromBill = async billData => {
  try {
    const { clientName, phoneNumber, services, totalPrice } = billData;

    // Check if client already exists by phone number
    const existingClients = await getAllClients();
    const existingClient = existingClients.clients?.find(
      client => client.phoneNumber === phoneNumber,
    );

    if (existingClient) {
      // Client exists, return existing client
      return {
        success: true,
        client: existingClient,
        isNew: false,
        message: 'Client already exists',
      };
    } else {
      // Create new client
      const newClient = await addClient({
        name: clientName,
        phoneNumber: phoneNumber,
      });

      return {
        success: true,
        client: newClient.client,
        isNew: true,
        message: 'New client created successfully',
      };
    }
  } catch (error) {
    console.error('Error generating client from bill:', error);
    throw error;
  }
};
