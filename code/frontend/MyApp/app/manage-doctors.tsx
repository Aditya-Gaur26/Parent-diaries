import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput 
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import useRoleProtection from '../hooks/useRoleProtection';

export default function ManageDoctorsScreen() {
  const { isLoading: isRoleLoading } = useRoleProtection(['admin']);
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'approved', 'pending'

  // Refresh doctor list when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
    }, [])
  );

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        router.replace('/login');
        return;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.doctors) {
        const sortedDoctors = response.data.doctors.sort((a, b) => {
          // Sort by approval status (pending first)
          if (a.isApproved === b.isApproved) {
            return new Date(b.registrationDate) - new Date(a.registrationDate);
          }
          return a.isApproved ? 1 : -1;
        });
        
        setDoctors(sortedDoctors);
        applyFilters(sortedDoctors, searchQuery, filterStatus);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiError = (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      AsyncStorage.removeItem('authToken');
      Alert.alert('Session Expired', 'Please login again');
      router.replace('/login');
    } else {
      Alert.alert('Error', 'Could not load doctors information');
    }
  };

  const applyFilters = (doctorList, query, status) => {
    let filtered = [...doctorList];
    
    // Apply search query filter
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name?.toLowerCase().includes(lowercaseQuery) || 
        doctor.email?.toLowerCase().includes(lowercaseQuery) ||
        doctor.specialization?.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    // Apply status filter
    if (status === 'approved') {
      filtered = filtered.filter(doctor => doctor.isApproved);
    } else if (status === 'pending') {
      filtered = filtered.filter(doctor => !doctor.isApproved);
    }
    
    setFilteredDoctors(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(doctors, text, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    applyFilters(doctors, searchQuery, status);
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(
        `${BACKEND_URL}/api/admin/doctors/${doctorId}`,
        { isApproved: true },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update the local state
      const updatedDoctors = doctors.map(doctor => 
        doctor._id === doctorId ? { ...doctor, isApproved: true } : doctor
      );
      setDoctors(updatedDoctors);
      applyFilters(updatedDoctors, searchQuery, filterStatus);
      
      Alert.alert('Success', 'Doctor approved successfully');
    } catch (error) {
      console.error('Error approving doctor:', error);
      Alert.alert('Error', 'Failed to approve doctor');
    }
  };

  const confirmDeleteDoctor = (doctorId, doctorName) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete Dr. ${doctorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDoctor(doctorId) }
      ]
    );
  };

  const deleteDoctor = async (doctorId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.delete(
        `${BACKEND_URL}/api/admin/doctors/${doctorId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update the local state
      const updatedDoctors = doctors.filter(doctor => doctor._id !== doctorId);
      setDoctors(updatedDoctors);
      applyFilters(updatedDoctors, searchQuery, filterStatus);
      
      Alert.alert('Success', 'Doctor deleted successfully');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      Alert.alert('Error', 'Failed to delete doctor');
    }
  };

  const renderDoctorItem = ({ item }) => (
    <View style={[
      styles.doctorItem,
      !item.isApproved && styles.pendingDoctorItem
    ]}>
      <TouchableOpacity 
        style={styles.doctorMainInfo}
        onPress={() => router.push({
          pathname: '/doctor-details',
          params: { doctorId: item._id }
        })}
      >
        <View>
          <Text style={styles.doctorName}>Dr. {item.name}</Text>
          <Text style={styles.doctorSpecialization}>{item.specialization}</Text>
          <Text style={styles.doctorEmail}>{item.email}</Text>
          
          {!item.isApproved && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending Approval</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionsContainer}>
        {!item.isApproved && (
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => handleApproveDoctor(item._id)}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#22C55E" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => confirmDeleteDoctor(item._id, item.name)}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isRoleLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Verifying access...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Doctors</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/register-doctor')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'all' && styles.activeFilterButton]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'pending' && styles.activeFilterButton]}
          onPress={() => handleFilterChange('pending')}
        >
          <Text style={[styles.filterText, filterStatus === 'pending' && styles.activeFilterText]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'approved' && styles.activeFilterButton]}
          onPress={() => handleFilterChange('approved')}
        >
          <Text style={[styles.filterText, filterStatus === 'approved' && styles.activeFilterText]}>
            Approved
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredDoctors}
            renderItem={renderDoctorItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="medical" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery || filterStatus !== 'all' 
                    ? 'No doctors match your filters'
                    : 'No doctors registered yet'}
                </Text>
              </View>
            }
          />
          
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              Total: {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
            </Text>
          </View>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#000',
  },
  filterText: {
    color: '#555',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  doctorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  pendingDoctorItem: {
    backgroundColor: '#FEF3C7',
  },
  doctorMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  doctorEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 8,
  },
  pendingText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  summaryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
});
