import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL,AUTH_URL } from '../config/environment';

const EmailVerificationScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [timer, setTimer] = useState(20); // Changed to 20 seconds like the reference
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const email = params?.email ? String(params.email) : 'your email';

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.every(digit => digit !== '') && code.length === 5) {
      const timeout = setTimeout(() => {
        handleSubmit();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [code]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      const newCode = [...code];
      if (activeIndex > 0) {
        newCode[activeIndex - 1] = '';
        setCode(newCode);
        setActiveIndex(prev => Math.max(0, prev - 1));
      }
    } else {
      if (activeIndex < code.length) {
        const newCode = [...code];
        newCode[activeIndex] = key;
        setCode(newCode);
        
        // Auto advance to next input
        if (activeIndex < code.length - 1) {
          setActiveIndex(prev => prev + 1);
        }
      }
    }
  };

  const handleResendCode = async () => {
    setCode(['', '', '', '', '']);
    setActiveIndex(0);
    setTimer(20);
    
    try {
      await axios.post(`${API_URL}/users/resend-code`, { email });
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification code');
    }
  };

  const handleSubmit = async () => {
    if (code.join('').length !== 5) {
      Alert.alert('Error', 'Please enter the complete verification code.');
      return;
    }

    setIsVerifying(true);
    console.log("hi");
    try {
      const verificationCode = code.join('');
      const response = await axios.post(`${API_URL}/users/verify_email`, {
        email,
        verificationCode
      });

      const { token } = response.data;
      
      // Store JWT token
      await AsyncStorage.setItem('authToken', token);
      
      // Navigate to complete registration without passing email parameter
      router.replace('/complete-registration');
    } catch (error: any) {
      console.log(error)
      const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.starIcon}>
          <Feather name="star" size={24} color="black" />
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Enter code</Text>
        <Text style={styles.subtitle}>
          We've sent an email with an activation{'\n'}
          code to {email}
        </Text>
        
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <View 
              key={index} 
              style={[
                styles.codeBox,
                activeIndex === index && styles.codeBoxActive,
                digit && styles.codeBoxFilled
              ]}
            >
              <Text style={styles.codeText}>{digit}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={timer > 0}
        >
          <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
            Send code again {timer > 0 ? `(${timer}s)` : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, isVerifying && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('1')}>
            <Text style={styles.keypadButtonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('2')}>
            <Text style={styles.keypadButtonText}>2</Text>
            <Text style={styles.keypadSubText}>ABC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('3')}>
            <Text style={styles.keypadButtonText}>3</Text>
            <Text style={styles.keypadSubText}>DEF</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('4')}>
            <Text style={styles.keypadButtonText}>4</Text>
            <Text style={styles.keypadSubText}>GHI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('5')}>
            <Text style={styles.keypadButtonText}>5</Text>
            <Text style={styles.keypadSubText}>JKL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('6')}>
            <Text style={styles.keypadButtonText}>6</Text>
            <Text style={styles.keypadSubText}>MNO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('7')}>
            <Text style={styles.keypadButtonText}>7</Text>
            <Text style={styles.keypadSubText}>PQRS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('8')}>
            <Text style={styles.keypadButtonText}>8</Text>
            <Text style={styles.keypadSubText}>TUV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('9')}>
            <Text style={styles.keypadButtonText}>9</Text>
            <Text style={styles.keypadSubText}>WXYZ</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('+')}>
            <Text style={styles.keypadButtonText}>+ * #</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keypadButtonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('backspace')}>
            <Feather name="delete" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.homeIndicator} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    padding: 5,
  },
  starIcon: {
    padding: 5,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  codeBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  codeBoxActive: {
    borderColor: '#000',
  },
  codeBoxFilled: {
    backgroundColor: 'white',
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: '#000',
    fontSize: 14,
  },
  resendTextDisabled: {
    color: '#888',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  keypad: {
    marginTop: 'auto',
    backgroundColor: '#EEF0F8',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderColor: '#CCC',
  },
  keypadButton: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderColor: '#CCC',
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '400',
  },
  keypadSubText: {
    fontSize: 10,
    color: '#777',
    marginTop: -2,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 8,
  },
});

export default EmailVerificationScreen;
