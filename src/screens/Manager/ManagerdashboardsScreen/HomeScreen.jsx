import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationBell from '../../../components/NotificationBell';
import { useNavigation } from '@react-navigation/native';
import { getServices } from '../../../api';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ➡️ Import AsyncStorage
import ServiceDetailModal from './modals/ServiceDetailModal'; // You may need to uncomment if you use this modal

const { width, height } = Dimensions.get('window');

const userProfileImagePlaceholder = require('../../../assets/images/logo.png');

const truncateUsername = username => {
  if (!username) return 'Guest';
  const words = username.split(' ');
  if (words.length <= 6) return username;
  return words.slice(0, 6).join(' ') + '...';
};

const getDisplayImageSource = image => {
  if (typeof image === 'string' && image.startsWith('http')) {
    return { uri: image };
  } else if (typeof image === 'number') {
    return image;
  }
  return null;
};

const ServiceCard = ({ service, onPress }) => {
  const imageSource = getDisplayImageSource(service.image);
  return (
    <View>
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onPress(service)}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noServiceImage}>
            <Ionicons name="image-outline" size={40} color="#999" />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
        <Text style={styles.serviceName}>{service.title || service.name}</Text>
        {service.isHiddenFromEmployee && (
          <View style={styles.hiddenBadge}>
            <Text style={styles.hiddenBadgeText}>Hidden</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    name: 'Guest',
    profileImage: userProfileImagePlaceholder,
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // ➡️ New useEffect hook to load user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const managerAuth = await AsyncStorage.getItem('managerAuth');
        const adminAuth = await AsyncStorage.getItem('adminAuth');

        if (managerAuth) {
          const parsedData = JSON.parse(managerAuth);
          if (parsedData.token && parsedData.isAuthenticated) {
            setUserData({
              name: parsedData.manager.name,
              profileImage: parsedData.manager.livePicture,
            });
          } else {
            Alert.alert('Authentication Error', 'Please login again.', [
              {
                text: 'OK',
                onPress: () => navigation.replace('RoleSelection'),
              },
            ]);
          }
        } else if (adminAuth) {
          const parsedData = JSON.parse(adminAuth);
          if (parsedData.token && parsedData.isAuthenticated) {
            setUserData({
              name: parsedData.admin.name,
              profileImage: parsedData.admin.livePicture,
            });
          } else {
            Alert.alert('Authentication Error', 'Please login again.', [
              {
                text: 'OK',
                onPress: () => navigation.replace('RoleSelection'),
              },
            ]);
          }
        } else {
          Alert.alert('Authentication Error', 'Please login again.', [
            {
              text: 'OK',
              onPress: () => navigation.replace('RoleSelection'),
            },
          ]);
        }
      } catch (e) {
        console.error('Failed to load user data from storage:', e);
        Alert.alert('Authentication Error', 'Please login again.', [
          {
            text: 'OK',
            onPress: () => navigation.replace('RoleSelection'),
          },
        ]);
      }
    };

    loadUserData();
  }, []);

  const isServiceHidden = svc => {
    if (!svc) return false;
    if (typeof svc.status === 'string') {
      return svc.status.toLowerCase() === 'hide';
    }
    return false;
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await getServices({ type: 'show' });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.services)
        ? data.services
        : [];
      // If backend already filters by type=show, we can accept list as-is,
      // but still defensively filter hidden on client side.
      const visible = list.filter(svc => !isServiceHidden(svc));
      setServices(visible);
      setError(null);
    } catch (e) {
      console.error('Error fetching services:', e);
      setError(
        'Failed to load services. Please ensure your backend server is running and the IP address is correct.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceCardPress = service => {
    const normalized = { ...service, id: service._id || service.id };
    navigation.navigate('SubHome', { service: normalized });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A98C27" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ➡️ Using the user data from state for the profile image
  const profileImageSource =
    getDisplayImageSource(userData.profileImage) || userProfileImagePlaceholder;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello 👋</Text>
            {/* ➡️ Using the user data from state for the username */}
            <Text style={styles.userName}>
              {truncateUsername(userData.name)}
            </Text>
          </View>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search anything"
              placeholderTextColor="#A9A9A9"
            />
            <Ionicons
              name="search"
              size={width * 0.027}
              color="#A9A9A9"
              style={styles.searchIcon}
            />
          </View>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell containerStyle={styles.notificationButton} />
          {/* <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons
              name="alarm"
              size={width * 0.035}
              color="#fff"
            />
          </TouchableOpacity> */}
          {/* ➡️ Using the dynamic profile image source */}
          <Image
            source={profileImageSource}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>
      </View>
      <View style={styles.servicesHeader}>
        <Text style={styles.servicesTitle}>Services</Text>
      </View>
      <ScrollView contentContainerStyle={styles.servicesGridContainer}>
        <View style={styles.servicesGrid}>
          {services.length > 0 ? (
            services.map(service => (
              <ServiceCard
                key={service._id}
                service={service}
                onPress={handleServiceCardPress}
              />
            ))
          ) : (
            <Text style={styles.noServicesText}>No services available.</Text>
          )}
        </View>
      </ScrollView>
      <ServiceDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        service={selectedService}
      />
    </View>
  );
};
export default HomeScreen;

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1f20ff',
    paddingTop: height * 0.03,
    paddingRight: width * 0.03,
    paddingLeft: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1f20ff',
  },
  loadingText: {
    color: '#fff',
    fontSize: width * 0.03,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: width * 0.03,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.035,
    borderRadius: 8,
    marginTop: height * 0.02,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    marginBottom: height * 0.02,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: width * 0.02,
  },
  userInfo: {
    marginRight: width * 0.1,
  },
  greeting: {
    fontSize: width * 0.019,
    color: '#A9A9A9',
  },
  userName: {
    fontSize: width * 0.03,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderRadius: 10,
    flex: 1,
    height: height * 0.04,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  searchIcon: {
    marginRight: width * 0.01,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.021,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: width * 0.01,
  },
  notificationButton: {
    backgroundColor: '#2A2D32',
    borderRadius: 8,
    padding: width * 0.000001,
    marginRight: width * 0.015,
    height: width * 0.058,
    width: width * 0.058,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: width * 0.058,
    height: width * 0.058,
    borderRadius: (width * 0.058) / 2,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.03,
    marginHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.04,
  },
  servicesTitle: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#fff',
  },
  servicesGridContainer: {
    paddingBottom: height * 0.05,
    paddingHorizontal: width * 0.01,
    flexGrow: 1,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  noServicesText: {
    color: '#A9A9A9',
    fontSize: width * 0.025,
    textAlign: 'center',
    width: '100%',
    marginTop: 50,
  },
  serviceCard: {
    backgroundColor: '#3C3C3C',
    borderRadius: 3,
    width: 121,
    height: 260,
    marginRight: width * 0.01,
    marginBottom: height * 0.015,
    overflow: 'hidden',
    paddingBottom: height * 0.01,
    position: 'relative',
  },
  serviceImage: {
    width: 120,
    height: 200,
    borderRadius: 4.9,
    marginBottom: height * 0.01,
  },
  noServiceImage: {
    width: 102,
    height: 120,
    borderRadius: 4.9,
    marginBottom: height * 0.01,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: width * 0.015,
    marginTop: 5,
  },
  serviceName: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: width * 0.01,
  },
  hiddenBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 1,
  },
  hiddenBadgeText: {
    color: '#fff',
    fontSize: width * 0.015,
    fontWeight: 'bold',
  },
});
