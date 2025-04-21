import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import { Ionicons } from '@expo/vector-icons';

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams();
  const [child, setChild] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [medicalReport, setMedicalReport] = useState(null);

  useEffect(() => {
    if (!patientId) {
      Alert.alert('Error', 'No patient ID provided');
      router.back();
      return;
    }
    fetchChildDetails();
  }, [patientId]);

  const fetchChildDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${BACKEND_URL}/api/doctors/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setChild(response.data);
    } catch (error) {
      console.error('Error fetching child details:', error);
    } finally {
      setIsLoading(false);
    }
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

  const openMilestoneChart = () => {
    router.push({
      pathname: '/medical-report',
      params: { childId: patientId }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {child && (
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childInfo}>Gender: {child.gender}</Text>
            <Text style={styles.childInfo}>Date of Birth: {new Date(child.dateOfBirth).toLocaleDateString()}</Text>
            <Text style={styles.childInfo}>Blood Group: {child.bloodGroup}</Text>
            <Text style={styles.childInfo}>Medical Conditions: {child.medicalConditions.join(', ')}</Text>
            <Text style={styles.childInfo}>Allergies: {child.allergies.join(', ')}</Text>
            <TouchableOpacity style={styles.chatButton} 
              onPress={() => startChatWithParent(child.parentId, child.parentName)}
            >
              <Text style={styles.chatButtonText}>Chat with Parent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatButton} onPress={openMilestoneChart}>
              <Text style={styles.chatButtonText}>Get Patient Milestone Chart</Text>
            </TouchableOpacity>

            {medicalReport && (
              <View style={styles.reportContainer}>
                <Text style={styles.reportTitle}>Medical Report</Text>
                <Text style={styles.reportText}>{JSON.stringify(medicalReport, null, 2)}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childDetails: {
    marginTop: 20,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  childInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  chatButton: {
    marginTop: 20,
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  reportContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reportText: {
    fontSize: 14,
    lineHeight: 20,
  }
});