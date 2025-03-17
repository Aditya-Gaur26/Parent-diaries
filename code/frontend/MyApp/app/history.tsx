import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';

interface ChatSession {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  timestamp: Date;
}

const HistoryScreen = () => {
  const router = useRouter();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/speech2speech/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        // Process sessions directly without fetching individual histories
        const processedSessions = response.data.map(session => {
          // Use session title with fallback
          const title = session.title || 'Chat session';
          
          // Create a timestamp from lastActive or createdAt
          const sessionDate = new Date(session.lastActive || session.createdAt);
          
          // Format date for display
          const formattedDate = sessionDate.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            id: session._id,
            title: title,
            subtitle: `Last active: ${formattedDate}`,
            date: formattedDate,
            timestamp: sessionDate
          };
        });
        
        // Sort by timestamp (newest first)
        processedSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setChatHistory(processedSessions);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      Alert.alert('Error', 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToChat = (sessionId: string) => {
    if (isSelectionMode) {
      toggleSessionSelection(sessionId);
    } else {
      router.push({
        pathname: '/chat2',
        params: { sessionId }
      });
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedSessions([]);
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const deleteSelectedSessions = async () => {
    if (selectedSessions.length === 0) return;
    
    try {
      setIsDeleting(true);
      const token = await AsyncStorage.getItem('authToken');
      
      // Delete each selected session
      await Promise.all(
        selectedSessions.map(sessionId =>
          axios.delete(`${BACKEND_URL}/speech2speech/sessions/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      
      // Refresh the list after deletion
      setSelectedSessions([]);
      setIsSelectionMode(false);
      fetchChatHistory();
      
    } catch (error) {
      console.error('Error deleting sessions:', error);
      Alert.alert('Error', 'Failed to delete selected conversations');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (selectedSessions.length === 0) return;
    
    Alert.alert(
      'Delete Conversations',
      `Are you sure you want to delete ${selectedSessions.length} conversation(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteSelectedSessions }
      ]
    );
  };

  const renderItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity 
      style={[
        styles.historyItem,
        selectedSessions.includes(item.id) && styles.selectedItem
      ]}
      onPress={() => navigateToChat(item.id)}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          setSelectedSessions([item.id]);
        }
      }}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        <Text style={styles.itemDate}>{item.date}</Text>
      </View>
      {isSelectionMode ? (
        <View style={styles.checkboxContainer}>
          {selectedSessions.includes(item.id) ? (
            <Ionicons name="checkbox" size={24} color="#4A90E2" />
          ) : (
            <Ionicons name="square-outline" size={24} color="#999" />
          )}
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={24} color="#999" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedSessions([]);
          } else {
            router.back();
          }
        }}>
          <Ionicons 
            name={isSelectionMode ? "close" : "arrow-back"} 
            size={24} 
            color="#000" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSelectionMode 
            ? `Selected: ${selectedSessions.length}` 
            : 'History'}
        </Text>
        <View style={styles.headerRight}>
          {!isSelectionMode ? (
            <>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={toggleSelectionMode}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color="#000" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={confirmDelete}
              disabled={selectedSessions.length === 0 || isDeleting}
            >
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color={selectedSessions.length === 0 ? "#999" : "#FF3B30"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading chat history...</Text>
        </View>
      ) : chatHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No chat history yet</Text>
          <Text style={styles.emptySubtext}>Your conversations will appear here</Text>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => router.push('/chat2')}
          >
            <Text style={styles.newChatButtonText}>Start a New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chatHistory}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {isDeleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    flex: 1,
    marginLeft: 16,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
  },
  newChatButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxContainer: {
    marginLeft: 10,
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
  },
});

export default HistoryScreen;
