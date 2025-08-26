// src/screens/Admin/AdminScreens/adminauthscreen/AdminLoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../../../context/UserContext';

const { width } = Dimensions.get('window');

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useUser();

  const gradientColors = ['#2A2D32', '#161719'];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login Error', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);

      // 👇 API call with Axios
      const response = await axios.post(
        'http://192.168.18.16:5000/admin/login',
        {
          email,
          password,
        },
      );

      console.log('Login Response:', response.data);

      if (response.status === 200) {
        const { token, admin } = response.data;

        // Save token to AsyncStorage
        await AsyncStorage.setItem('authToken', token);

        // Also use UserContext to handle login and save data
        await loginUser(email, password);

        Alert.alert(
          'Login Successful',
          'Welcome back, ' + (admin?.name || 'Admin'),
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.replace('AdminMainDashboard');
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      Alert.alert(
        'Login Failed',
        error.response?.data?.message ||
          error.message ||
          'An error occurred during login. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={gradientColors[0]} />
      <LinearGradient colors={gradientColors} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.loginBox}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.instructionText}>
              Please sign in to access your admin dashboard
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A9A9A9"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={secureText ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#A9A9A9"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    width: width * 0.7,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#bbbbbb',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#4E4E4E',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#ffffff',
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  passwordContainer: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#4E4E4E',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 25,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    color: '#ffffff',
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  loginButton: {
    backgroundColor: '#A99226',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default AdminLoginScreen;
