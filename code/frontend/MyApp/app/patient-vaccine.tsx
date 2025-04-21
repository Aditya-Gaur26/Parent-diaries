import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import { Ionicons } from '@expo/vector-icons';

type Vaccination = {
  disease: string;
  doseType: string;
  expectedDate: string;
  actualDate: string | null;
  isOptional: boolean;
  status: string;
};

type VaccinationResponse = {
  completeSchedule: Vaccination[];
  actualRecords: Vaccination[];
};

export default function VaccinationChartScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVaccinationData();
  }, [childId]);

  const fetchVaccinationData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log(`${BACKEND_URL}/vaccination/doctor/child/${childId}`);
      const response = await axios.get<VaccinationResponse>(`${BACKEND_URL}/vaccination/doctor/child/${childId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVaccinations(response.data.completeSchedule);
    } catch (error) {
      console.error('Error fetching vaccination data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string, isOptional: boolean) => {
    if (isOptional) return '#8B8000'; // olive for optional
    switch (status) {
      case 'COMPLETED': return '#4CAF50';
      case 'PENDING': return '#FFA500';
      case 'OVERDUE': return '#FF0000';
      default: return '#666';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccination Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {vaccinations.map((vaccination, index) => (
          <View 
            key={index} 
            style={[
              styles.vaccinationCard,
              { borderLeftWidth: 4, borderLeftColor: getStatusColor(vaccination.status, vaccination.isOptional) }
            ]}
          >
            <View style={styles.vaccineHeader}>
              <Text style={styles.vaccineName}>{vaccination.disease}</Text>
              {vaccination.isOptional && (
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              )}
            </View>
            <Text style={styles.vaccineInfo}>Dose: {vaccination.doseType}</Text>
            <Text style={styles.vaccineInfo}>Expected Date: {new Date(vaccination.expectedDate).toLocaleDateString()}</Text>
            {vaccination.actualDate && (
              <Text style={styles.vaccineInfo}>
                Administered: {new Date(vaccination.actualDate).toLocaleDateString()}
              </Text>
            )}
            <Text style={[styles.vaccineStatus, { color: getStatusColor(vaccination.status, vaccination.isOptional) }]}>
              Status: {vaccination.status}
            </Text>
          </View>
        ))}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  vaccinationCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  vaccineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionalBadge: {
    backgroundColor: '#8B8000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionalText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  vaccineStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  vaccineName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  vaccineInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
});
