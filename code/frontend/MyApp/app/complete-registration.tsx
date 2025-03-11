import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL,AUTH_URL } from '../config/environment';


const RegistrationScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  interface Errors {
    name?: string;
    dob?: string;
    mobileNumber?: string;
  }
  
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  const validateForm = () => {
    let tempErrors: Errors = {};
    
    if (!name.trim()) {
      tempErrors.name = 'Name is required';
    }
    
    if (!dob.trim()) {
      tempErrors.dob = 'Date of Birth is required';
    } else if (!isValidDate(dob)) {
      tempErrors.dob = 'Invalid date format (DD/MM/YYYY)';
    }
    
    if (mobileNumber.trim() && !isValidPhone(mobileNumber)) {
      tempErrors.mobileNumber = 'Invalid mobile number';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };
  
  const isValidDate = (dateString) => {
    // Basic date validation
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    return regex.test(dateString);
  };
  
  const isValidPhone = (phone) => {
    // Basic phone validation
    return /^\d{10}$/.test(phone);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Registration Failed", "Please correct the errors in the form.");
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.put(`${API_URL}/users/profile`, {
        name,
        dob,
        mobile_number: mobileNumber || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { user } = response.data;
      
      // Update stored user data
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      router.replace('/homeScreen');
    } catch (error) {
        console.log(error)
      Alert.alert(
        "Registration Failed",
        "Unable to complete registration. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingUserData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('@/assets/images/sparkles.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Complete Registration</Text>
        
        <View style={styles.formContainer}>
          <View style={[styles.inputContainer, errors.name && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          
          {/* Simplified DOB field - regular TextInput */}
          <View style={[styles.inputContainer, errors.dob && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="D.O.B (DD/MM/YYYY)"
              placeholderTextColor="#666"
              value={dob}
              onChangeText={(text) => {
                setDob(text);
                if (errors.dob) {
                  setErrors(prev => ({ ...prev, dob: '' }));
                }
              }}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
          
          <View style={[styles.inputContainer, errors.mobileNumber && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number (Optional)"
              placeholderTextColor="#666"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
            />
          </View>
          {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
          
          <TouchableOpacity 
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Registration</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.termsText}>
          By creating an account or signing, you agree to our{' '}
          <Text style={styles.linkText}>Terms and Conditions</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  illustrationContainer: {
    height: 180, // Increased height
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  illustration: {
    width: 240, // Increased width
    height: 180, // Increased height
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: 8,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 'auto', // Move to the bottom
  },
  linkText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default RegistrationScreen;
