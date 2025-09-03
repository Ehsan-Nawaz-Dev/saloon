// src/api/expenseService.js
import axios from 'axios';
import { BASE_URL } from './config';

// Base URL for expense-related endpoints
const EXPENSE_API_URL = `${BASE_URL}/expenses`;

// Test function to check if backend is accessible
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection to:', BASE_URL);
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, {
      timeout: 10000, // Increased timeout
    });
    console.log('Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      response: error.response?.status,
      message: error.message,
    });
    return { success: false, error: error.message };
  }
};

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

/**
 * Add new expense
 */
export const addExpense = async (expenseData, token) => {
  try {
    console.log('addExpense called with:', expenseData);
    console.log('addExpense URL:', `${EXPENSE_API_URL}/add`);
    console.log('Token:', token ? 'Present' : 'Missing');

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    };

    let processedData = expenseData;

    if (expenseData instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      config.transformRequest = formData => formData;
      console.log('Using FormData for expense upload');
    } else {
      // Process expense data for backend compatibility
      processedData = {
        name: expenseData.name,
        price: parseFloat(expenseData.price),
        description: expenseData.description,
        userRole: expenseData.userRole || 'manager', // Default to manager
      };
      console.log('Processed expense data:', processedData);
    }

    const response = await axios.post(
      `${EXPENSE_API_URL}/add`,
      processedData,
      config,
    );
    console.log('addExpense response:', response.data);
    return response.data;
  } catch (error) {
    console.error('addExpense error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config,
    });

    // Return a structured error response instead of throwing
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Network error occurred',
      error: error.message,
    };
  }
};

/**
 * Get all expenses (approved expenses only)
 */
export const getAllExpenses = async token => {
  try {
    console.log('Calling getAllExpenses with URL:', `${EXPENSE_API_URL}/all`);
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    };

    const response = await axios.get(`${EXPENSE_API_URL}/all`, config);
    console.log('getAllExpenses response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getAllExpenses error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Return a structured error response instead of throwing
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Network error occurred',
      error: error.message,
      data: [],
    };
  }
};

/**
 * Get pending expenses for approval
 */
export const getPendingExpenses = async token => {
  try {
    console.log(
      'Calling getPendingExpenses with URL:',
      `${EXPENSE_API_URL}/pending`,
    );
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(`${EXPENSE_API_URL}/pending`, config);
    console.log('getPendingExpenses response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      'getPendingExpenses error:',
      error.response?.data || error.message,
    );
    handleApiError(error, 'get pending expenses');
  }
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (expenseId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(`${EXPENSE_API_URL}/${expenseId}`, config);
    return response.data;
  } catch (error) {
    handleApiError(error, 'get expense by ID');
  }
};

/**
 * Get manager's own pending expenses
 */
export const getManagerPendingExpenses = async token => {
  try {
    console.log(
      'Calling getManagerPendingExpenses with URL:',
      `${EXPENSE_API_URL}/manager/pending`,
    );
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    };

    const response = await axios.get(
      `${EXPENSE_API_URL}/manager/pending`,
      config,
    );
    console.log('getManagerPendingExpenses response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getManagerPendingExpenses error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Return empty array instead of throwing error
    return {
      success: true,
      data: [],
      message: 'No pending expenses found',
    };
  }
};

/**
 * Approve or decline expense
 */
export const updateExpenseStatus = async (expenseId, status, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.put(
      `${EXPENSE_API_URL}/${expenseId}`,
      { status },
      config,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, 'update expense status');
  }
};

/**
 * Get expense statistics
 */
export const getExpenseStats = async token => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(`${EXPENSE_API_URL}/stats`, config);
    return response.data;
  } catch (error) {
    handleApiError(error, 'get expense statistics');
  }
};

/**
 * Get unified pending approvals (for admin panel)
 */
export const getUnifiedPendingApprovals = async token => {
  try {
    console.log(
      '🔍 Calling getUnifiedPendingApprovals with URL:',
      `${BASE_URL}/admin-approvals/pending`,
    );
    console.log('🔍 Token available:', !!token);

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    };

    console.log('🔍 Making API request...');
    const response = await axios.get(
      `${BASE_URL}/admin-approvals/pending`,
      config,
    );
    console.log(
      '✅ getUnifiedPendingApprovals response status:',
      response.status,
    );
    console.log('✅ getUnifiedPendingApprovals response data:', response.data);
    console.log('✅ Response data type:', typeof response.data);
    console.log('✅ Response data keys:', Object.keys(response.data || {}));

    return response.data;
  } catch (error) {
    console.error(
      '❌ getUnifiedPendingApprovals error:',
      error.response?.data || error.message,
    );
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    handleApiError(error, 'get unified pending approvals');
  }
};

/**
 * Approve/decline unified request
 */
export const approveUnifiedRequest = async (
  requestType,
  requestId,
  status,
  token,
) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.put(
      `${BASE_URL}/admin-approvals/approve/${requestType}/${requestId}`,
      { status },
      config,
    );
    return response.data;
  } catch (error) {
    handleApiError(error, 'approve unified request');
  }
};

export default {
  addExpense,
  getAllExpenses,
  getPendingExpenses,
  getExpenseById,
  updateExpenseStatus,
  getExpenseStats,
  getUnifiedPendingApprovals,
  approveUnifiedRequest,
};
