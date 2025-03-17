import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define type for age groups
type AgeGroup = '0-3 months' | '4-6 months' | '7-9 months' | '10-12 months' | '1-2 years' | '2-3 years' | '3-4 years' | '4-5 years';

export default function GrowthTracker() {
  const router = useRouter();
  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup>('0-3 months');
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});
  
  // Age group categories
  const ageGroups = [
    '0-3 months',
    '4-6 months',
    '7-9 months',
    '10-12 months',
    '1-2 years',
    '2-3 years',
    '3-4 years',
    '4-5 years'
  ];

  // Developmental milestones by age group and category
  const milestoneData = {
    '0-3 months': {
      physical: [
        'Raises head and chest when on stomach',
        'Stretches and kicks on back',
        'Opens and closes hands',
        'Brings hand to mouth'
      ],
      cognitive: [
        'Watches faces intently',
        'Follows moving objects',
        'Recognizes familiar objects and people',
        'Starts using hands and eyes in coordination'
      ],
      social: [
        'Begins to smile at people',
        'Can briefly calm themselves',
        'Tries to look at parent'
      ],
      language: [
        'Coos and makes gurgling sounds',
        'Turns head toward sounds',
        'Begins to babble'
      ]
    },
    '4-6 months': {
      physical: [
        'Rolls over both ways',
        'Begins to sit without support',
        'Supports weight on legs',
        'Reaches with one hand'
      ],
      cognitive: [
        'Shows curiosity about things',
        'Passes things from one hand to the other',
        'Begins to recognize own name',
        'Shows interest in mirror images'
      ],
      social: [
        'Laughs and squeals',
        'Enjoys playing with others',
        "Responds to others' emotions",
        'Shows happiness and sadness'
      ],
      language: [
        'Responds to sounds with sounds',
        'Makes speech-like babbling sounds',
        'Makes sounds to show joy and displeasure'
      ]
    },
    '7-9 months': {
      physical: [
        'Stands while holding on',
        'Sits well without support',
        'Crawls forward on belly',
        'Picks up small objects with thumb and fingers'
      ],
      cognitive: [
        'Explores objects in different ways',
        'Finds hidden objects easily',
        'Looks at correct picture when image is named',
        'Begins to use objects correctly'
      ],
      social: [
        'May be afraid of strangers',
        'May be clingy with familiar adults',
        'Has favorite toys',
        'Plays games like peek-a-boo'
      ],
      language: [
        'Responds to own name',
        'Understands "no"',
        'Makes many different sounds',
        'Uses gestures like waving bye-bye'
      ]
    },
    '10-12 months': {
      physical: [
        'Gets to sitting position without help',
        'Pulls up to stand, walks holding on',
        'May stand alone or take first steps',
        'Places objects into container and removes them'
      ],
      cognitive: [
        'Puts objects in and out of containers',
        'Follows simple directions',
        'Explores things in different ways',
        'Uses fingers to point at things'
      ],
      social: [
        'Is shy or anxious with strangers',
        'Cries when parent leaves',
        'Shows certain preferences for people',
        'Repeats sounds or actions for attention'
      ],
      language: [
        'Uses simple gestures like shaking head for "no"',
        'Says "mama" and "dada"',
        'Tries to imitate words',
        'Responds to simple spoken requests'
      ]
    },
    '1-2 years': {
      physical: [
        'Walks alone',
        'Pulls toys while walking',
        'Begins to run',
        'Drinks from a cup'
      ],
      cognitive: [
        'Finds hidden objects',
        'Sorts shapes and colors',
        'Completes sentences in familiar books',
        'Plays simple make-believe games'
      ],
      social: [
        'Copies others',
        'Shows increasing independence',
        'Shows defiance',
        'Plays mainly beside other children'
      ],
      language: [
        'Says several single words',
        'Says and shakes head "no"',
        'Points to show others something',
        'Follows simple instructions'
      ]
    },
    '2-3 years': {
      physical: [
        'Climbs well',
        'Runs easily',
        'Pedals tricycle',
        'Walks up and down stairs'
      ],
      cognitive: [
        'Can work toys with buttons, levers',
        'Plays make-believe with dolls, animals',
        'Completes puzzles with 3-4 pieces',
        'Understands "two"'
      ],
      social: [
        'Copies adults and friends',
        'Shows affection for friends without prompting',
        'Takes turns in games',
        'Shows concern for crying friend'
      ],
      language: [
        'Follows 2-3 step instructions',
        'Names items in a book',
        'Speaks in sentences of 2-4 words',
        'Understands most sentences'
      ]
    },
    '3-4 years': {
      physical: [
        'Hops and stands on one foot',
        'Catches a bounced ball',
        'Uses scissors',
        'Can draw a person with 2-4 body parts'
      ],
      cognitive: [
        'Names colors and numbers',
        'Understands counting',
        'Approaches problems from a single perspective',
        'Begins to have a clearer sense of time'
      ],
      social: [
        'Would rather play with other children',
        'Cooperates with other children',
        "Often can't tell fantasy from reality",
        'Shows greater independence'
      ],
      language: [
        'Speaks in sentences of 5-6 words',
        'Tells stories',
        'Knows first name, age, and gender',
        'Names some colors and numbers'
      ]
    },
    '4-5 years': {
      physical: [
        'Stands on one foot for 10 seconds or longer',
        'Hops, may be able to skip',
        'Can do a somersault',
        'Uses fork, spoon, and (sometimes) table knife'
      ],
      cognitive: [
        'Can count 10 or more objects',
        'Knows about everyday items like food and money',
        'Draws person with body',
        'Prints some letters or numbers'
      ],
      social: [
        'Wants to please and be like friends',
        'More likely to agree to rules',
        'Likes to sing, dance, and act',
        'Shows more independence and self-control'
      ],
      language: [
        'Speaks very clearly',
        'Tells simple stories using full sentences',
        'Uses future tense',
        'Says name and address'
      ]
    }
  };

  // Load saved milestones from storage when component mounts
  useEffect(() => {
    loadCompletedMilestones();
  }, []);

  // Save milestone completion status
  const loadCompletedMilestones = async () => {
    try {
      const savedMilestones = await AsyncStorage.getItem('completedMilestones');
      if (savedMilestones) {
        setCompletedMilestones(JSON.parse(savedMilestones));
      }
    } catch (error) {
      console.error('Error loading completed milestones:', error);
    }
  };

  // Toggle milestone completion status
  const toggleMilestone = async (milestone: string, category: string) => {
    const milestoneKey = `${activeAgeGroup}-${category}-${milestone}`;
    const updatedMilestones = {
      ...completedMilestones,
      [milestoneKey]: !completedMilestones[milestoneKey]
    };
    
    setCompletedMilestones(updatedMilestones);
    
    try {
      await AsyncStorage.setItem('completedMilestones', JSON.stringify(updatedMilestones));
    } catch (error) {
      console.error('Error saving milestone status:', error);
    }
  };

  // Calculate progress percentage for current age group
  const calculateProgress = (ageGroup: AgeGroup): number => {
    const milestones = milestoneData[ageGroup];
    let totalMilestones = 0;
    let completedCount = 0;
    
    Object.keys(milestones).forEach(category => {
      milestones[category].forEach(milestone => {
        totalMilestones++;
        const milestoneKey = `${ageGroup}-${category}-${milestone}`;
        if (completedMilestones[milestoneKey]) {
          completedCount++;
        }
      });
    });
    
    return totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Growth Tracker</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.banner}>
        <Image 
          source={require('@/assets/images/parent_child_image.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Child Development Milestones</Text>
          <Text style={styles.bannerSubtitle}>Track your child's growth journey</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>{activeAgeGroup} Progress</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, {width: `${calculateProgress(activeAgeGroup)}%`}]} />
        </View>
        <Text style={styles.progressText}>{calculateProgress(activeAgeGroup)}% Complete</Text>
      </View>
      
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
            <Text 
              style={[
                styles.ageGroupButtonText,
                activeAgeGroup === ageGroup && styles.activeAgeGroupButtonText
              ]}
            >
              {ageGroup}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView style={styles.milestoneContainer}>
        <TouchableOpacity 
          style={styles.vaccinationButton}
          onPress={() => router.push('/vaccination')}
        >
          <View style={styles.vaccinationContent}>
            <MaterialCommunityIcons name="needle" size={24} color="#4A90E2" />
            <Text style={styles.vaccinationText}>Track Vaccinations</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>

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
        
        <View style={styles.tipContainer}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={24} color="#F5A623" />
            <Text style={styles.tipTitle}>Development Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Every child develops at their own pace. These milestones are general guidelines.
            If you have concerns about your child's development, consult with your pediatrician.
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Source: CDC Developmental Milestones
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
  infoButton: {
    padding: 8,
  },
  banner: {
    position: 'relative',
    height: 150,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: 'white',
    fontSize: 14,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  ageGroupScroll: {
    flexGrow: 0,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  milestoneContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  categoryContainer: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
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
  tipContainer: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5A623',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
  vaccinationButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  vaccinationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaccinationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
});
