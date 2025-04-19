import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/config/environment';
import { format } from 'date-fns';

type Milestone = {
  _id: string;
  childId?: {
    _id: string;
    name: string;
    age: number;
    gender: string;
  };
  childName?: string;
  milestone: string;
  date: string;
  originalEntry: string;
};

export default function MilestoneTracker() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found, redirecting to login');
        router.replace('/login');
        return;
      }

      try {
        const response = await axios.get(`${BACKEND_URL}/api/users/milestones`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // console.log(response.dat)

        if (response.data.success && response.data.data.length > 0) {

          setMilestones(response.data.data);
        } else {
            console.log("using demo data")
        //   setError('Failed to load milestones');
          // Fallback to demo data
          useDemoData();
        }
      } catch (err) {
        console.error('Error fetching milestones:', err);
        setError('An error occurred while fetching milestones');
        // Fallback to demo data
        useDemoData();
      }
    } finally {
      setLoading(false);
    }
  };

  const useDemoData = () => {
    // Demo data for development purposes
    setMilestones([
      {
        _id: '1',
        childId: {
          _id: '101',
          name: 'Emma',
          age: 1,
          gender: 'female'
        },
        milestone: 'Said "mama" for the first time',
        date: new Date(2023, 10, 15).toISOString(),
        originalEntry: 'Emma said "mama" today for the first time! I was so excited!'
      },
      {
        _id: '2',
        childId: {
          _id: '101',
          name: 'Emma',
          age: 1,
          gender: 'female'
        },
        milestone: 'Took first steps',
        date: new Date(2023, 11, 20).toISOString(),
        originalEntry: 'Emma took her first steps today! She was wobbly but so determined.'
      },
      {
        _id: '3',
        childId: {
          _id: '102',
          name: 'Noah',
          age: 3,
          gender: 'male'
        },
        milestone: 'First day of preschool',
        date: new Date(2024, 1, 5).toISOString(),
        originalEntry: 'Dropped Noah off at preschool today. He was nervous but brave!'
      },
      {
        _id: '4',
        childName: 'Unknown',
        milestone: 'Started eating solid foods',
        date: new Date(2023, 9, 10).toISOString(),
        originalEntry: 'We started solid foods today. The reaction was priceless!'
      }
    ]);
  };

  const getChildName = (milestone: Milestone): string => {
    if (milestone.childId && milestone.childId.name) {
      return milestone.childId.name;
    }
    if (milestone.childName) {
      return milestone.childName;
    }
    return 'Unknown Child';
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const renderMilestoneItem = ({ item }: { item: Milestone }) => (
    <View style={styles.milestoneCard}>
      <View style={styles.milestoneHeader}>
        <MaterialCommunityIcons name="star-circle" size={24} color="#FF9500" />
        <Text style={styles.milestoneTitle}>{item.milestone}</Text>
      </View>
      
      <View style={styles.milestoneInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={18} color="#666" />
          <Text style={styles.infoText}>{getChildName(item)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={18} color="#666" />
          <Text style={styles.infoText}>{formatDate(item.date)}</Text>
        </View>
      </View>
      
      <View style={styles.entryContainer}>
        <Text style={styles.entryLabel}>Journal Entry:</Text>
        <Text style={styles.entryText}>{item.originalEntry}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading milestones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Milestone Tracker</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Captured Milestones</Text>
        <Text style={styles.bannerSubtitle}>
          Special moments automatically captured from your journal entries
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {milestones.length === 0 && !loading && !error ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="book-open-variant" size={80} color="#DDD" />
          <Text style={styles.emptyTitle}>No Milestones Yet</Text>
          <Text style={styles.emptyText}>
            Write about your child's special moments in the journal, and we'll automatically capture milestones.
          </Text>
          <TouchableOpacity 
            style={styles.journalButton}
            onPress={() => router.push('/journal')}
          >
            <Text style={styles.journalButtonText}>Go to Journal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={milestones}
          renderItem={renderMilestoneItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
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
  banner: {
    backgroundColor: '#4A90E2',
    padding: 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#E53935',
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  journalButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  journalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  milestoneCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  milestoneInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  entryContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  entryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  entryText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
