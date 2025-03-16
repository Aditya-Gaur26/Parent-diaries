import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';

const EditProfileScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModified, setIsFormModified] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  type ProfileDataType = {
    name: string;
    email: string;
    mobile_number: string;
    dob: string;
    age: string;  // Changed from countryRegion to age
  };
  
  const [originalData, setOriginalData] = useState<ProfileDataType | null>(null);
  const [profileData, setProfileData] = useState<ProfileDataType>({
    name: '',
    email: '',
    mobile_number: '',
    dob: '',
    age: ''  // Changed from countryRegion to age
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('Loading user data:', userData); // Debug log
        
        const formattedData = {
          name: userData.name || '',
          email: userData.email || '',
          mobile_number: userData.mobile_number || '',
          dob: '',
          // Convert age to string before assigning (it's a number in the response)
          age: userData.age ? userData.age.toString() : ''
        };
        
        if (userData.dob) {
          const isoDate = new Date(userData.dob);
          const dd = isoDate.getDate().toString().padStart(2, '0');
          const mm = (isoDate.getMonth() + 1).toString().padStart(2, '0');
          const yyyy = isoDate.getFullYear().toString();
          formattedData.dob = `${dd}/${mm}/${yyyy}`;
        }
        
        console.log('Formatted user data:', formattedData); // Debug log
        setProfileData(formattedData);
        setOriginalData(formattedData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDateFormat = (date: string): boolean => {
    // Check if date matches DD/MM/YYYY format
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!regex.test(date)) return false;

    // Check if date is valid
    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getDate() === day &&
           dateObj.getMonth() === month - 1 &&
           dateObj.getFullYear() === year;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'dob') {
      // Allow only numbers and forward slash
      value = value.replace(/[^\d/]/g, '');
      
      // Automatically add slashes
      if (value.length === 2 || value.length === 5) {
        if (value.charAt(value.length - 1) !== '/') {
          value = value + '/';
        }
      }
      
      // Limit the length to 10 characters (DD/MM/YYYY)
      if (value.length > 10) {
        return;
      }
    }

    setProfileData(prev => {
      const newData = { ...prev, [field]: value };
      setIsFormModified(JSON.stringify(newData) !== JSON.stringify(originalData));
      return newData;
    });
  };

  const handleSaveChanges = async () => {
    try {
      if (!profileData.name || profileData.name === 'Enter your name') {
        Alert.alert('Error', 'Please enter your name');
        return;
      }

      if (!profileData.email || profileData.email === 'Enter your email') {
        Alert.alert('Error', 'Please enter your email');
        return;
      }

      if (profileData.dob && !validateDateFormat(profileData.dob)) {
        Alert.alert('Error', 'Please enter date in DD/MM/YYYY format');
        return;
      }

      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const dataToSend = {
        ...profileData,
        dob: profileData.dob,
      };

      const response = await axios.put(
        `${BACKEND_URL}/api/users/profile`,
        dataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      Alert.alert('Success', 'Profile updated successfully');
      
      router.back();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/44.jpg' }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={profileData.email}
              editable={false}
              placeholder="Email cannot be changed"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={profileData.mobile_number}
              keyboardType="phone-pad"
              onChangeText={(text) => handleInputChange('mobile_number', text)}
              placeholder="Enter mobile number"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={profileData.dob}
              onChangeText={(text) => handleInputChange('dob', text)}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#999"
              maxLength={10}
              keyboardType="numeric"
            />
          </View>

          {/* Age Field (replaces Country/Region) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={profileData.age}
              editable={false}
              placeholder="Age "
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, !isFormModified && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={!isFormModified}
        >
          <Text style={styles.saveButtonText}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#666',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  formContainer: {
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    fontSize: 15,
  },
  dropdownInput: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#212466',
    borderRadius: 5,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
});

export default EditProfileScreen;
