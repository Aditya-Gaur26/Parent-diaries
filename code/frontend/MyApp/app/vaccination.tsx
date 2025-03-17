import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';

interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
}

interface VaccinationRecord {
  disease: string;
  doseType: string;
  expectedDate: string;
  status: string;
}

interface VaccinationSchedule {
  disease: string;
  doseType: string;
  expectedDate: string;
  status: 'PENDING' | 'COMPLETED';
  actualDate?: string;
}

const VACCINATION_AGE_LIMIT = 6; // 6 years

const VaccinationPage = () => {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<any>(null);
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([]);
  const [vaccinationData, setVaccinationData] = useState({
    disease: '',
    doseType: '',
    date: new Date(),
  });
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [showDiseasePicker, setShowDiseasePicker] = useState(false);
  const [showDosePicker, setShowDosePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vaccineSchedule, setVaccineSchedule] = useState<VaccinationSchedule[]>([]);
  const [diseases, setDiseases] = useState([]);
  const [doseTypes, setDoseTypes] = useState([]);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchVaccinationSchedule();
    }
  }, [selectedChild]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await axios.get(
          `${BACKEND_URL}/api/vaccination/metadata`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setDiseases(response.data.diseases);
        setDoseTypes(response.data.doseTypes);
      } catch (error) {
        console.error('Error fetching vaccination metadata:', error);
        Alert.alert('Error', 'Failed to fetch vaccination data');
      }
    };

    fetchMetadata();
  }, []);

  const isChildEligibleForVaccination = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInYears = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return ageInYears <= VACCINATION_AGE_LIMIT;
  };

  const fetchChildren = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/users/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter children based on vaccination age
      const eligibleChildren = response.data.children.filter(
        (child: Child) => isChildEligibleForVaccination(child.dateOfBirth)
      );

      if (eligibleChildren.length === 0) {
        Alert.alert(
          'No Eligible Children',
          'No children within vaccination age (0-6 years) found.'
        );
      }

      setChildren(eligibleChildren);
      if (eligibleChildren.length > 0) {
        setSelectedChild(eligibleChildren[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      Alert.alert('Error', 'Failed to fetch children data');
    }
  };

  const fetchVaccinationSchedule = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${BACKEND_URL}/api/vaccination/child/${selectedChild?._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setVaccineSchedule(response.data.completeSchedule);
    } catch (error) {
      console.error('Error fetching vaccination schedule:', error);
      Alert.alert('Error', 'Failed to fetch vaccination schedule');
    }
  };

  const handleUploadPrescription = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (!result.didCancel && result.assets && result.assets[0]) {
        setPrescription(result.assets[0]);
      }
    } catch (error) {
      console.error('Error uploading prescription:', error);
      Alert.alert('Error', 'Failed to upload prescription');
    }
  };

  const handleSubmit = async () => {
    if (!selectedChild || !vaccinationData.disease || !vaccinationData.doseType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      
      if (prescription) {
        formData.append('prescription', {
          uri: prescription.uri,
          type: 'image/jpeg',
          name: prescription.fileName || 'prescription.jpg',
        });
      }
      
      formData.append('childId', selectedChild._id);
      formData.append('disease', vaccinationData.disease);
      formData.append('doseType', vaccinationData.doseType);
      formData.append('date', vaccinationData.date.toISOString());

      const response = await axios.post(
        `${BACKEND_URL}/api/vaccinations`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      // Update vaccination records after successful submission
      setVaccinationRecords(response.data.vaccinations || []);
      Alert.alert('Success', 'Vaccination record added successfully');
      router.back();
    } catch (error) {
      console.error('Error submitting vaccination:', error);
      Alert.alert('Error', 'Failed to submit vaccination record');
    } finally {
      setLoading(false);
    }
  };

  const handleLogVaccination = async () => {
    if (!selectedChild || !vaccinationData.disease || !vaccinationData.doseType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const formData = new FormData();
      
      if (prescription) {
        formData.append('prescription', {
          uri: prescription.uri,
          type: 'image/jpeg',
          name: prescription.fileName || 'prescription.jpg',
        });
      }
      
      formData.append('childId', selectedChild._id);
      formData.append('disease', vaccinationData.disease);
      formData.append('doseType', DoseType[vaccinationData.doseType as keyof typeof DoseType]); // Convert to proper enum value
      formData.append('actualDate', vaccinationData.date.toISOString());

      const response = await axios.post(
        `${BACKEND_URL}/api/vaccination/manage`,
        {
          childId: selectedChild._id,
          disease: vaccinationData.disease,
          doseType: DoseType[vaccinationData.doseType as keyof typeof DoseType], // Convert to proper enum value
          actualDate: vaccinationData.date.toISOString()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      setVaccineSchedule(response.data.completeSchedule);
      Alert.alert('Success', 'Vaccination logged successfully');
      
      // Reset form
      setVaccinationData({
        disease: '',
        doseType: '',
        date: new Date(),
      });
      setPrescription(null);
      
    } catch (error: any) {
      console.error('Error logging vaccination:', error);
      if (error.response?.data?.msg) {
        Alert.alert('Error', error.response.data.msg);
      } else {
        Alert.alert('Error', 'Failed to log vaccination');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderChildPickerModal = () => (
    <Modal
      isVisible={showChildPicker}
      onBackdropPress={() => setShowChildPicker(false)}
      style={styles.modal}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Child</Text>
        {children.length === 0 ? (
          <Text style={styles.noChildText}>No children eligible for vaccination</Text>
        ) : (
          children.map((child) => {
            const age = ((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / 
              (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
            
            return (
              <TouchableOpacity
                key={child._id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedChild(child);
                  setShowChildPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {child.name} ({age} years)
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </Modal>
  );

  const renderDiseasePickerModal = () => (
    <Modal
      isVisible={showDiseasePicker}
      onBackdropPress={() => setShowDiseasePicker(false)}
      style={styles.modal}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Disease</Text>
        {diseases.map((disease) => (
          <TouchableOpacity
            key={disease.name}
            style={styles.modalItem}
            onPress={() => {
              setVaccinationData({ ...vaccinationData, disease: disease.name });
              setShowDiseasePicker(false);
            }}
          >
            <Text style={styles.modalItemText}>{disease.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );

  const renderDosePickerModal = () => (
    <Modal
      isVisible={showDosePicker}
      onBackdropPress={() => setShowDosePicker(false)}
      style={styles.modal}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Dose</Text>
        {doseTypes.map((dose) => (
          <TouchableOpacity
            key={dose}
            style={styles.modalItem}
            onPress={() => {
              setVaccinationData({ ...vaccinationData, doseType: dose });
              setShowDosePicker(false);
            }}
          >
            <Text style={styles.modalItemText}>{dose}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );

  const renderVaccinationSchedule = () => (
    <View style={styles.scheduleContainer}>
      <Text style={styles.scheduleTitle}>Vaccination Schedule</Text>
      {vaccineSchedule.map((vaccine, index) => (
        <View key={index} style={styles.scheduleItem}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleDisease}>{vaccine.disease}</Text>
            <Text style={styles.scheduleDose}>{vaccine.doseType}</Text>
            <Text style={styles.scheduleDate}>
              Expected: {new Date(vaccine.expectedDate).toLocaleDateString()}
            </Text>
            {vaccine.actualDate && (
              <Text style={styles.scheduleDate}>
                Given: {new Date(vaccine.actualDate).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={[
            styles.scheduleStatus,
            { backgroundColor: vaccine.status === 'COMPLETED' ? '#E8F5E9' : '#FFF3E0' }
          ]}>
            <Text style={[
              styles.scheduleStatusText,
              { color: vaccine.status === 'COMPLETED' ? '#2E7D32' : '#E65100' }
            ]}>
              {vaccine.status}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>VACCINATION</Text>
        </View>

        <View style={styles.card}>
          {children.length > 0 ? (
            <View style={styles.childSelector}>
              <Text style={styles.inputLabel}>Select Child (0-6 years)</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowChildPicker(true)}
              >
                <Text>
                  {selectedChild ? 
                    `${selectedChild.name} (${((new Date().getTime() - new Date(selectedChild.dateOfBirth).getTime()) / 
                    (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)} years)` : 
                    'Select a child'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="black" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noChildContainer}>
              <Text style={styles.noChildrenText}>No children eligible for vaccination</Text>
              <TouchableOpacity 
                style={styles.addChildButton}
                onPress={() => router.push('/manage-children')}
              >
                <Text style={styles.addChildButtonText}>Add Child</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>DATE</Text>
            <Text style={styles.dateValue}>March 15,2025</Text>
          </View>

          <View style={styles.formContainer}>
            {loading && (
              <ActivityIndicator size="large" color="#000" style={styles.loader} />
            )}
            {/* Disease Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Disease</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowDiseasePicker(true)}
              >
                <Text>{vaccinationData.disease || 'Select disease'}</Text>
                <Ionicons name="chevron-down" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Dose Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dose</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowDosePicker(true)}
              >
                <Text>{vaccinationData.doseType}</Text>
                <Ionicons name="chevron-down" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Expected Date Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Expected Date</Text>
              <TouchableOpacity 
                style={styles.dropdown}
              >
                <Text>{vaccinationData.date.toDateString()}</Text>
                <Ionicons name="chevron-down" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Upload Prescription */}
            <View style={styles.uploadContainer}>
              <Text style={styles.uploadText}>Upload Prescription</Text>
              <TouchableOpacity 
                style={styles.uploadBox}
                onPress={handleUploadPrescription}
              >
                {prescription ? (
                  <Image 
                    source={{ uri: prescription.uri }} 
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.illustrationContainer}>
                    <Image 
                      source={require('@/assets/images/upload-icon.png')}
                      style={styles.illustration}
                      resizeMode="contain"
                    />
                    <Text style={styles.uploadInstructions}>
                      Tap to upload prescription
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!selectedChild || !vaccinationData.disease || !vaccinationData.doseType) && 
                styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!selectedChild || !vaccinationData.disease || !vaccinationData.doseType || loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>

            {selectedChild && renderVaccinationSchedule()}
          </View>
        </View>
      </ScrollView>

      {renderChildPickerModal()}
      {renderDiseasePickerModal()}
      {renderDosePickerModal()}

      {showDatePicker && (
        <DateTimePicker
          value={vaccinationData.date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setVaccinationData({ ...vaccinationData, date: selectedDate });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    margin: 16,
    overflow: 'hidden',
  },
  dateContainer: {
    backgroundColor: '#000',
    padding: 12,
    alignItems: 'center',
  },
  dateLabel: {
    color: 'white',
    fontSize: 12,
  },
  dateValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  uploadContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  illustration: {
    width: 200,
    height: 120,
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  chartContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chartItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  childSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  noChildrenText: {
    padding: 16,
    textAlign: 'center',
    color: 'red',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#00BFA5',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  uploadInstructions: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  recordText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  noChildContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noChildText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  addChildButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addChildButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scheduleContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDisease: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scheduleDose: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scheduleDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  scheduleStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scheduleStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default VaccinationPage;