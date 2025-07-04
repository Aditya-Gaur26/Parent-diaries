import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, BackHandler, ActivityIndicator, LogBox } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';

// Suppress warnings during development
LogBox.ignoreAllLogs();

export default function HomeScreen() {
  const router = useRouter();
  interface ChatHistoryItem {
    id: string;
    title: string; // Changed from 'question' to 'title' for semantic clarity
    subtitle: string;
    timestamp: Date;
  }

  const [user, setUser] = useState({ name: 'User', email: '', avatar: null });
  const [isLoading, setIsLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
  // Add back button handler to prevent going back to auth screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // On home screen, prevent going back to auth screens
      // Instead, prompt user to confirm exit app if they press back
      Alert.alert(
        'Exit App', 
        'Do you want to exit Parent Diaries?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Exit', onPress: () => BackHandler.exitApp() }
        ],
        { cancelable: true }
      );
      return true; // Prevent default back behavior
    });
    
    return () => backHandler.remove();
  }, []);

  // Fetch user profile only once when component mounts
  useEffect(() => {
    // First check if this is the correct screen for the user's role
    const checkRoleMatch = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        
        // If this is an admin or doctor who somehow got to the user home screen,
        // redirect them to their correct home screen
        if (role === 'admin') {
          // console.log('Admin detected on user screen, redirecting');
          router.replace('/adminHomeScreen');
          return;
        } else if (role === 'doctor') {
          // console.log('Doctor detected on user screen, redirecting');
          router.replace('/doctorHomeScreen');
          return;
        }
        
        // If user role or no role, proceed with loading profile
        fetchUserProfile();
      } catch (error) {
        console.error('Error checking role match:', error);
        fetchUserProfile();
      }
    };
    
    checkRoleMatch();
  }, []);

  // Use useFocusEffect to refresh chat sessions whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      // console.log('HomeScreen focused, refreshing chat sessions...');
      fetchChatSessions();
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        // console.log('No auth token found, redirecting to login');
        router.replace('/login');
        return;
      }

      // Make request to get user profile using axios
      const response = await axios.get(`${BACKEND_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // console.log('User profile fetched:', response.data);
      
      // Update state with user data
      setUser(response.data);
      
      // Store user data in AsyncStorage for use across the app
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      await AsyncStorage.removeItem('authToken')
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        
        if (statusCode === 401) {
          // Unauthorized - token expired or invalid
          await AsyncStorage.removeItem('authToken');
          Alert.alert(
            'Session Expired', 
            'Your session has expired. Please login again.',
            [{ text: 'OK', onPress: () => router.replace('/welcome') }]
          );
        } else {
          // Other API errors
          Alert.alert(
            'Error', 
            'Failed to load user profile. Please try again later.',
            [{ text: 'OK', onPress: () => router.replace('/login') }]
          );
        }
      } else {
        // Non-axios errors (network issues, etc)
        Alert.alert(
          'Connection Error', 
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatSessions = async () => {
    try {
      setIsHistoryLoading(true);
      // console.log('Fetching chat sessions...');
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        // console.log('No auth token found');
        setIsHistoryLoading(false);
        return;
      }

      // Log token length to help with debugging (don't log the full token for security)
      // console.log(`Auth token is ${token.length} characters long`);
      
      // Updated endpoint to use /llm/sessions directly instead of going through redirection
      // console.log(`Making request to: ${BACKEND_URL}/llm/sessions`);
      const response = await axios.get(`${BACKEND_URL}/llm/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // console.log('Response received:', response.data);

      if (response.data && Array.isArray(response.data)) {
        // Get the 4 most recent chat sessions
        const recentSessions = response.data.slice(0, 4);
        // console.log('Recent sessions:', recentSessions);
        
        if (recentSessions.length > 0) {
          // Process sessions directly without fetching individual histories
          const processedSessions = recentSessions.map(session => {
            // Format the title with fallback
            const title = session.title || 'Chat session';
            
            // Create a timestamp from lastActive or createdAt
            const timestamp = new Date(session.lastActive || session.createdAt);
            
            // Format date for display
            const formattedDate = timestamp.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return {
              id: session._id,
              title: title, // Store as title instead of question
              subtitle: formattedDate,
              timestamp: timestamp
            };
          });
          
          // Sort by timestamp (newest first)
          processedSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          // console.log('Processed sessions:', processedSessions);
          
          setChatHistory(processedSessions);
        } else {
          // console.log('No recent sessions found');
          setChatHistory([]);
        }
      } else {
        // console.log('Invalid response format:', response.data);
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      
      // Enhanced error logging for 401 errors
      if (axios.isAxiosError(error) && error.response) {
        console.error(`Status code: ${error.response.status}`);
        console.error('Response headers:', error.response.headers);
        if (error.response.status === 401) {
          console.error('Authentication error - token may be invalid or expired');
          
          // Clear token if it's invalid and redirect to login
          if (error.response.data?.message === 'jwt expired' || 
              error.response.data?.message === 'invalid token') {
            await AsyncStorage.removeItem('authToken');
            Alert.alert('Session Expired', 'Please login again', [
              { text: 'OK', onPress: () => router.replace('/login') }
            ]);
            return;
          }
        }
      }
      
      Alert.alert('Error', 'Failed to load chat history');
      setChatHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };
  
  // Navigate to chat with specific session ID
  const navigateToChat = (sessionId) => {
    router.push({
      pathname: '/chat2',
      params: { sessionId }
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => router.push('/edit-profile')}>
              <Image
                source={user.avatar ? { uri: user.avatar } : require('@/assets/images/profile-pic.jpg')}
                style={styles.profilePic}
              />
            </TouchableOpacity>
            <Text style={styles.greeting}>Hi, {user.name || 'User'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Help message */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>How may I help you today?</Text>
          <Text style={styles.companyText}>Empathetic Companion</Text>
        </View>

        {/* Main options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => router.push('/chat2')}>
            <View style={styles.optionContent}>
              <Image
                source={require('@/assets/images/chat-icon.png')}
                style={styles.optionImage}
              />
              <Text style={styles.optionText}>Chat with Companion</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => router.push('/connect')}>
            <View style={styles.optionContent}>
              <Image
               source={require('@/assets/images/connect-icon.png')}
          
                style={styles.optionImage}
              />
              <Text style={styles.optionText}>Connect</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => router.push('/growth-tracker')}>
            <View style={styles.optionContent}>
              <Image
                source={require('@/assets/images/parent_child_image.jpg')}
                style={styles.optionImage}
              />
              <Text style={styles.optionText}>Growth Tracker</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => router.push('/manage-children')}>
            <View style={styles.optionContent}>
              <Image
                source={require('@/assets/images/family-icon.png')}
                style={styles.optionImage}
              />
              <Text style={styles.optionText}>Manage Children</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* History section */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>History</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Recent questions - now using actual chat history */}
          <View style={styles.recentQuestionsContainer}>
            {isHistoryLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            ) : chatHistory.length === 0 ? (
              <Text style={styles.noHistoryText}>No chat history yet</Text>
            ) : (
              chatHistory.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.questionItem}
                  onPress={() => navigateToChat(item.id)}
                >
                  <View style={styles.questionIconContainer}>
                    <MaterialIcons name="history" size={20} color="#555" />
                  </View>
                  <View style={styles.questionTextContainer}>
                    <Text style={styles.questionText} numberOfLines={1}>
                      {item.title} {/* Changed from item.question to item.title */}
                    </Text>
                    <Text style={styles.questionSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#888" />
                </TouchableOpacity>
              ))
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
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 5,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpText: {
    fontSize: 16,
    color: '#333',
  },
  companyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historySection: {
    marginBottom: 30,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  recentQuestionsContainer: {
    marginTop: 5,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questionIconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  questionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontStyle: 'italic',
  },
});
