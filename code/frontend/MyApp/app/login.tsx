import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import { API_URL,AUTH_URL } from '../config/environment';

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

  // Check for existing authentication on component mount
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
      // First check hardcoded credentials
      if (email === 'Aditya' && password === 'waveDEEPdiaries') {
        await AsyncStorage.setItem('authToken', 'hardcoded-token');
        await AsyncStorage.setItem('userData', JSON.stringify({ username: 'Aditya' }));
        router.replace('/homeScreen');
        return;
      }

      // If not hardcoded user, try API login
      const response = await axios.post(`${API_URL}/users/login`, { email, password });
      const { token } = response.data;
      console.log(response.data);
      console.log(token)

      await AsyncStorage.setItem('authToken', token);
      router.replace('/homeScreen');
    } catch (error) {
      console.log(error);
      Alert.alert('Login Failed', 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login...');
      
      // Open browser for Google authentication
      const result = await WebBrowser.openAuthSessionAsync(
        `${AUTH_URL}/google`,
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
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Wave Diaries</Text>
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
          
          <TouchableOpacity style={styles.forgotPassword}>
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
