import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert, ActivityIndicator, Linking, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import { BACKEND_URL } from '../config/environment';

// Register for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Enhanced check auth function and back handler
  useEffect(() => {
    checkAuth();
    
    // Add back button handler to prevent back navigation when authenticated
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we're checking auth status or authenticated, prevent back navigation
      if (isCheckingAuth) return true;
      
      // Check if user has a token and determine appropriate home screen
      AsyncStorage.getItem('authToken').then(async token => {
        if (token) {
          const role = await AsyncStorage.getItem('userRole');
          // Determine which screen to go back to based on role
          switch (role) {
            case 'admin':
              router.replace('/adminHomeScreen');
              break;
            case 'doctor':
              router.replace('/doctorHomeScreen');
              break;
            default:
              router.replace('/homeScreen');
          }
          return true;
        }
      }).catch(error => console.error('Error checking auth in back handler:', error));
      
      // Allow default back behavior if not authenticated
      return false;
    });
    
    // Clean up the back handler when component unmounts
    return () => backHandler.remove();
  }, [isCheckingAuth]);

  // More robust auth check that runs when component mounts
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Get user role to determine which home screen to show
        const role = await AsyncStorage.getItem('userRole');
        console.log('User role detected:', role);
        
        // Redirect based on role
        switch (role) {
          case 'admin':
            console.log('Redirecting to admin home screen');
            router.replace('/adminHomeScreen');
            break;
          case 'doctor':
            console.log('Redirecting to doctor home screen');
            router.replace('/doctorHomeScreen');
            break;
          case 'user':
          default:
            console.log('Redirecting to regular home screen');
            router.replace('/homeScreen');
            break;
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Add useEffect to handle deep links for token
  useEffect(() => {
    // Function to handle deep links
    interface DeepLinkEvent {
      url: string;
    }

    const handleDeepLink = async (event: DeepLinkEvent): Promise<void> => {
      const url: string = event.url;
      console.log('Deep link detected:', url);
      
      if (url.includes('token=')) {
      try {
        const token: string = url.split('token=')[1].split('&')[0];
        console.log('Token received from deep link:', token);
        await AsyncStorage.setItem('authToken', token);
        router.replace('/homeScreen');
      } catch (error) {
        console.error('Error processing deep link token:', error);
      }
      }
    };

    // Set up listeners for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a URL
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  const validateInput = () => {
    let isValid = true;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      setEmailError('');
    }
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateInput()) return;
    
    setIsLoading(true);
    try {
      // // First check hardcoded credentials
      // if (email === 'Aditya' && password === 'waveDEEPdiaries') {
      //   await AsyncStorage.setItem('authToken', 'hardcoded-token');
      //   await AsyncStorage.setItem('userData', JSON.stringify({ username: 'Aditya' }));
      //   router.replace('/homeScreen');
      //   return;
      // }
      // console.log("login started")
      console.log(`${BACKEND_URL}/api/users/login`)

      const response = await axios.post(`${BACKEND_URL}/api/users/login`, { email, password });
      const { token, role } = response.data;
      console.log('Login successful:', response.data);

      // Store authentication token
      await AsyncStorage.setItem('authToken', token);
      
      // Store user role for use throughout the app
      await AsyncStorage.setItem('userRole', role);
      
      // Redirect based on user role
      switch (role) {
        case 'admin':
          console.log('Admin login detected, redirecting to admin home');
          router.replace('/adminHomeScreen');
          break;
        case 'doctor':
          console.log('Doctor login detected, redirecting to doctor home');
          router.replace('/doctorHomeScreen');
          break;
        case 'user':
        default:
          console.log('User login detected, redirecting to user home');
          router.replace('/homeScreen');
          break;
      }
    } catch (error) {
      console.log('Login error:', error);
      
      // Handle pending doctor approval
      if (axios.isAxiosError(error) && error.response?.status === 403 && error.response.data?.isPending) {
        Alert.alert(
          'Account Pending Approval',
          'Your doctor account is awaiting administrator approval. You will be notified once approved.'
        );
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login...');
      
      // Store a flag to identify authentication is in progress
      await AsyncStorage.setItem('googleAuthInProgress', 'true');
      
      // Open browser for Google authentication
      const result = await WebBrowser.openAuthSessionAsync(
        `${BACKEND_URL}/auth/google`,
        'wavediaries://',
        {
          showInRecents: true,
          createTask: true // For Android to create a new task
        }
      );
      
      console.log('Auth result type:', result.type);
      await AsyncStorage.removeItem('googleAuthInProgress');
      
      // Handle the result
      if (result.type === 'success') {
        const url = result.url;
        console.log('Success URL:', url);
        
        if (url.includes('token=')) {
          const token = url.split('token=')[1].split('&')[0];
          console.log('Token received from WebBrowser');
          await AsyncStorage.setItem('authToken', token);
          router.replace('/homeScreen');
        } else if (url.includes('error=')) {
          const error = decodeURIComponent(url.split('error=')[1].split('&')[0]);
          console.error('Auth error:', error);
          Alert.alert('Login Failed', error);
        } else {
          console.log('No token found in URL, checking AsyncStorage');
          // Check if token was stored via deep link handler
          const storedToken = await AsyncStorage.getItem('authToken');
          if (storedToken) {
            router.replace('/homeScreen');
          }
        }
      } else {
        console.log('Auth cancelled or failed, checking for deep link token');
        // Check if token was stored via deep link handler
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          router.replace('/homeScreen');
        }
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
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Parent Diaries</Text>
      </View>
      
      <View style={styles.card}>
        {/* Decorative star in top right */}
        <View style={styles.starContainer}>
          <Image
            source={require('@/assets/images/star.png')}
            style={styles.starImage}
          />
        </View>
        
        <Text style={styles.title}>Log in</Text>
        
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={[styles.inputContainer, emailError && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              autoCapitalize="none"
              placeholder="Enter username"
            />
            {email === 'Aditya' && (
              <Text style={styles.checkIcon}>✓</Text>
            )}
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              placeholder="Enter password"
            />
            <TouchableOpacity 
              style={styles.inputIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Feather name={passwordVisible ? 'eye' : 'eye-off'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => router.push('/forgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or Login with</Text>
            <View style={styles.divider} />
          </View>
          
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
              style={styles.googleIcon} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
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
    backgroundColor: '#1A1A1A',
    padding: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#CCCCCC',
  },
  headerText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    flex: 1,
  },
  starContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  starImage: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  inputIcon: {
    padding: 8,
  },
  checkIcon: {
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    fontSize: 16,
    color: '#666',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: 48,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
