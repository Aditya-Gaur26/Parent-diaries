import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Modal,
  FlatList,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/config/environment';
import axios from 'axios';

type AgeGroup = '0-3 months' | '4-6 months' | '7-9 months' | '10-12 months' | '1-2 years' | '2-3 years' | '3-4 years' | '4-5 years';
type Child = {
  _id: string;
  name: string;
  dateOfBirth: string;
};

export default function GrowthMilestonesTracking() {
  const router = useRouter();
  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup>('0-3 months');
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const ageGroups: AgeGroup[] = [
    '0-3 months',
    '4-6 months',
    '7-9 months',
    '10-12 months',
    '1-2 years',
    '2-3 years',
    '3-4 years',
    '4-5 years'
  ];

  const milestoneData: Record<AgeGroup, Record<string, string[]>> = {
    '0-3 months': {
      Social: ['Begins to smile at people'],
      Language: ['Coos, makes gurgling sounds'],
      Cognitive: ['Pays attention to faces'],
      Motor: ['Can hold head up and begins to push up when lying on tummy']
    },
    '4-6 months': {
      Social: ['Smiles spontaneously, especially at people'],
      Language: ['Babbles with expression'],
      Cognitive: ['Reaches for toy with one hand'],
      Motor: ['Pushes down on legs when feet are on a hard surface']
    },
    '7-9 months': {
      Social: ['May be afraid of strangers'],
      Language: ['Understands "no"'],
      Cognitive: ['Watches the path of something as it falls'],
      Motor: ['Stands, holding on']
    },
    '10-12 months': {
      Social: ['Cries when mom or dad leaves'],
      Language: ['Says "mama" and "dada" and exclamations like "uh-oh!"'],
      Cognitive: ['Explores things in different ways, like shaking, banging, throwing'],
      Motor: ['Pulls up to stand, walks holding on to furniture']
    },
    '1-2 years': {
      Social: ['Shows you affection (hugs, cuddles, etc.)', 'Shows more and more independence'],
      Language: ['Tries to say words you say', 'Uses 2 to 4 word sentences'],
      Cognitive: ['Shows interest in a toy or object', 'Begins to sort shapes and colors'],
      Motor: ['Walks without help', 'Kicks a ball']
    },
    '2-3 years': {
      Social: ['Takes turns in games'],
      Language: ['Follows instructions with 2 or 3 steps'],
      Cognitive: ['Can work toys with buttons, levers, and moving parts'],
      Motor: ['Climbs well']
    },
    '3-4 years': {
      Social: ['Prefers to play with other children than by themselves', 'Cooperates with other children'],
      Language: ['Can say first and last name', 'Tells stories'],
      Cognitive: ['Names some colors and some numbers', 'Can draw a person with 2 to 4 body parts'],
      Motor: ['Hops and stands on one foot up to 2 seconds', 'Catches a bounced ball most of the time']
    },
    '4-5 years': {
      Social: ['Wants to please friends', 'Likes to sing, dance, and act'],
      Language: ['Speaks very clearly', 'Uses future tense'],
      Cognitive: ['Can count 10 or more things', 'Can print some letters or numbers'],
      Motor: ['Stands on one foot for 10 seconds or longer', 'Hops; may be able to skip']
    }
  };

  const useDemoData = (childId: string) => {
    const demoMilestones: Record<string, boolean> = {
      '0-3 months-Social-Begins to smile at people': true,
      '0-3 months-Language-Coos, makes gurgling sounds': true,
      '4-6 months-Motor-Pushes down on legs when feet are on a hard surface': false,
    };
    setCompletedMilestones(demoMilestones);
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
        setSelectedChild(response.data.children[0]);
        console.log("Selected first child:", response.data.children[0].name, firstChildId);
        fetchMilestonesForChild(firstChildId);
      } else {
        console.warn('Failed to load children data');
        const demoChildren = [
          { _id: '101', name: 'Emma', dateOfBirth: '2020-01-01' },
          { _id: '102', name: 'Noah', dateOfBirth: '2021-06-15' }
        ];
        setChildren(demoChildren);
        setSelectedChildId('101');
        setSelectedChild(demoChildren[0]);
        useDemoData('101');
      }
    } catch (err) {
      console.error('Error fetching children:', err);
      const demoChildren = [
        { _id: '101', name: 'Emma', dateOfBirth: '2020-01-01' },
        { _id: '102', name: 'Noah', dateOfBirth: '2021-06-15' }
      ];
      setChildren(demoChildren);
      setSelectedChildId('101');
      setSelectedChild(demoChildren[0]);
      useDemoData('101');
    }
  };

  const fetchMilestonesForChild = async (childId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${BACKEND_URL}/api/growth/child/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Milestones API response:", response.data);
      if (response.data.data) {
        const savedMilestones: Record<string, boolean> = {};
        
        // Initialize all milestones as false first
        ageGroups.forEach(ageGroup => {
          Object.entries(milestoneData[ageGroup]).forEach(([category, milestones]) => {
            milestones.forEach(milestone => {
              const key = `${ageGroup}-${category}-${milestone}`;
              savedMilestones[key] = false;
            });
          });
        });

        // Update with completed milestones from the response
        response.data.data.forEach((entry: any) => {
          entry.entries.forEach((milestone: any) => {
            // Find the corresponding age group based on ageInMonths
            const ageGroup = ageGroups.find(group => {
              const ageMap: Record<string, number> = {
                '0-3 months': 3,
                '4-6 months': 6,
                '7-9 months': 9,
                '10-12 months': 12,
                '1-2 years': 24,
                '2-3 years': 36,
                '3-4 years': 48,
                '4-5 years': 60
              };
              return ageMap[group] >= entry.ageInMonths;
            }) || '0-3 months';

            const key = `${ageGroup}-${milestone.type}-${milestone.detail}`;
            savedMilestones[key] = milestone.completed;
          });
        });

        console.log("Processed milestones:", savedMilestones);
        setCompletedMilestones(savedMilestones);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      useDemoData(childId);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchMilestonesForChild(selectedChildId);
    }
  }, [selectedChildId]);

  const toggleMilestone = async (milestone: string, category: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        router.replace('/login');
        return;
      }

      if (!selectedChild) {
        Alert.alert('Error', 'Please select a child first');
        return;
      }

      const ageMap: Record<string, number> = {
        '0-3 months': 2,
        '4-6 months': 4,
        '7-9 months': 9,
        '10-12 months': 12,
        '1-2 years': 24,
        '2-3 years': 36,
        '3-4 years': 48,
        '4-5 years': 60
      };

      const milestoneKey = `${activeAgeGroup}-${category}-${milestone}`;
      const newState = !completedMilestones[milestoneKey];

      const response = await axios.post(
        `${BACKEND_URL}/api/growth`,
        {
          childId: selectedChild._id,
          ageInMonths: ageMap[activeAgeGroup],
          entries: [{
            type: category,
            detail: milestone,
            completed: newState,
            dateCompleted: newState ? new Date().toISOString() : null
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        setCompletedMilestones(prev => ({
          ...prev,
          [milestoneKey]: newState
        }));
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      if (axios.isAxiosError(error)) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update milestone');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    }
  };

  const ChildPickerModal = () => (
    <Modal
      visible={showChildPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowChildPicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Child</Text>
          <FlatList
            data={children}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.childItem,
                  selectedChild?._id === item._id && styles.selectedChildItem
                ]}
                onPress={() => {
                  setSelectedChild(item);
                  setSelectedChildId(item._id); // This triggers the useEffect
                  setShowChildPicker(false);
                  setCompletedMilestones({}); // Clear previous milestones
                }}
              >
                <Text style={styles.childName}>{item.name}</Text>
                {selectedChild?._id === item._id && (
                  <Ionicons name="checkmark" size={20} color="#4A90E2" />
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowChildPicker(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Growth Milestones</Text>
      </View>

      <TouchableOpacity 
        style={styles.childSelector}
        onPress={() => setShowChildPicker(true)}
      >
        <Text style={styles.childSelectorText}>
          {selectedChild ? selectedChild.name : 'Select Child'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#333" />
      </TouchableOpacity>

      <ChildPickerModal />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ageGroupScroll}>
        {ageGroups.map((ageGroup) => (
          <TouchableOpacity
            key={ageGroup}
            style={[
              styles.ageGroupButton,
              activeAgeGroup === ageGroup && styles.activeAgeGroupButton
            ]}
            onPress={() => setActiveAgeGroup(ageGroup)}
          >
            <Text style={[
              styles.ageGroupButtonText,
              activeAgeGroup === ageGroup && styles.activeAgeGroupButtonText
            ]}>
              {ageGroup}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.mainScroll}>
        {Object.keys(milestoneData[activeAgeGroup]).map(category => (
          <View key={category} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              <MaterialCommunityIcons 
                name={
                  category === 'physical' ? 'human-handsup' : 
                  category === 'cognitive' ? 'brain' :
                  category === 'social' ? 'account-group' : 'message-text'
                } 
                size={24} 
                color="#4A90E2" 
              />
              <Text style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)} Development
              </Text>
            </View>
            
            {milestoneData[activeAgeGroup][category].map((milestone, index) => {
              const milestoneKey = `${activeAgeGroup}-${category}-${milestone}`;
              const isCompleted = completedMilestones[milestoneKey];
              
              return (
                <TouchableOpacity 
                  key={index}
                  style={[styles.milestoneItem, isCompleted && styles.completedMilestone]}
                  onPress={() => toggleMilestone(milestone, category)}
                >
                  <Text style={[styles.milestoneText, isCompleted && styles.completedMilestoneText]}>
                    {milestone}
                  </Text>
                  <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
                    {isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              );
            })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
  },
  mainScroll: {
    flex: 1,
  },
  ageGroupScroll: {
    flexGrow: 0,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  ageGroupButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeAgeGroupButton: {
    backgroundColor: '#4A90E2',
  },
  ageGroupButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  activeAgeGroupButtonText: {
    color: 'white',
  },
  categoryContainer: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  completedMilestone: {
    backgroundColor: '#F0FFF4',
  },
  milestoneText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  completedMilestoneText: {
    color: '#4CAF50',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  childSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  childSelectorText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  childItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  childName: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedChildItem: {
    backgroundColor: '#f0f7ff',
  },
});
