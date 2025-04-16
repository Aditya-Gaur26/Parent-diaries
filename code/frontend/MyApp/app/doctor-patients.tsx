import React, { useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import useRoleProtection from '../hooks/useRoleProtection';

export default function DoctorPatientsScreen() {
  const { isLoading: isRoleLoading } = useRoleProtection(['doctor']);
  const router = useRouter();
  
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Refresh patient list when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [])
  );

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/doctors/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && response.data.patients) {
        setPatients(response.data.patients);
        applyFilters(response.data.patients, searchQuery);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleApiError = (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      AsyncStorage.removeItem('authToken');
      Alert.alert('Session Expired', 'Please login again');
      router.replace('/login');
    } else {
      Alert.alert('Error', 'Could not load patients');
    }
  };

  const applyFilters = (patientList, query) => {
    let filtered = [...patientList];
    
    // Apply search query filter
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(patient => {
        // Add null/undefined checks before calling toLowerCase
        const patientName = patient.name || '';
        const parentName = patient.parentInfo?.name || '';
        
        // We don't know exactly which field is undefined, so check all possible search fields
        return patientName.toLowerCase().includes(lowercaseQuery) || 
               parentName.toLowerCase().includes(lowercaseQuery);
      });
    }
    
    setFilteredPatients(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(patients, text);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const navigateToDetails = (childId) => {
    router.push({
      pathname: '/patient-details',
      params: { patientId : childId }
    });
  };

  if (isRoleLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Verifying access...</Text>
      </View>
    );
  }

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigateToDetails(item._id)}>
      <View style={styles.patientItem}>
        <Text style={styles.patientName}>{item.name || 'Unknown Patient'}</Text>
        {/* Use parent info instead of email which doesn't exist in children records */}
        <Text style={styles.patientInfo}>
          {item.gender ? `${item.gender} • ` : ''}
          {item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'No DOB'}
        </Text>
        {item.parentInfo && (
          <Text style={styles.parentInfo}>
            Parent: {item.parentInfo.name || 'Unknown'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patients</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem} // Use the extracted render function
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'No patients match your search'
                  : 'No patients found'}
              </Text>
            </View>
          }
        />
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  patientItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  parentInfo: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});