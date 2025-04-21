import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import { Ionicons } from '@expo/vector-icons';

export default function MedicalReportScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [growthData, setGrowthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const fetchGrowthData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
        console.log(`${BACKEND_URL}/api/growth/child/${childId}/medical-report`);
      const response = await axios.get(`${BACKEND_URL}/api/growth/child/${childId}/medical-report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setGrowthData(response.data.data);
    } catch (error) {
      console.error('Error fetching growth data:', error);
      Alert.alert('Error', 'Failed to fetch growth data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDetails = (entry) => {
    if (Array.isArray(entry.details) && entry.details.length > 0) {
      // Handle entries with details array
      return entry.details.map((detail, index) => (
        <Text 
          key={index} 
          style={[
            styles.achievementText,
            { color: detail.completed ? '#27ae60' : '#666' }
          ]}
        >
          • {detail.detail}
          {detail.completed && detail.dateCompleted && 
            ` (Completed: ${new Date(detail.dateCompleted).toLocaleDateString()})`
          }
        </Text>
      ));
    } else {
      // Handle entries with direct detail property
      return (
        <Text 
          style={[
            styles.achievementText,
            { color: entry.completed ? '#27ae60' : '#666' }
          ]}
        >
          • {entry.detail}
          {entry.completed && entry.dateCompleted && 
            ` (Completed: ${new Date(entry.dateCompleted).toLocaleDateString()})`
          }
        </Text>
      );
    }
  };

  const getProgressStats = (entry) => {
    if (Array.isArray(entry.details) && entry.details.length > 0) {
      const completed = entry.details.filter(d => d.completed).length;
      const total = entry.details.length;
      return { completed, total };
    } else {
      return { completed: entry.completed ? 1 : 0, total: 1 };
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
        <Text style={styles.headerTitle}>Development Report</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {(!growthData || growthData.length === 0) ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No milestone data available yet.</Text>
            <Text style={styles.noDataSubText}>Complete an assessment to see the report.</Text>
          </View>
        ) : (
          <View style={styles.reportContainer}>
            {growthData && growthData.length > 0 && (
              <View style={styles.reportContainer}>
                {growthData
                  .sort((a, b) => a.ageInMonths - b.ageInMonths)
                  .map((assessment) => (
                    <View key={assessment._id} style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        {assessment.ageInMonths} Month Assessment
                      </Text>
                      <Text style={styles.dateText}>
                        Date: {new Date(assessment.createdAt).toLocaleDateString()}
                      </Text>

                      {assessment.entries.map((entry) => {
                        const { completed, total } = getProgressStats(entry);
                        return (
                          <View key={entry.type} style={styles.categoryContainer}>
                            <Text style={styles.categoryTitle}>{entry.type}</Text>
                            <Text style={styles.progressText}>
                              Completed: {completed}/{total}
                              ({Math.round((completed / total) * 100)}%)
                            </Text>
                            
                            <View style={styles.achievementsContainer}>
                              {renderDetails(entry)}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ))}
              </View>
            )}
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
  reportContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  dateText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  categoryContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#2980b9',
    marginBottom: 8,
  },
  achievementsContainer: {
    marginTop: 8,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 5,
  },
  achievementText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 10,
    marginBottom: 3,
  },
  noMilestonesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
