import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import socketService from '@/utils/socketService';

export default function DoctorDirectoryScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchDoctors();
    
    // Get current user ID when component mounts
    AsyncStorage.getItem('userData')
      .then(userDataStr => {
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            if (userData && userData._id) {
              setCurrentUserId(userData._id);
            }
          } catch (err) {
            console.error('Error parsing userData:', err);
          }
        }
      })
      .catch(err => console.error('Error getting userData:', err));
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(response.data)
      if (response.data && Array.isArray(response.data)) {
        setDoctors(response.data);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      Alert.alert('Error', 'Unable to load doctors. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = async (doctorId, doctorName) => {
    try {
      console.log('Starting chat with doctor:', doctorId, doctorName);
      const token = await AsyncStorage.getItem('authToken');
      
      // Ensure we have current user ID
      let userId = currentUserId;
      if (!userId) {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData && userData._id) {
            userId = userData._id;
            setCurrentUserId(userId);
          }
        }
      }
      
      if (!token || !userId) {
        router.replace('/login');
        return;
      }
      
      // Connect socket before creating chat
      await socketService.connect();
      
      // Create or find existing chat with this doctor
      const chatResponse = await axios.post(`${BACKEND_URL}/api/chat/create`, {
        userId: userId,
        receiverId: doctorId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (chatResponse.data && chatResponse.data._id) {
        const chatId = chatResponse.data._id;
        
        // Join socket room before navigation
        socketService.joinChat(chatId);
        
        // Navigate to chat room with doctor
        router.push({
          pathname: '/chat-room',
          params: { 
            chatId: chatId, 
            userId: doctorId,
            userName: doctorName,
            currentUserId: userId
          }
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error starting chat with doctor:', error);
      Alert.alert('Error', 'Unable to start chat. Please try again.');
    }
  };

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.doctorItem}
      onPress={() => startChat(item._id, item.name)}
    >
      <Image
        source={item.profilePicture ? { uri: item.profilePicture } : require('@/assets/images/doctor-profile.jpg')}
        style={styles.avatar}
      />
      
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>Dr. {item.name}</Text>
        <Text style={styles.specialization}>{item.specialization || 'General Physician'}</Text>
        <Text style={styles.hospital}>{item.hospital || 'Medical Center'}</Text>
      </View>
      
      <View style={styles.chatIconContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#4CAF50" />
      </View>
    </TouchableOpacity>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No doctors available at the moment</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect with Doctors</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Select a doctor to start a chat conversation
          </Text>
          <FlatList
            data={doctors}
            renderItem={renderDoctorItem}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={EmptyComponent}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    margin: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  hospital: {
    fontSize: 13,
    color: '#777',
  },
  chatIconContainer: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
