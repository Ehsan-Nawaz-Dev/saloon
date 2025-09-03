import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const userProfileImagePlaceholder = require('../assets/images/foundation.jpeg');

// Helper function to truncate username to 6 words maximum
const truncateUsername = (username) => {
  if (!username) return 'Guest';
  const words = username.split(' ');
  if (words.length <= 6) return username;
  return words.slice(0, 6).join(' ') + '...';
};

const StandardHeader = ({
  showBackButton = false,
  onBackPress,
  searchPlaceholder = 'Search anything',
  onSearchChange,
  searchValue = '',
  showNotifications = true,
  sourcePanel = 'manager', // 'admin' or 'manager'
}) => {
  const { userName } = useUser();
  const navigation = useNavigation();

  // Helper function to handle back navigation based on source panel
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      // Default back navigation based on source panel
      if (sourcePanel === 'admin') {
        navigation.replace('AdminMainDashboard');
      } else {
        navigation.replace('ManagerHomeScreen', { targetTab: 'Home' });
      }
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerCenter}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.userName}>{truncateUsername(userName)}</Text>
        </View>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="#A9A9A9"
            value={searchValue}
            onChangeText={onSearchChange}
          />
          <Ionicons
            name="search"
            size={width * 0.027}
            color="#A9A9A9"
            style={styles.searchIcon}
          />
        </View>
      </View>

      {showNotifications && (
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={width * 0.037}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons
              name="alarm"
              size={width * 0.037}
              color="#fff"
            />
          </TouchableOpacity>
          <Image
            source={userProfileImagePlaceholder}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginLeft: width * 0.0001,
    marginRight: width * 0.0001,
  },
  backButton: {
    backgroundColor: '#2A2D32',
    borderRadius: (width * 0.06) / 2,
    padding: width * 0.01,
    marginRight: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginRight: width * 0.16,
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
    paddingHorizontal: width * 0.0003,
    flex: 1,
    height: height * 0.035,
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
});

export default StandardHeader;
