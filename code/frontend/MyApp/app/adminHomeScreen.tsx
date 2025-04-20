import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, BackHandler, ActivityIndicator, LogBox, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import useRoleProtection from '../hooks/useRoleProtection';

// Suppress warnings during development
LogBox.ignoreAllLogs();

export default function AdminHomeScreen() {
  const router = useRouter();
  const { isLoading: isRoleLoading } = useRoleProtection(['admin']);
  const [user, setUser] = useState({ name: 'Admin', email: '', avatar: null });
  const [isLoading, setIsLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  
  // Add back button handler to prevent going back to auth screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Exit App', 
        'Do you want to exit Admin Portal?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Exit', onPress: () => BackHandler.exitApp() }
        ],
        { cancelable: true }
      );
      return true; // Prevent default back behavior
    });
    
    return () => backHandler.remove();
  }, []);

  // Ensure the screen is accessible only to admins
  useEffect(() => {
    const checkRole = async () => {
      const role = await AsyncStorage.getItem('userRole');
      if (role !== 'admin') {
        console.log('Access denied: Not an admin role');
        Alert.alert('Access Denied', 'You do not have admin privileges');
        router.replace('/login');
      } else {
        fetchAdminProfile();
      }
    };
    
    checkRole();
  }, []);

  // Refresh doctor list when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('AdminHomeScreen focused, refreshing doctor list...');
      fetchDoctors();
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  const fetchAdminProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found, redirecting to login');
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setUser(response.data);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setIsDoctorsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        setIsDoctorsLoading(false);
        return;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.doctors) {
        setDoctors(response.data.doctors);
        
        // Count pending approvals
        const pendingCount = response.data.doctors.filter(
          doctor => !doctor.isApproved
        ).length;
        
        setPendingApprovals(pendingCount);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      handleAuthError(error);
    } finally {
      setIsDoctorsLoading(false);
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
  
  const navigateToDoctorDetails = (doctorId) => {
    router.push({
      pathname: '/doctor-details',
      params: { doctorId }
    });
  };

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.doctorItem, 
        !item.isApproved && styles.pendingApprovalItem
      ]}
      onPress={() => navigateToDoctorDetails(item._id)}
    >
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpecialty}>{item.specialization}</Text>
        {!item.isApproved && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending Approval</Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={20} color="#888" />
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with admin info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => router.push('/edit-profile')}>
              <Image
                source={user.avatar ? { uri: user.avatar } : require('@/assets/images/profile-pic.jpg')}
                style={styles.profilePic}
              />
            </TouchableOpacity>
            <Text style={styles.greeting}>Admin Portal</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Dashboard summary */}
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Admin Dashboard</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{doctors.length}</Text>
              <Text style={styles.statLabel}>Total Doctors</Text>
            </View>
            
            <View style={[styles.statCard, pendingApprovals > 0 && styles.highlightCard]}>
              <Text style={[styles.statValue, pendingApprovals > 0 && styles.highlightText]}>
                {pendingApprovals}
              </Text>
              <Text style={[styles.statLabel, pendingApprovals > 0 && styles.highlightText]}>
                Pending Approvals
              </Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/register-doctor')}>
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person-add" size={24} color="#000" />
                </View>
                <Text style={styles.optionText}>Register New Doctor</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/manage-doctors')}>
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="people" size={24} color="#000" />
                </View>
                <Text style={styles.optionText}>Manage All Doctors</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Add new option for Reports */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/manage-reports')}>
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-text" size={24} color="#000" />
                </View>
                <Text style={styles.optionText}>Manage User Reports</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={() => router.push('/system-settings')}>
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="settings" size={24} color="#000" />
                </View>
                <Text style={styles.optionText}>System Settings</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent doctors section */}
        <View style={styles.doctorsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Doctors</Text>
            <TouchableOpacity onPress={() => router.push('/manage-doctors')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {isDoctorsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : doctors.length === 0 ? (
            <Text style={styles.noDoctorsText}>No doctors registered yet</Text>
          ) : (
            doctors.slice(0, 4).map((doctor) => renderDoctorItem({ item: doctor }))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  highlightCard: {
    backgroundColor: '#FEF3C7',
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
  highlightText: {
    color: '#D97706',
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
    backgroundColor: '#e0e0e0',
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
  doctorsSection: {
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
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  pendingApprovalItem: {
    backgroundColor: '#FEF3C7',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#FBBF24',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pendingText: {
    color: '#7C2D12',
    fontSize: 12,
    fontWeight: '500',
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
  noDoctorsText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});
