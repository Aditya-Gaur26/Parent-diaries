import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  medicalConditions: string[];
  allergies: string[];
}

export default function ManageChildrenScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    dateOfBirth: new Date(),
    gender: '',
    bloodGroup: '',
    medicalConditions: '',
    allergies: ''
  });

  useEffect(() => {
    fetchChildren();
  }, []);

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
      setChildren(response.data.children);
    } catch (error) {
      console.error('Error fetching children:', error);
      Alert.alert('Error', 'Failed to fetch children data');
    }
  };

  const handleAddChild = async () => {
    if (!newChild.name || !newChild.gender) {
      Alert.alert('Error', 'Name and gender are required');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.post(
        `${BACKEND_URL}/api/users/children`,
        {
          name: newChild.name,
          dateOfBirth: newChild.dateOfBirth.toISOString(),
          gender: newChild.gender,
          bloodGroup: newChild.bloodGroup || null,
          medicalConditions: newChild.medicalConditions.split(',').filter(Boolean),
          allergies: newChild.allergies.split(',').filter(Boolean)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setChildren([...children, response.data.child]);
      setIsAddModalVisible(false);
      Alert.alert('Success', 'Child added successfully');
    } catch (error) {
      console.error('Error adding child:', error);
      Alert.alert('Error', 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Children</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {children.map((child) => (
          <TouchableOpacity 
            key={child._id} 
            style={styles.childCard}
            onPress={() => router.push(`/child-details/${child._id}`)}
          >
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childDetails}>
                Born: {new Date(child.dateOfBirth).toLocaleDateString()}
              </Text>
              {child.bloodGroup && (
                <Text style={styles.childDetails}>Blood: {child.bloodGroup}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        ))}

        {children.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No children added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add your first child
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Child</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Child's Name"
              placeholderTextColor="#666"
              value={newChild.name}
              onChangeText={(text) => setNewChild({...newChild, name: text})}
            />

            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateInputText}>
                Date of Birth: {newChild.dateOfBirth.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Gender (Male/Female/Other)"
              placeholderTextColor="#666"
              value={newChild.gender}
              onChangeText={(text) => setNewChild({...newChild, gender: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Blood Group (Optional)"
              placeholderTextColor="#666"
              value={newChild.bloodGroup}
              onChangeText={(text) => setNewChild({...newChild, bloodGroup: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Medical Conditions (comma-separated)"
              placeholderTextColor="#666"
              value={newChild.medicalConditions}
              onChangeText={(text) => setNewChild({...newChild, medicalConditions: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Allergies (comma-separated)"
              placeholderTextColor="#666"
              value={newChild.allergies}
              onChangeText={(text) => setNewChild({...newChild, allergies: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleAddChild}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding...' : 'Add Child'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={newChild.dateOfBirth}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setNewChild({...newChild, dateOfBirth: selectedDate});
            }
          }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  childDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    flex: 1,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
