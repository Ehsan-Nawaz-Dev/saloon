// src/screens/Auth/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { height, width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    StatusBar.setHidden(true);
    const timer = setTimeout(() => {
      StatusBar.setHidden(false);
      navigation.replace('RoleSelection');
    }, 8000);
    return () => {
      clearTimeout(timer);
      StatusBar.setHidden(false);
    };
  }, [navigation]);

  // Changed gradient colors to pure black to match the image background
  const gradientColors = ['#000000', '#000000']; // Pure black

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Image
        source={require('../../assets/images/logo.png')} // Your logo image path
        style={styles.logo}
        resizeMode="contain"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.7,
    height: height * 0.4,
    maxWidth: 400,
    maxHeight: 250,
  },
});

export default SplashScreen;
