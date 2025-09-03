import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../api/config';

// Get manager authentication token with fallback support
export const getManagerToken = async () => {
  try {
    // Get token from managerAuth (new authentication system)
    let token = null;
    const managerAuthData = await AsyncStorage.getItem('managerAuth');
    if (managerAuthData) {
      const { token: authToken } = JSON.parse(managerAuthData);
      token = authToken;
    }

    // Fallback to direct managerToken (old system)
    if (!token) {
      token = await AsyncStorage.getItem('managerToken');
    }

    // If token is a face auth token, try to convert it to JWT
    if (token && token.startsWith('face_auth_')) {
      console.log('🔄 Converting face auth token to JWT...');
      try {
        const parts = token.split('_');
        if (parts.length >= 3) {
          const managerId = parts[2];
          console.log('🔄 Manager ID from token:', managerId);

          const managerAuthData = await AsyncStorage.getItem('managerAuth');
          if (managerAuthData) {
            const { manager } = JSON.parse(managerAuthData);
            if (manager) {
              console.log('🔄 Manager data found:', manager.name);

              // Call backend to generate proper JWT token
              const response = await fetch(`${BASE_URL}/manager/face-login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  managerId: managerId,
                  name: manager.name,
                  faceVerified: true,
                }),
              });

              console.log('🔄 Face login response status:', response.status);

              if (response.ok) {
                const data = await response.json();
                const jwtToken = data.token || data.data?.token;

                // Update stored token
                await AsyncStorage.setItem(
                  'managerAuth',
                  JSON.stringify({
                    token: jwtToken,
                    manager: manager,
                    isAuthenticated: true,
                  }),
                );

                console.log('✅ Successfully converted face auth token to JWT');
                return jwtToken;
              } else {
                const errorData = await response.json();
                console.error('❌ Face login failed:', errorData);
              }
            } else {
              console.error('❌ No manager data found in AsyncStorage');
            }
          } else {
            console.error('❌ No managerAuth data found in AsyncStorage');
          }
        } else {
          console.error('❌ Invalid face auth token format');
        }
      } catch (conversionError) {
        console.error('❌ Failed to convert face auth token:', conversionError);
      }
    }

    return token;
  } catch (error) {
    console.error('Error getting manager token:', error);
    return null;
  }
};

// Get admin authentication token with fallback support
export const getAdminToken = async () => {
  try {
    // Get token from adminAuth (new authentication system)
    let token = null;
    const adminAuthData = await AsyncStorage.getItem('adminAuth');
    if (adminAuthData) {
      const { token: authToken } = JSON.parse(adminAuthData);
      token = authToken;
    }

    // Fallback to direct authToken (old system)
    if (!token) {
      token = await AsyncStorage.getItem('authToken');
    }

    // If token is a face auth token, try to convert it to JWT
    if (token && token.startsWith('face_auth_')) {
      console.log('🔄 Converting admin face auth token to JWT...');
      try {
        const parts = token.split('_');
        if (parts.length >= 3) {
          const adminId = parts[2];
          const adminAuthData = await AsyncStorage.getItem('adminAuth');
          if (adminAuthData) {
            const { admin } = JSON.parse(adminAuthData);
            if (admin) {
              // Call backend to generate proper JWT token
              const response = await fetch(`${BASE_URL}/auth/face-login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  adminId: adminId,
                  name: admin.name,
                  faceVerified: true,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                const jwtToken = data.token || data.data?.token;

                // Update stored token
                await AsyncStorage.setItem(
                  'adminAuth',
                  JSON.stringify({
                    token: jwtToken,
                    admin: admin,
                    isAuthenticated: true,
                  }),
                );

                console.log('✅ Successfully converted admin face auth token to JWT');
                return jwtToken;
              }
            }
          }
        }
      } catch (conversionError) {
        console.error('❌ Failed to convert admin face auth token:', conversionError);
      }
    }

    return token;
  } catch (error) {
    console.error('Error getting admin token:', error);
    return null;
  }
};

// Get the appropriate authentication token (manager or admin)
export const getAuthToken = async () => {
  try {
    // Try manager token first
    const managerToken = await getManagerToken();
    if (managerToken) {
      return managerToken;
    }

    // Try admin token
    const adminToken = await getAdminToken();
    if (adminToken) {
      return adminToken;
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};

// Get user type (manager or admin)
export const getUserType = async () => {
  try {
    const managerAuthData = await AsyncStorage.getItem('managerAuth');
    if (managerAuthData) {
      const { token, isAuthenticated } = JSON.parse(managerAuthData);
      if (token && isAuthenticated) {
        return 'manager';
      }
    }

    const adminAuthData = await AsyncStorage.getItem('adminAuth');
    if (adminAuthData) {
      const { token, isAuthenticated } = JSON.parse(adminAuthData);
      if (token && isAuthenticated) {
        return 'admin';
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
};

// Get user data (manager or admin)
export const getUserData = async () => {
  try {
    const managerAuthData = await AsyncStorage.getItem('managerAuth');
    if (managerAuthData) {
      const { manager, token, isAuthenticated } = JSON.parse(managerAuthData);
      if (token && isAuthenticated && manager) {
        return { type: 'manager', data: manager };
      }
    }

    const adminAuthData = await AsyncStorage.getItem('adminAuth');
    if (adminAuthData) {
      const { admin, token, isAuthenticated } = JSON.parse(adminAuthData);
      if (token && isAuthenticated && admin) {
        return { type: 'admin', data: admin };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Create authenticated axios instance
export const createAuthenticatedInstance = async () => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
};

// Clear all authentication data
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'managerAuth',
      'adminAuth',
      'managerToken',
      'authToken',
      'adminFullName',
      'adminEmail',
    ]);
    console.log('✅ All authentication data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};
