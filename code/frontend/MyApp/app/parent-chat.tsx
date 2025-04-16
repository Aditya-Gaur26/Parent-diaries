import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import socketService from '@/utils/socketService';

export default function ParentChatScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchParents();
    // Get and store current user ID when component mounts
    AsyncStorage.getItem('userData')
      .then(userDataStr => {
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            if (userData && userData._id) {
              setCurrentUserId(userData._id);
              console.log('Retrieved user ID from userData:', userData._id);
            } else {
              console.log('No _id in userData:', userData);
            }
          } catch (err) {
            console.error('Error parsing userData:', err);
          }
        } else {
          console.log('No userData found in AsyncStorage');
        }
      })
      .catch(err => console.error('Error getting userData:', err));
  }, []);

  useEffect(() => {
    filterParents();
  }, [searchText, parents]);

  const fetchParents = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      // Use our API endpoint
      const response = await axios.get(`${BACKEND_URL}/api/users/parents-for-chat`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.parents && Array.isArray(response.data.parents)) {
        setParents(response.data.parents);
        setFilteredParents(response.data.parents);
      } else {
        // No parents found - set empty arrays
        setParents([]);
        setFilteredParents([]);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
      setParents([]);
      setFilteredParents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterParents = () => {
    if (!searchText.trim()) {
      setFilteredParents(parents);
      return;
    }

    const query = searchText.toLowerCase();
    const filtered = parents.filter(parent => 
      parent.name.toLowerCase().includes(query)
    );
    setFilteredParents(filtered);
  };

  const startChat = async (parentId, parentName) => {
    try {
      console.log('Starting chat with parent:', parentId, parentName);
      const token = await AsyncStorage.getItem('authToken');
      
      // Get the current user ID from userData in AsyncStorage
      let userId = currentUserId;
      if (!userId) {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            if (userData && userData._id) {
              userId = userData._id;
              setCurrentUserId(userId);
            }
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }
      }
      
      // Only redirect to login if no token or user ID
      if (!token || !userId) {
        router.replace('/login');
        return;
      }
      
      // Prevent chat with self
      if (userId === parentId) {
        Alert.alert('Error', 'Cannot start chat with yourself.');
        return;
      }
      
      // Pre-connect socket for better performance
      await socketService.connect();
      
      // Create or find chat between users
      console.log(`Finding/creating chat between ${userId} and ${parentId}`);
      const chatResponse = await axios.post(`${BACKEND_URL}/api/chat/create`, {
        userId: userId,
        receiverId: parentId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (chatResponse.data && chatResponse.data._id) {
        const chatId = chatResponse.data._id;
        console.log('Got chat ID:', chatId);
        
        // Join socket room before navigation for seamless transition
        socketService.joinChat(chatId);
        
        // Navigate to chat room with all necessary parameters
        router.push({
          pathname: '/chat-room',
          params: { 
            chatId: chatId, 
            userId: parentId, // The other participant's ID
            userName: parentName,
            currentUserId: userId // Explicitly pass current user's ID
          }
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Unable to start chat. Please try again.');
    }
  };

  const fetchChatMessages = async (chatId, pageNum) => {
    try {
      // ...existing code...
      
      if (response.data) {
        const { messages: newMessages, hasMore } = response.data;
        
        // Format messages for display with better sender attribution
        const formattedMessages = newMessages.map(msg => ({
          _id: msg._id,
          text: msg.content,
          createdAt: msg.createdAt,
          sender: msg.sender._id === currentUserId ? 'me' : msg.sender._id,
          senderName: msg.sender.name,
          senderImage: msg.sender.profilePicture,
          receiver: msg.sender._id === currentUserId ? userId : currentUserId,
          read: msg.read
        }));
        
        // ...existing code...
      }
    } catch (error) {
      // ...existing code...
    }
  };

  const renderParentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.parentItem}
      onPress={() => startChat(item._id, item.name)}
    >
      <Image
        source={item.avatar ? { uri: item.avatar } : require('@/assets/images/profile-pic.jpg')}
        style={styles.avatar}
      />
      
      <View style={styles.parentInfo}>
        <Text style={styles.parentName}>{item.name}</Text>
        <Text style={styles.childrenInfo}>
          {item.children && item.children.length > 0
            ? `Parent of ${item.children.map(child => child.name).join(', ')}`
            : 'Parent'
          }
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  // Update the EmptyComponent to show a clear message for no parents
  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={48} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchText 
          ? 'No parents match your search' 
          : 'No parents available to chat at the moment'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with Parents</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parents..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading parents...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredParents}
          renderItem={renderParentItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={EmptyComponent}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  childrenInfo: {
    fontSize: 14,
    color: '#777',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
