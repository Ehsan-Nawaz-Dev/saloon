// src/screens/Admin/AdminScreens/adminauthscreen/AdminRegisterScreen.js
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
import { useUser } from '../../../../context/UserContext';

const { width, height } = Dimensions.get('window');

const AdminRegisterScreen = ({ navigation }) => {
  const { registerUser } = useUser();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const gradientColors = ['#161719', '#2A2D32'];

  const isValidEmail = email => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Registration Error', 'Please fill all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Registration Error', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Registration Error',
        'Password must be at least 8 characters long.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Registration Error', 'Passwords do not match.');
      return;
    }

    try {
      await registerUser(fullName, email, password);

      Alert.alert(
        'Registration Successful!',
        'Your admin account has been created. Now you can log in.',
        [
          {
            text: 'OK',
            onPress: () => {
              // After successful registration, navigate to the login screen
              setTimeout(() => {
                navigation.replace('AdminLogin'); // <-- THIS IS THE CORRECT NAVIGATION FOR YOUR FLOW
              }, 100);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Registration failed:', error);
      // userContext's loginUser will throw an error if email/password mismatch during a login attempt
      // or if there's a storage error.
      Alert.alert(
        'Error',
        error.message || 'Failed to register. Please try again.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={gradientColors[0]} />
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.welcomeText}>Admin Registration</Text>
          <Text style={styles.instructionText}>
            Create your account to get started
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 8 char)"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
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
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.05,
  },
  welcomeText: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: height * 0.01,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: width * 0.025,
    color: '#bbb',
    marginBottom: height * 0.03,
    textAlign: 'center',
  },
  input: {
    width: '60%',
    maxWidth: 700,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: width * 0.025,
    borderRadius: 8,
    fontSize: width * 0.035,
    marginBottom: height * 0.02,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  registerButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.05,
    borderRadius: 8,
    width: '70%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: height * 0.03,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#222',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
});

export default AdminRegisterScreen;
