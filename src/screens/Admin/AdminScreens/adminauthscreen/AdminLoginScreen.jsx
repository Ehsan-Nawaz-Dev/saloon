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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../../context/UserContext';

const { width } = Dimensions.get('window');

const AdminLoginScreen = ({ navigation }) => {
  const { loginUser } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const gradientColors = ['#2A2D32', '#161719'];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login Error', 'Please enter both email and password.');
      return;
    }

    try {
      // Use backend auth via context
      await loginUser(email, password);

      Alert.alert('Login Successful', 'Welcome back, Administrator!', [
        {
          text: 'OK',
          onPress: () => {
            setTimeout(() => {
              // Navigate to the main admin dashboard container
              navigation.replace('AdminMainDashboard'); // <-- THIS IS THE CORRECT NAVIGATION FOR YOUR FLOW
            }, 100);
          },
        },
      ]);
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'An error occurred during login. Please try again.',
      );
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
              Please sign in to backup your progress
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

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
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
    width: width * 0.6,
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
