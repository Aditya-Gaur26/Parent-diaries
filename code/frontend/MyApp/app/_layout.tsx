import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LogBox, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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
  const backgroundColor = colorScheme === 'dark' ? '#000' : '#fff';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Stack
          initialRouteName="welcome"
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: backgroundColor,
            },
          }}>
          <Stack.Screen name="welcome" options={{ animation: 'none' }} />
          <Stack.Screen name="login-signup" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
