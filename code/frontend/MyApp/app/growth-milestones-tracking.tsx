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

type AgeGroup = '2 months' | '4 months' | '6 months' | '9 months' | '12 months' | '15 months' | '18 months' | '24 months' | '30 months' | '36 months' | '48 months' | '60 months';
type Child = {
  _id: string;
  name: string;
  dateOfBirth: string;
};

export default function GrowthMilestonesTracking() {
  const router = useRouter();
  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup>('2 months');
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
// Define the age groups as displayed to users
const ageGroups = [
  '2 months',
  '4 months',
  '6 months',
  '9 months',
  '12 months',
  '15 months',
  '18 months',
  '24 months',
  '30 months',
  '36 months',
  '48 months',
  '60 months'
];

// Mapping between display age groups and the actual month numbers in VALID_DETAILS_MAP
const ageGroupToMonthsMap: Record<string, number[]> = {
  '2 months': [2],
  '4 months': [4],
  '6 months': [6],
  '9 months': [9],
  '12 months': [12],
  '15 months': [15],
  '18 months': [18],
  '24 months': [24],
  '30 months': [30],
  '36 months': [36],
  '48 months': [48],
  '60 months': [60]
};

/**
 * Mapping of ageInMonths => { type => [valid details] }
 */
const VALID_DETAILS_MAP = {
  2: {
    Social: [
      'Calms down when spoken to or picked up',
      'Looks at your face',
      'Seems happy to see you when you walk up to her',
      'Smiles when you talk to or smile at her'
    ],
    Language: [
      'Makes sounds other than crying',
      'Reacts to loud sounds'
    ],
    Cognitive: [
      'Watches you as you move',
      'Looks at a toy for several seconds'
    ],
    Motor: [
      'Holds head up when on tummy',
      'Moves both arms and both legs',
      'Opens hands briefly'
    ]
  },

  4: {
    Social: [
      'Smiles on their own to get your attention',
      'Chuckles (not yet a full laugh) when you try to make them laugh',
      'Looks at you, moves, or makes sounds to get or keep your attention'
    ],
    Language: [
      'Makes cooing sounds like “ooo” and “aah”',
      'Makes sounds back when you talk to them',
      'Turns head toward the sound of your voice'
    ],
    Cognitive: [
      'If hungry, opens mouth when sees breast or bottle',
      'Looks at their hands with interest'
    ],
    Motor: [
      'Holds head steady without support when you are holding them',
      'Holds a toy when you put it in their hand',
      'Uses arms to swing at toys',
      'Brings hands to mouth',
      'Pushes up onto elbows/forearms when on tummy'
    ]
  },

  6: {
    Social: [
      'Knows familiar people',
      'Likes to look at self in a mirror',
      'Laughs'
    ],
    Language: [
      'Takes turns making sounds with you',
      'Blows “raspberries” (sticks tongue out and blows)',
      'Makes squealing noises'
    ],
    Cognitive: [
      'Puts things in mouth to explore them',
      'Reaches to grab a toy they want',
      'Closes lips to show they don’t want more food'
    ],
    Motor: [
      'Rolls from tummy to back',
      'Pushes up with straight arms when on tummy',
      'Leans on hands to support self when sitting'
    ]
  },

  9: {
    Social: [
      'Is shy, clingy, or fearful around strangers',
      'Shows several facial expressions, like happy, sad, angry, and surprised',
      'Looks when you call their name',
      'Reacts when you leave (looks, reaches for you, or cries)',
      'Smiles or laughs when you play peek-a-boo'
    ],
    Language: [
      'Makes a lot of different sounds like “mamamama” and “bababababa”',
      'Lifts arms up to be picked up'
    ],
    Cognitive: [
      'Looks for objects when dropped out of sight (like a spoon or toy)',
      'Bangs two things together'
    ],
    Motor: [
      'Gets to a sitting position by self',
      'Moves things from one hand to the other',
      'Uses fingers to “rake” food toward self',
      'Sits without support'
    ]
  },

  12: {
    Social: [
      'Plays games with you, like pat-a-cake'
    ],
    Language: [
      'Waves “bye-bye”',
      'Calls a parent “mama” or “dada” or another special name',
      'Understands “no” (pauses briefly or stops when you say it)'
    ],
    Cognitive: [
      'Puts something in a container, like a block in a cup',
      'Looks for things they see you hide, like a toy under a blanket'
    ],
    Motor: [
      'Pulls up to stand',
      'Walks, holding on to furniture',
      'Drinks from a cup without a lid, as you hold it',
      'Picks things up between thumb and pointer finger, like small bits of food'
    ]
  },

  15: {
    Social: [
      'Copies other children while playing, like taking toys out of a container when another child does',
      'Shows you an object they like',
      'Claps when excited',
      'Hugs stuffed doll or other toy',
      'Shows you affection (hugs, cuddles, or kisses you)'
    ],
    Language: [
      'Tries to say one or two words besides “mama” or “dada,” like “ba” for ball or “da” for dog',
      'Looks at a familiar object when you name it',
      'Follows directions given with both a gesture and words, like handing you a toy when you say, “Give me the toy” and hold out your hand',
      'Points to ask for something or to get help'
    ],
    Cognitive: [
      'Tries to use things the right way, like a phone, cup, or book',
      'Stacks at least two small objects, like blocks'
    ],
    Motor: [
      'Takes a few steps on their own',
      'Uses fingers to feed self some food'
    ]
  },

  18: {
    Social: [
      'Moves away from you, but looks to make sure you are close by',
      'Points to show you something interesting',
      'Puts hands out for you to wash them',
      'Looks at a few pages in a book with you',
      'Helps you dress them by pushing arm through sleeve or lifting up foot'
    ],
    Language: [
      'Tries to say three or more words besides “mama” or “dada”',
      'Follows one-step directions without any gestures, like giving you the toy when you say, “Give it to me.”'
    ],
    Cognitive: [
      'Copies you doing chores, like sweeping with a broom',
      'Plays with toys in a simple way, like pushing a toy car'
    ],
    Motor: [
      'Walks without holding on to anyone or anything',
      'Scribbles',
      'Drinks from a cup without a lid and may spill sometimes',
      'Feeds self with fingers',
      'Tries to use a spoon',
      'Climbs on and off a couch or chair without help'
    ]
  },

  24: {
    Social: [
      'Notices when others are hurt or upset, like pausing or looking sad when someone is crying',
      'Looks at your face to see how to react in a new situation'
    ],
    Language: [
      'Points to things in a book when you ask, like “Where is the bear?”',
      'Says at least two words together, like “More milk.”',
      'Points to at least two body parts when you ask',
      'Uses more gestures than just waving and pointing, like blowing a kiss or nodding yes'
    ],
    Cognitive: [
      'Holds something in one hand while using the other hand; for example, holding a container and taking the lid off',
      'Tries to use switches, knobs, or buttons on a toy',
      'Plays with more than one toy at the same time, like putting toy food on a toy plate'
    ],
    Motor: [
      'Kicks a ball',
      'Runs',
      'Walks (not climbs) up a few stairs with or without help',
      'Eats with a spoon'
    ]
  },

  30: {
    Social: [
      'Plays next to other children and sometimes plays with them',
      'Shows you what they can do by saying, “Look at me!”',
      'Follows simple routines when told, like helping to pick up toys when you say, “It’s clean-up time.”'
    ],
    Language: [
      'Says about 50 words',
      'Says two or more words together, with one action word, like “Doggie run”',
      'Names things in a book when you point and ask, “What is this?”',
      'Says words like “I,” “me,” or “we”'
    ],
    Cognitive: [
      'Uses things to pretend, like feeding a block to a doll as if it were food',
      'Shows simple problem-solving skills, like standing on a small stool to reach something',
      'Follows two-step instructions like “Put the toy down and close the door.”',
      'Shows they know at least one color, like pointing to a red crayon when you ask, “Which one is red?”'
    ],
    Motor: [
      'Uses hands to twist things, like turning doorknobs or unscrewing lids',
      'Takes some clothes off by themselves, like loose pants or an open jacket',
      'Jumps off the ground with both feet',
      'Turns book pages, one at a time, when you read to them'
    ]
  },

  36: {
    Social: [
      'Calms down within 10 minutes after you leave her, like at a childcare drop off',
      'Notices other children and joins them to play'
    ],
    Language: [
      'Talks with you in conversation using at least two back-and-forth exchanges',
      'Asks “who,” “what,” “where,” or “why” questions, like “Where is mommy/daddy?”',
      'Says what action is happening in a picture or book when asked, like “running,” “eating,” or “playing”',
      'Says first name when asked',
      'Talks well enough for others to understand, most of the time'
    ],
    Cognitive: [
      'Draws a circle when you show him how',
      'Avoids touching hot objects, like a stove, when you warn her'
    ],
    Motor: [
      'Strings items together, like large beads or macaroni',
      'Puts on some clothes by himself, like loose pants or a jacket',
      'Uses a fork'
    ]
  },

  48: {
    Social: [
      'Pretends to be something else during play (teacher, superhero, dog)',
      'Asks to go play with children if none are around, like “Can I play with Alex?”',
      'Comforts others who are hurt or sad, like hugging a crying friend',
      'Avoids danger, like not jumping from tall heights at the playground',
      'Likes to be a “helper”',
      'Changes behavior based on where she is (place of worship, library, playground)'
    ],
    Language: [
      'Says sentences with four or more words',
      'Says some words from a song, story, or nursery rhyme',
      'Talks about at least one thing that happened during her day, like “I played soccer.”',
      'Answers simple questions like “What is a coat for?” or “What is a crayon for?”'
    ],
    Cognitive: [
      'Names a few colors of items',
      'Tells what comes next in a well-known story',
      'Draws a person with three or more body parts'
    ],
    Motor: [
      'Catches a large ball most of the time',
      'Serves herself food or pours water, with adult supervision',
      'Unbuttons some buttons',
      'Holds crayon or pencil between fingers and thumb (not a fist)'
    ]
  },
  
  60: {
    Social: [
      'Follows rules or takes turns when playing games with other children',
      'Sings, dances, or acts for you',
      'Does simple chores at home, like matching socks or clearing the table after eating'
    ],
    Language: [
      'Tells a story she heard or made up with at least two events. For example, a cat was stuck in a tree and a firefighter saved it',
      'Answers simple questions about a book or story after you read or tell it to him',
      'Keeps a conversation going with more than three back-and-forth exchanges',
      'Uses or recognizes simple rhymes (bat-cat, ball-tall)'
    ],
    Cognitive: [
      'Counts to 10',
      'Names some numbers between 1 and 5 when you point to them',
      'Uses words about time, like “yesterday,” “tomorrow,” “morning,” or “night”',
      'Pays attention for 5 to 10 minutes during activities. For example, during story time or making arts and crafts (screen time does not count)',
      'Writes some letters in her name',
      'Names some letters when you point to them'
    ],
    Motor: [
      'Buttons some buttons',
      'Hops on one foot'
    ]
  }

};

// Function to get milestones for a display age group from VALID_DETAILS_MAP
function getMilestonesForAgeGroup(ageGroup: string): Record<string, string[]> {
  const monthKeys = ageGroupToMonthsMap[ageGroup];
  
  if (!monthKeys) {
    return { Social: [], Language: [], Cognitive: [], Motor: [] };
  }
  
  // Use the first month in the range as the representative for this age group
  // You could also combine milestones from multiple months if preferred
  const primaryMonth = monthKeys[0];
  return VALID_DETAILS_MAP[primaryMonth];
}

// Create a milestoneData object that matches your original structure 
// but pulls data from VALID_DETAILS_MAP
const milestoneData: Record<string, Record<string, string[]>> = {};

ageGroups.forEach(ageGroup => {
  milestoneData[ageGroup] = getMilestonesForAgeGroup(ageGroup);
});

// You can now use milestoneData just like before but it's backed by VALID_DETAILS_MAP

// Example usage:
// const socialMilestonesFor02Years = milestoneData['1-2 years'].Social;

// If you need to access additional months within an age range:
function getAllMilestonesForAgeGroup(ageGroup: string): Record<string, string[]> {
  const monthKeys = ageGroupToMonthsMap[ageGroup];
  
  if (!monthKeys || monthKeys.length === 0) {
    return { Social: [], Language: [], Cognitive: [], Motor: [] };
  }
  
  // Initialize result with empty arrays
  const result: Record<string, string[]> = {
    Social: [],
    Language: [],
    Cognitive: [],
    Motor: []
  };
  
  // Combine milestones from all relevant months
  monthKeys.forEach(month => {
    const monthData = VALID_DETAILS_MAP[month];
    if (monthData) {
      Object.keys(result).forEach(category => {
        result[category] = [...result[category], ...monthData[category]];
      });
    }
  });
  
  return result;
}

// Usage example for combined milestones:
// const allMilestonesFor12Years = getAllMilestonesForAgeGroup('1-2 years');
  // If you prefer using numbers as keys instead of strings with "months" suffix:
  const numericMilestoneData: Record<number, Record<string, string[]>> = {
    2: milestoneData['2 months'],
    4: milestoneData['4 months'],
    6: milestoneData['6 months'],
    9: milestoneData['9 months'],
    12: milestoneData['12 months'],
    15: milestoneData['15 months'],
    18: milestoneData['18 months'],
    24: milestoneData['24 months'],
    30: milestoneData['30 months'],
    36: milestoneData['36 months'],
    48: milestoneData['48 months'],
    60: milestoneData['60 months']
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
                '2 months': 2,
                '4 months': 4,
                '6 months': 6,
                '9 months': 9,
                '12 months': 12,
                '15 months': 15,
                '18 months': 18,
                '24 months': 24,
                '30 months': 30,
                '36 months': 36,
                '48 months': 48,
                '60 months': 60
              };
              return ageMap[group] >= entry.ageInMonths;
            }) || '2 months';

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
        '2 months': 2,
        '4 months': 4,
        '6 months': 6,
        '9 months': 9,
        '12 months': 12,
        '15 months': 15,
        '18 months': 18,
        '24 months': 24,
        '30 months': 30,
        '36 months': 36,
        '48 months': 48,
        '60 months': 60
      };

      const milestoneKey = `${activeAgeGroup}-${category}-${milestone}`;
      const newState = !completedMilestones[milestoneKey];

      console.log('Attempting to update milestone:', {
        childId: selectedChild._id,
        ageGroup: activeAgeGroup,
        ageInMonths: ageMap[activeAgeGroup],
        category,
        milestone,
        newState
      });

      const response = await axios.post(
        `${BACKEND_URL}/api/growth`,
        {
          childId: selectedChild._id,
          ageInMonths: ageMap[activeAgeGroup],
          entries: [{
            type: category,
            details: [{
              detail: milestone,
              completed: newState,
              dateCompleted: newState ? new Date().toISOString() : undefined
            }]
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
