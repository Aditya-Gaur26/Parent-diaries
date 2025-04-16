import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import useRoleProtection from '../hooks/useRoleProtection';

export default function RegisterDoctorScreen() {
  const { isLoading: isRoleLoading } = useRoleProtection(['admin']);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile_number: '',
    dob: '',
    specialization: 'Pediatrician',
    qualification: '',
    licenseNumber: '',
    experience: '',
    hospitalAffiliation: '',
    appointmentFee: '',
    bio: '',
    isApproved: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  
  const specializations = [
    'Pediatrician',
    'Neonatologist',
    'Pediatric Neurologist',
    'Pediatric Cardiologist',
    'General Pediatrician'
  ];

  const handleChange = (field, value) => {
    // Clear error when field is edited
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validations
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
    if (!formData.qualification) newErrors.qualification = 'Qualification is required';
    
    // Check if experience is a number
    if (formData.experience && isNaN(Number(formData.experience))) {
      newErrors.experience = 'Experience must be a number';
    }
    
    // Check if appointment fee is a number
    if (formData.appointmentFee && isNaN(Number(formData.appointmentFee))) {
      newErrors.appointmentFee = 'Appointment fee must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Prepare numeric fields
      const dataToSubmit = {
        ...formData,
        experience: formData.experience ? Number(formData.experience) : undefined,
        appointmentFee: formData.appointmentFee ? Number(formData.appointmentFee) : undefined
      };
      
      await axios.post(`${BACKEND_URL}/api/admin/register-doctor`, dataToSubmit, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      Alert.alert(
        'Success',
        'Doctor registered successfully',
        [
          {
            text: 'OK',
            onPress: () => router.push('/manage-doctors')
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to register doctor';
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register New Doctor</Text>
          <View style={{ width: 24 }} /> {/* Empty view for alignment */}
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter doctor's full name"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter doctor's email"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter temporary password"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              value={formData.mobile_number}
              onChangeText={(value) => handleChange('mobile_number', value)}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={formData.dob}
              onChangeText={(value) => handleChange('dob', value)}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Professional Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specialization *</Text>
            <TouchableOpacity
              style={styles.dropdownField}
              onPress={() => setShowSpecializationModal(true)}
            >
              <Text style={styles.dropdownText}>
                {formData.specialization || "Select specialization"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Modal
            visible={showSpecializationModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSpecializationModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Specialization</Text>
                <ScrollView style={styles.optionsList}>
                  {specializations.map(spec => (
                    <TouchableOpacity
                      key={spec}
                      style={[
                        styles.optionItem,
                        formData.specialization === spec && styles.selectedOption
                      ]}
                      onPress={() => {
                        handleChange('specialization', spec);
                        setShowSpecializationModal(false);
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        formData.specialization === spec && styles.selectedOptionText
                      ]}>
                        {spec}
                      </Text>
                      {formData.specialization === spec && (
                        <Ionicons name="checkmark" size={20} color="#000" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSpecializationModal(false)}
                >
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Qualification *</Text>
            <TextInput
              style={[styles.input, errors.qualification && styles.inputError]}
              placeholder="E.g., MBBS, MD Pediatrics"
              value={formData.qualification}
              onChangeText={(value) => handleChange('qualification', value)}
            />
            {errors.qualification && <Text style={styles.errorText}>{errors.qualification}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={[styles.input, errors.licenseNumber && styles.inputError]}
              placeholder="Enter medical license number"
              value={formData.licenseNumber}
              onChangeText={(value) => handleChange('licenseNumber', value)}
            />
            {errors.licenseNumber && <Text style={styles.errorText}>{errors.licenseNumber}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={[styles.input, errors.experience && styles.inputError]}
              placeholder="Enter years of experience"
              value={formData.experience}
              onChangeText={(value) => handleChange('experience', value)}
              keyboardType="numeric"
            />
            {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hospital/Clinic Affiliation</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter hospital or clinic name"
              value={formData.hospitalAffiliation}
              onChangeText={(value) => handleChange('hospitalAffiliation', value)}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Appointment Fee</Text>
            <TextInput
              style={[styles.input, errors.appointmentFee && styles.inputError]}
              placeholder="Enter fee in INR"
              value={formData.appointmentFee}
              onChangeText={(value) => handleChange('appointmentFee', value)}
              keyboardType="numeric"
            />
            {errors.appointmentFee && <Text style={styles.errorText}>{errors.appointmentFee}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Professional Bio</Text>
            <TextInput
              style={[styles.textArea]}
              placeholder="Enter a brief professional bio"
              value={formData.bio}
              onChangeText={(value) => handleChange('bio', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                formData.isApproved ? styles.checkboxChecked : {}
              ]}
              onPress={() => handleChange('isApproved', !formData.isApproved)}
            >
              {formData.isApproved && <Ionicons name="checkmark" size={20} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              Approve doctor immediately
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Register Doctor</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  dropdownField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionsList: {
    width: '100%',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#000',
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
