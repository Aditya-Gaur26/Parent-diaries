import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, BackHandler, ActivityIndicator, LogBox } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';

// Suppress warnings during development
LogBox.ignoreAllLogs();

export default function DoctorHomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState({ 
    name: 'Doctor', 
    email: '', 
    avatar: null,
    specialization: '',
    experience: '',
    qualification: '',
    hospitalAffiliation: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [isPatientsLoading, setIsPatientsLoading] = useState(true);

  // // Add back button handler to prevent going back to auth screens
  // useEffect(() => {
  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
  //     Alert.alert(
  //       'Exit App', 
  //       'Do you want to exit Doctor Portal?',
  //       [
  //         { text: 'Cancel', style: 'cancel', onPress: () => {} },
  //         { text: 'Exit', onPress: () => BackHandler.exitApp() }
  //       ],
  //       { cancelable: true }
  //     );
  //     return true; // Prevent default back behavior
  //   });
    
  //   return () => backHandler.remove();
  // }, []);

  // Fetch user profile when component mounts
  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  // Refresh patient list when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('DoctorHomeScreen focused, refreshing patient list...');
      fetchPatients();
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  const fetchDoctorProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found, redirecting to login');
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/doctors/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setUser(response.data);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setIsPatientsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        setIsPatientsLoading(false);
        return;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/doctors/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.patients) {
        // Add parent information to each patient record
        const patientsWithParentInfo = response.data.patients.map(patient => ({
          ...patient,
          parentId: patient.parentId || patient.parentInfo?._id, // Make sure we have parentId
          parentName: patient.parentInfo?.name || "Parent" // Include parent name if available
        }));
        
        setPatients(patientsWithParentInfo);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      handleAuthError(error);
    } finally {
      setIsPatientsLoading(false);
    }
  };

  const handleAuthError = async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      Alert.alert(
        'Session Expired', 
        'Your session has expired. Please login again.',
        [{ text: 'OK', onPress: () => router.replace('/welcome') }]
      );
    } else {
      Alert.alert(
        'Error', 
        'Failed to load data. Please try again later.'
      );
    }
  };

  const navigateToPatientDetails = (patientId) => {
    router.push({
      pathname: '/patient-details',
      params: { patientId }
    });
  };

  const startChatWithParent = async (parentId, parentName) => {
    try {
      console.log('Starting chat with parent:', parentId, parentName);
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      const doctorData = userData ? JSON.parse(userData) : null;
      
      if (!token || !doctorData || !doctorData._id) {
        Alert.alert('Error', 'Could not authenticate. Please login again.');
        return;
      }
      
      // Connect socket before creating chat
      const socketService = (await import('../utils/socketService')).default;
      await socketService.connect();
      
      // Create or find chat with parent
      const chatResponse = await axios.post(`${BACKEND_URL}/api/chat/create`, {
        userId: doctorData._id,
        receiverId: parentId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (chatResponse.data && chatResponse.data._id) {
        const chatId = chatResponse.data._id;
        
        // Join socket room
        socketService.joinChat(chatId);
        
        // Navigate to chat interface
        router.push({
          pathname: '/chat-room',
          params: {
            chatId,
            userId: parentId,
            userName: parentName,
            currentUserId: doctorData._id
          }
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error starting chat with parent:', error);
      Alert.alert('Error', 'Unable to start chat. Please try again.');
    }
  };

  const renderPatientItem = (patient, index) => (
    <View key={index} style={styles.patientItem}>
      <TouchableOpacity 
        style={styles.patientInfoButton}
        onPress={() => navigateToPatientDetails(patient._id)}
      >
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientDetails}>
            {new Date(patient.dateOfBirth).toLocaleDateString()} • {patient.gender}
          </Text>
          {patient.bloodGroup && (
            <Text style={styles.patientBloodGroup}>Blood Group: {patient.bloodGroup}</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.patientActions}>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => startChatWithParent(patient.parentId, patient.parentName)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          <Text style={styles.chatButtonText}>Chat with Parent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigateToPatientDetails(patient._id)}>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with doctor info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => router.push('/edit-profile')}>
              <Image 
                source={user.avatar ? { uri: user.avatar } : require('@/assets/images/profile-pic.jpg')}
                style={styles.profilePic}
              />
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Dr. {user.name}</Text>
              <Text style={styles.specialization}>{user.specialization}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Doctor dashboard */}
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{patients.length}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Today's Consultations</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/doctor-patients')}>
              <View style={styles.optionContent}>
                <View style={[styles.iconContainer, {backgroundColor: '#E8F4FE'}]}>
                  <Ionicons name="people" size={24} color="#0284C7" />
                </View>
                <Text style={styles.optionText}>View All Patients</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/vaccination-schedules')}>
              <View style={styles.optionContent}>
                <View style={[styles.iconContainer, {backgroundColor: '#F0FDF4'}]}>
                  <Ionicons name="medical" size={24} color="#15803D" />
                </View>
                <Text style={styles.optionText}>Vaccination Schedules</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent patients section */}
        <View style={styles.patientsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Patients</Text>
            <TouchableOpacity onPress={() => router.push('/view-patients')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {isPatientsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading patients...</Text>
            </View>
          ) : patients.length === 0 ? (
            <Text style={styles.noPatientsText}>No patients available</Text>
          ) : (
            patients.slice(0, 3).map((patient, index) => renderPatientItem(patient, index))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  specialization: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    padding: 5,
  },
  dashboardSection: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flexBasis: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: 20,
  },
  optionsContainer: {
    marginBottom: 10,
  },
  optionCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  patientsSection: {
    marginBottom: 30,
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  patientInfoButton: {
    flex: 1,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  patientBloodGroup: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  patientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  noPatientsText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  noAppointmentsText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});
