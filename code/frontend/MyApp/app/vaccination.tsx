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
import { useAuth } from '../context/AuthContext'; // Add this import

const VaccinationPage = () => {
  const { user } = useAuth(); // Add this line
  const [disease, setDisease] = useState('');
  const [dose, setDose] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [vaccinationChart, setVaccinationChart] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    if (user?.children?.length > 0) {
      setSelectedChild(user.children[0]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild?._id) {
      fetchVaccinationChart();
    }
  }, [selectedChild]);

  const fetchVaccinationChart = async () => {
    try {
      setLoading(true);
      if (!selectedChild) {
        throw new Error('Selected child is null');
      }
      const response = await fetch(`http://localhost:4444/vaccination/child/${selectedChild._id}`);
      const data = await response.json();
      setVaccinationChart(data.completeSchedule);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch vaccination chart');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!disease || !dose) {
      Alert.alert('Error', 'Please select disease and dose');
      return;
    }

    try {
      setLoading(true);
      const childId = selectedChild._id; // This should come from your app's state/navigation
      const response = await fetch('http://localhost:4444/vaccination/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId,
          disease,
          doseType: dose,
          actualDate: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setVaccinationChart(data.completeSchedule);
        Alert.alert('Success', 'Vaccination record updated');
      } else {
        Alert.alert('Error', data.msg || 'Failed to update vaccination');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit vaccination record');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>VACCINATION</Text>
        </View>

        <View style={styles.card}>
          {user?.children?.length > 0 ? (
            <View style={styles.childSelector}>
              <Text style={styles.inputLabel}>Select Child</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => {
                  // Implement child selection modal/picker here
                }}
              >
                <Text>{selectedChild?.name || 'Select a child'}</Text>
                <Ionicons name="chevron-down" size={20} color="black" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noChildrenText}>Please add a child first</Text>
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
              <TouchableOpacity style={styles.dropdown}>
                <Text>{disease}</Text>
                <Ionicons name="chevron-up" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Dose Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dose</Text>
              <TouchableOpacity style={styles.dropdown}>
                <Text>{dose}</Text>
                <Ionicons name="chevron-down" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Expected Date Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Expected Date</Text>
              <TouchableOpacity style={styles.dropdown}>
                <Text>{expectedDate}</Text>
                <Ionicons name="chevron-down" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Upload Prescription */}
            <View style={styles.uploadContainer}>
              <Text style={styles.uploadText}>Upload Prescription</Text>
              <View style={styles.illustrationContainer}>
                <Image 
                  source={{ uri: 'https://i.imgur.com/KRWCMfP.png' }} 
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            {vaccinationChart && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Vaccination Schedule</Text>
                {vaccinationChart.map((item, index) => (
                  <View key={index} style={styles.chartItem}>
                    <Text>{item.disease} - {item.doseType}</Text>
                    <Text>Expected: {new Date(item.expectedDate).toLocaleDateString()}</Text>
                    <Text>Status: {item.status}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
});

export default VaccinationPage;