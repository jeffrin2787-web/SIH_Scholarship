import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1B4D3E" />
      <LanguageProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
