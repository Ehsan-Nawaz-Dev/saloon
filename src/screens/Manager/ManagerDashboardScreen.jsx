import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ManagerDashboardScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.replace('LiveCheck');
  }, [navigation]); 

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading Manager Panel.....</Text>
      <Text style={styles.loadingText}>Redirecting to Live Check for authentication.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 10,
  },
});

export default ManagerDashboardScreen;
