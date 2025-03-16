import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config/environment';

const SignUpScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        router.replace('/homeScreen');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login...');
      
      // Open browser for Google authentication
      const result = await WebBrowser.openAuthSessionAsync(
        `${BACKEND_URL}/auth/google`,
        'wavediaries://'
      );
      
      console.log('Auth result type:', result.type);
      
      // Handle the result
      if (result.type === 'success') {
        const url = result.url;
        console.log('Success URL:', url);
        
        if (url.includes('token=')) {
          const token = url.split('token=')[1].split('&')[0];
          console.log('Token received');
          await AsyncStorage.setItem('authToken', token);
          router.replace('/homeScreen');
        } else if (url.includes('error=')) {
          const error = decodeURIComponent(url.split('error=')[1].split('&')[0]);
          console.error('Auth error:', error);
          Alert.alert('Login Failed', error);
        }
      } else {
        console.log('Auth cancelled or failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Login Failed', 'An error occurred during Google authentication.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('@/assets/images/sparkles.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Wave Diaries for a better{'\n'}
            parenting experience
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
              style={styles.googleIcon}
            />
            <Text style={styles.buttonText}>Sign up with Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.emailButton}
            onPress={() => router.push('/email-signup')}
          >
            <Ionicons name="mail-outline" size={20} color="black" />
            <Text style={styles.buttonText}>Sign up with Email</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.linkText} onPress={() => router.push('/login')}>Log in</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/terms')}>
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 16 }}>
            View Terms & Conditions
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '1E1E1E', // Changed from '#1E1E1E' to white to match other screens
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white', // Changed from '#F5F7FF' to white for full coverage
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    flex: 1, // Added to ensure it takes full height
  },
  illustrationContainer: {
    marginVertical: 20,
    height: 280, // Increased from 150 to 280
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Added to ensure full width
  },
  illustration: {
    width: 280, // Increased from 180 to 280
    height: 230, // Increased from 120 to 230
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
