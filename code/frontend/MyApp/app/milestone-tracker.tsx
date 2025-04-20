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
  FlatList,
  Platform
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
  milestone: string;
  date: string;
  originalEntry: string;
};

type Child = {
  _id: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string | null;
  medicalConditions?: string[];
  allergies?: string[];
};

export default function MilestoneTracker() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await fetchChildren();
    setLoading(false);
  };

  const fetchChildren = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/users/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Children API response:", response.data);

      if (response.data.children && response.data.children.length > 0) {
        setChildren(response.data.children);
        const firstChildId = response.data.children[0]._id;
        setSelectedChildId(firstChildId);
        console.log("Selected first child:", response.data.children[0].name, firstChildId);
        fetchMilestonesForChild(firstChildId);
      } else {
        console.warn('Failed to load children data');
        const demoChildren = [
          { _id: '101', name: 'Emma' },
          { _id: '102', name: 'Noah' }
        ];
        setChildren(demoChildren);
        setSelectedChildId('101');
        useDemoData('101');
      }
    } catch (err) {
      console.error('Error fetching children:', err);
      const demoChildren = [
        { _id: '101', name: 'Emma' },
        { _id: '102', name: 'Noah' }
      ];
      setChildren(demoChildren);
      setSelectedChildId('101');
      useDemoData('101');
    }
  };

  const fetchMilestonesForChild = async (childId: string) => {
    if (!childId) return;
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/users/children/${childId}/milestones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Milestones for child ${childId}:`, response.data);

      if (response.data.success && response.data.data) {
        setMilestones(response.data.data);
        setError(null);
      } else {
        console.warn('No milestones found for this child', response.data);
        useDemoData(childId);
      }
    } catch (err) {
      console.error(`Error fetching milestones for child ${childId}:`, err);
      setError(`Could not load milestones for this child`);
      useDemoData(childId);
    } finally {
      setLoading(false);
    }
  };

  const useDemoData = (childId: string) => {
    const demoData = [
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
        childId: {
          _id: '102',
          name: 'Noah',
          age: 3,
          gender: 'male'
        },
        milestone: 'Started eating solid foods',
        date: new Date(2023, 9, 10).toISOString(),
        originalEntry: 'We started solid foods today. The reaction was priceless!'
      }
    ];
    
    const filteredData = demoData.filter(
      item => item.childId && item.childId._id === childId
    );
    
    setMilestones(filteredData.length > 0 ? filteredData : []);
  };

  const getChildName = (milestone: Milestone): string => {
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

  const handleChildChange = (itemValue: string) => {
    console.log("Selected child ID:", itemValue);
    setSelectedChildId(itemValue);
    fetchMilestonesForChild(itemValue);
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

  const renderChildSelector = () => {
    return (
      <View style={styles.childSelectorContainer}>
        <Text style={styles.selectorLabel}>Select Child:</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.childButtonsContainer}
        >
          {children.map((child) => (
            <TouchableOpacity
              key={child._id}
              style={[
                styles.childButton,
                selectedChildId === child._id && styles.selectedChildButton
              ]}
              onPress={() => handleChildChange(child._id)}
            >
              <Text 
                style={[
                  styles.childButtonText,
                  selectedChildId === child._id && styles.selectedChildButtonText
                ]}
              >
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

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

      {renderChildSelector()}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {milestones.length === 0 && !loading && !error ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="book-open-variant" size={80} color="#DDD" />
          <Text style={styles.emptyTitle}>No Milestones Found</Text>
          <Text style={styles.emptyText}>
            No milestones recorded for {children.find(c => c._id === selectedChildId)?.name || 'this child'} yet.
            Write about your child's special moments in the journal.
          </Text>
          <TouchableOpacity 
            style={styles.journalButton}
            onPress={() => router.push('/chat2')}
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
  childSelectorContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  childButtonsContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  childButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChildButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  childButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedChildButtonText: {
    color: 'white',
  },
});
