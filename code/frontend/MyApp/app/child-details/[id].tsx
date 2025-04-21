import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, TextInput, ActivityIndicator, Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../../config/environment';
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

export default function ChildDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const childId = Array.isArray(id) ? id[0] : id;

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [editedChild, setEditedChild] = useState({
    name: '',
    dateOfBirth: new Date(),
    gender: '',
    bloodGroup: '',
    medicalConditions: '',
    allergies: ''
  });

  useEffect(() => {
    fetchChildDetails();
  }, [childId]);

  const fetchChildDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/users/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const foundChild = response.data.children.find((c: Child) => c._id === childId);
      if (foundChild) {
        setChild(foundChild);
        setEditedChild({
          name: foundChild.name,
          dateOfBirth: new Date(foundChild.dateOfBirth),
          gender: foundChild.gender,
          bloodGroup: foundChild.bloodGroup || '',
          medicalConditions: foundChild.medicalConditions.join(', '),
          allergies: foundChild.allergies.join(', ')
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to fetch child details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedChild.name || !editedChild.gender) {
      Alert.alert('Error', 'Name and gender are required');
      return;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.put(
        `${BACKEND_URL}/api/users/children/${childId}`,
        {
          name: editedChild.name,
          dateOfBirth: editedChild.dateOfBirth.toISOString(),
          gender: editedChild.gender,
          bloodGroup: editedChild.bloodGroup || null,
          medicalConditions: editedChild.medicalConditions.split(',').map(s => s.trim()).filter(Boolean),
          allergies: editedChild.allergies.split(',').map(s => s.trim()).filter(Boolean)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsEditing(false);
      fetchChildDetails();
      Alert.alert('Success', 'Child details updated successfully');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update child details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.delete(`${BACKEND_URL}/api/users/children/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Alert.alert('Success', 'Child removed successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to delete child');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Child Details</Text>
        <TouchableOpacity 
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedChild.name}
                onChangeText={text => setEditedChild({...editedChild, name: text})}
                placeholder="Child's name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{editedChild.dateOfBirth.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                value={editedChild.gender}
                onChangeText={text => setEditedChild({...editedChild, gender: text})}
                placeholder="Male/Female/Other"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <TextInput
                style={styles.input}
                value={editedChild.bloodGroup}
                onChangeText={text => setEditedChild({...editedChild, bloodGroup: text})}
                placeholder="Blood group (optional)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical Conditions</Text>
              <TextInput
                style={styles.input}
                value={editedChild.medicalConditions}
                onChangeText={text => setEditedChild({...editedChild, medicalConditions: text})}
                placeholder="Separate with commas"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Allergies</Text>
              <TextInput
                style={styles.input}
                value={editedChild.allergies}
                onChangeText={text => setEditedChild({...editedChild, allergies: text})}
                placeholder="Separate with commas"
                multiline
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Text style={styles.buttonText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Text style={styles.buttonText}>Delete Child</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{child?.name}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>
                {new Date(child?.dateOfBirth || '').toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{child?.gender}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Blood Group</Text>
              <Text style={styles.detailValue}>{child?.bloodGroup || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Medical Conditions</Text>
              <Text style={styles.detailValue}>
                {child?.medicalConditions?.length ? 
                  child.medicalConditions.join(', ') : 'None'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Allergies</Text>
              <Text style={styles.detailValue}>
                {child?.allergies?.length ? child.allergies.join(', ') : 'None'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={editedChild.dateOfBirth}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setEditedChild({...editedChild, dateOfBirth: selectedDate});
            }
          }}
        />
      )}

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this child? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonGroup: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    flex: 1,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  cancelButtonText: {
    color: '#333',
  },
  confirmButtonText: {
    color: 'white',
  },
});
