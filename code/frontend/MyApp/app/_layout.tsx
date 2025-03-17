import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Slot } from 'expo-router';
import { LogBox } from 'react-native';

// Suppress warnings during development
LogBox.ignoreAllLogs(); // Ignore all warnings
// OR use this for specific warnings:
// LogBox.ignoreLogs([
//   'Warning: ...',
//   'Possible Unhandled Promise Rejection',
//   'Non-serializable values were found in the navigation state',
// ]);

// Prevent the app from remembering navigation state between sessions
export const unstable_settings = {
  // Ensure that reloading on any screen returns to the welcome screen
  initialRouteName: 'welcome',
  // Disable persistent navigation state
  preventTabPersistence: true, 
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
      }}>
      <Stack.Screen name="welcome" options={{ animation: 'none' }} />
      <Stack.Screen name="login-signup" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
