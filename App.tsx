import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';

const App = () => {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </UserProvider>
  );
};

export default App;
