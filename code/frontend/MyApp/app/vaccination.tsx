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

// Correct enum declaration based on backend model
enum DoseType {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
  BOOSTER = 'BOOSTER',
  ANNUAL = 'ANNUAL'
}

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

const getDaysUntil = (date: string): number => {
  const today = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const ScheduleTab = ({ vaccineSchedule, selectedChild }: { 
  vaccineSchedule: VaccinationSchedule[], 
  selectedChild: Child | null
}) => {
  if (!selectedChild || vaccineSchedule.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No vaccination records found</Text>
      </View>
    );
  }

  const today = new Date();
  const upcomingVaccinations = vaccineSchedule.filter(v => 
    v.status === 'PENDING' && new Date(v.expectedDate) > today
  );
  const pastVaccinations = vaccineSchedule.filter(v => 
    v.status === 'COMPLETED' || new Date(v.expectedDate) <= today
  );

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Vaccinations</Text>
      </View>
      {upcomingVaccinations.map((vaccine, index) => (
        <View key={index} style={styles.vaccineCard}>
          <View style={styles.vaccineHeader}>
            <Text style={styles.vaccineName}>{vaccine.disease}</Text>
            <Text style={styles.dueDate}>
              Due: {new Date(vaccine.expectedDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.vaccineDetails}>
            <Text style={styles.doseType}>{vaccine.doseType}</Text>
            <Text style={styles.timeLeft}>
              {getDaysUntil(vaccine.expectedDate)} days remaining
            </Text>
          </View>
          <View style={[styles.statusIndicator, styles.statusPending]}>
            <Text style={styles.statusText}>PENDING</Text>
          </View>
        </View>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vaccination History</Text>
      </View>
      {pastVaccinations.map((vaccine, index) => (
        <View key={index} style={[styles.vaccineCard, vaccine.status === 'COMPLETED' && styles.completedCard]}>
          <View style={styles.vaccineHeader}>
            <Text style={styles.vaccineName}>{vaccine.disease}</Text>
            <Text style={styles.completionDate}>
              {vaccine.actualDate ? 
                `Given: ${new Date(vaccine.actualDate).toLocaleDateString()}` :
                `Expected: ${new Date(vaccine.expectedDate).toLocaleDateString()}`
              }
            </Text>
          </View>
          <View style={styles.vaccineDetails}>
            <Text style={styles.doseType}>{vaccine.doseType}</Text>
          </View>
          <View style={[styles.statusIndicator, 
            vaccine.status === 'COMPLETED' ? styles.statusCompleted : styles.statusOverdue]}>
            <Text style={styles.statusText}>{vaccine.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const LogVaccinationTab = ({
  selectedChild,
  handleLogVaccination,
  loading,
  vaccinationData,
  setVaccinationData,
  showDiseasePicker,
  showDosePicker,
  showDatePicker,
  setShowDiseasePicker,
  setShowDosePicker,
  setShowDatePicker
}: {
  selectedChild: Child | null;
  handleLogVaccination: () => Promise<void>;
  loading: boolean;
  vaccinationData: any;
  setVaccinationData: (data: any) => void;
  showDiseasePicker: boolean;
  showDosePicker: boolean;
  showDatePicker: boolean;
  setShowDiseasePicker: (show: boolean) => void;
  setShowDosePicker: (show: boolean) => void;
  setShowDatePicker: (show: boolean) => void;
}) => {
  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.formContainer}>
        {/* Disease Selection */}
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Vaccine Type</Text>
          <TouchableOpacity 
            style={styles.fieldInput}
            onPress={() => setShowDiseasePicker(true)}
          >
            <Text>{vaccinationData.disease || 'Select vaccine'}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Dose Selection */}
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Dose</Text>
          <TouchableOpacity 
            style={styles.fieldInput}
            onPress={() => setShowDosePicker(true)}
          >
            <Text>{vaccinationData.doseType || 'Select dose'}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Date Given</Text>
          <TouchableOpacity 
            style={styles.fieldInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{vaccinationData.date?.toLocaleDateString() || 'Select date'}</Text>
            <Ionicons name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (!selectedChild || !vaccinationData.disease || !vaccinationData.doseType) && 
            styles.submitButtonDisabled
          ]}
          onPress={handleLogVaccination}
          disabled={!selectedChild || !vaccinationData.disease || !vaccinationData.doseType || loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Log Vaccination'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const UploadPrescriptionTab = ({ selectedChild }) => {
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [prescriptionImage, setPrescriptionImage] = useState(null);

  const handlePrescriptionUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (!result.didCancel && result.assets && result.assets[0]) {
        setPrescriptionImage(result.assets[0]);
        processPrescription(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processPrescription = async (image) => {
    if (!selectedChild) {
      Alert.alert('Error', 'Please select a child first');
      return;
    }

    try {
      setScanning(true);
      const formData = new FormData();
      formData.append('prescription', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'prescription.jpg'
      });
      formData.append('childId', selectedChild._id);

      // In a real app, this would be the actual OCR endpoint
      const response = await axios.post(
        `${BACKEND_URL}/vaccination/scan-prescription`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setExtractedData(response.data);
    } catch (error) {
      console.error('Error processing prescription:', error);
      Alert.alert('Error', 'Failed to process prescription');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.uploadTitle}>Upload Vaccination Prescription</Text>
      <Text style={styles.uploadDescription}>
        Take a photo of your child's vaccination prescription to automatically extract details.
      </Text>
      
      <TouchableOpacity 
        style={styles.prescriptionUploadBox}
        onPress={handlePrescriptionUpload}
      >
        {prescriptionImage ? (
          <Image 
            source={{ uri: prescriptionImage.uri }} 
            style={styles.prescriptionImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="camera" size={40} color="#666" />
            <Text style={styles.uploadPlaceholderText}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {scanning && (
        <View style={styles.scanningOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.scanningText}>Processing prescription...</Text>
        </View>
      )}
      
      {extractedData && (
        <View style={styles.extractedDataContainer}>
          <Text style={styles.extractedDataTitle}>Extracted Information</Text>
          <View style={styles.extractedDataContent}>
            {Object.entries(extractedData).map(([key, value], index) => (
              <Text key={index} style={styles.extractedDataItem}>
                {key}: {value}
              </Text>
            ))}
            <TouchableOpacity style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Confirm and Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const MainContent = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('schedule');
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
          `${BACKEND_URL}/vaccination/metadata`, // Fix URL path to match backend
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
        `${BACKEND_URL}/vaccination/child/${selectedChild?._id}`, // Fix URL path to match backend
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
        `${BACKEND_URL}/vaccinations`, 
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
        `${BACKEND_URL}/vaccination/manage`,
        {
          childId: selectedChild._id,
          disease: vaccinationData.disease,
          doseType: vaccinationData.doseType, // Send the dose type directly without enum conversion
          actualDate: vaccinationData.date.toISOString()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccination Tracker</Text>
      </View>

      <View style={styles.childSelector}>
        <Text style={styles.selectorLabel}>Select Child (0-6 years)</Text>
        <TouchableOpacity 
          style={styles.selectorButton}
          onPress={() => setShowChildPicker(true)}
        >
          {selectedChild ? (
            <Text style={styles.selectedChildText}>
              {selectedChild.name} ({((new Date().getTime() - new Date(selectedChild.dateOfBirth).getTime()) / 
              (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)} years)
            </Text>
          ) : (
            <Text style={styles.placeholderText}>Select a child</Text>
          )}
          <Ionicons name="chevron-down" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabButtons}>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'schedule' && styles.activeTabButton]}
            onPress={() => setSelectedTab('schedule')}
          >
            <Text style={[styles.tabText, selectedTab === 'schedule' && styles.activeTabText]}>
              Schedule
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'log' && styles.activeTabButton]}
            onPress={() => setSelectedTab('log')}
          >
            <Text style={[styles.tabText, selectedTab === 'log' && styles.activeTabText]}>
              Log Vaccine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'upload' && styles.activeTabButton]}
            onPress={() => setSelectedTab('upload')}
          >
            <Text style={[styles.tabText, selectedTab === 'upload' && styles.activeTabText]}>
              Upload
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContentContainer}>
          {selectedTab === 'schedule' && (
            <ScheduleTab 
              vaccineSchedule={vaccineSchedule}
              selectedChild={selectedChild}
            />
          )}
          {selectedTab === 'log' && (
            <LogVaccinationTab
              selectedChild={selectedChild}
              handleLogVaccination={handleLogVaccination}
              loading={loading}
              vaccinationData={vaccinationData}
              setVaccinationData={setVaccinationData}
              showDiseasePicker={showDiseasePicker}
              showDosePicker={showDosePicker}
              showDatePicker={showDatePicker}
              setShowDiseasePicker={setShowDiseasePicker}
              setShowDosePicker={setShowDosePicker}
              setShowDatePicker={setShowDatePicker}
            />
          )}
          {selectedTab === 'upload' && (
            <UploadPrescriptionTab selectedChild={selectedChild} />
          )}
        </View>
      </View>

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
  vaccineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedCard: {
    opacity: 0.8,
  },
  vaccineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusOverdue: {
    backgroundColor: '#FFEBEE',
  },
  tabContainer: {
    flex: 1,
  },
  tabButtons: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  prescriptionUpload: {
    marginVertical: 20,
  },
  prescriptionPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: 32,
  },
  tabContentContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  selectedChildText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  prescriptionUploadBox: {
    borderWidth: 2,
    borderColor: '#00BFA5',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    overflow: 'hidden',
  },
  prescriptionImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholderText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  scanningOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  scanningText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  extractedDataContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  extractedDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  extractedDataContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  extractedDataItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MainContent;