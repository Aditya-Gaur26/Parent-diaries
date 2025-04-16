import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import useRoleProtection from '../hooks/useRoleProtection';

export default function DoctorDetailsScreen() {
  const { isLoading: isRoleLoading } = useRoleProtection(['admin']);
  const router = useRouter();
  const { doctorId } = useLocalSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
    } else {
      Alert.alert('Error', 'Doctor ID is missing');
      router.back();
    }
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/doctors/${doctorId}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.doctor) {
        setDoctor(response.data.doctor);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        Alert.alert('Not Found', 'Doctor does not exist or may have been deleted');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to load doctor details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDoctor = async () => {
    try {
      setIsApproving(true);
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.put(
        `${BACKEND_URL}/api/admin/doctors/${doctorId}`,
        { isApproved: true },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update local state
      setDoctor(prev => ({
        ...prev,
        isApproved: true
      }));
      
      Alert.alert('Success', 'Doctor approved successfully');
    } catch (error) {
      console.error('Error approving doctor:', error);
      Alert.alert('Error', 'Failed to approve doctor');
    } finally {
      setIsApproving(false);
    }
  };

  const confirmDeleteDoctor = () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${doctor?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteDoctor }
      ]
    );
  };

  const handleDeleteDoctor = async () => {
    try {
      setIsDeleting(true);
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.delete(
        `${BACKEND_URL}/api/admin/doctors/${doctorId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      Alert.alert(
        'Success', 
        'Doctor deleted successfully',
        [{ text: 'OK', onPress: () => router.replace('/manage-doctors') }]
      );
    } catch (error) {
      console.error('Error deleting doctor:', error);
      Alert.alert('Error', 'Failed to delete doctor');
      setIsDeleting(false);
    }
  };

  if (isRoleLoading || isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>
          {isRoleLoading ? 'Verifying access...' : 'Loading doctor details...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Details</Text>
        <View style={{ width: 24 }} /> {/* Empty view for alignment */}
      </View>
      
      <ScrollView style={styles.content}>
        {doctor ? (
          <>
            <View style={styles.profileSection}>
              <Image
                source={require('@/assets/images/profile-pic.jpg')} 
                style={styles.profileImage}
              />
              <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
              <Text style={styles.doctorSpecialization}>{doctor.specialization}</Text>
              
              {!doctor.isApproved && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending Approval</Text>
                </View>
              )}
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{doctor.email}</Text>
              </View>
              
              {doctor.mobile_number && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{doctor.mobile_number}</Text>
                </View>
              )}
              
              {doctor.dob && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Date of Birth</Text>
                  <Text style={styles.infoValue}>
                    {new Date(doctor.dob).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Professional Information</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Qualification</Text>
                <Text style={styles.infoValue}>{doctor.qualification || 'Not provided'}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>License Number</Text>
                <Text style={styles.infoValue}>{doctor.licenseNumber || 'Not provided'}</Text>
              </View>
              
              {doctor.experience !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Years of Experience</Text>
                  <Text style={styles.infoValue}>{doctor.experience}</Text>
                </View>
              )}
              
              {doctor.hospitalAffiliation && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Hospital/Clinic</Text>
                  <Text style={styles.infoValue}>{doctor.hospitalAffiliation}</Text>
                </View>
              )}
              
              {doctor.appointmentFee !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Consultation Fee</Text>
                  <Text style={styles.infoValue}>₹{doctor.appointmentFee}</Text>
                </View>
              )}
              
              {doctor.bio && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Professional Bio</Text>
                  <Text style={styles.biographyText}>{doctor.bio}</Text>
                </View>
              )}
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Registration Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(doctor.registrationDate || doctor.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.actionSection}>
              {!doctor.isApproved && (
                <TouchableOpacity 
                  style={[styles.approveButton, isApproving && styles.disabledButton]}
                  onPress={handleApproveDoctor}
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.approveButtonText}>Approve Doctor</Text>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.deleteButton, isDeleting && styles.disabledButton]}
                onPress={confirmDeleteDoctor}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Doctor</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
            <Text style={styles.errorText}>Doctor information not available</Text>
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
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  doctorSpecialization: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  pendingText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  biographyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionSection: {
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  approveButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});
