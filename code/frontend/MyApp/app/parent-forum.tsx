import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config/environment';
import { SafeAreaView } from 'react-native-safe-area-context';

const ForumScreen = () => {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const fetchPosts = async (tag = '') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${BACKEND_URL}/api/forum/posts${tag ? `?tag=${tag}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts(selectedTag);
  }, [selectedTag]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPosts(selectedTag);
  }, [selectedTag]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parent Forum</Text>
          <TouchableOpacity 
            onPress={() => router.push('/new-post')}
            style={styles.createButton}
          >
            <Ionicons name="add-circle" size={24} color="#0066cc" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search discussions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {selectedTag && (
            <TouchableOpacity 
              style={styles.tagFilter}
              onPress={() => setSelectedTag('')}
            >
              <Text style={styles.tagFilterText}>{selectedTag}</Text>
              <Ionicons name="close-circle" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={posts.filter(post => 
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.postCard}
              onPress={() => router.push(`/post-detail?id=${item._id}`)}
            >
              <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                  <Ionicons name="person-circle" size={24} color="#666" />
                  <Text style={styles.authorName}>{item.author?.name}</Text>
                </View>
                <Text style={styles.postDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postPreview} numberOfLines={2}>
                {item.content}
              </Text>

              <View style={styles.postFooter}>
                <View style={styles.tagContainer}>
                  {item.tags.map((tag, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.tag}
                      onPress={() => setSelectedTag(tag)}
                    >
                      <Text style={styles.tagText}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.statsContainer}>
                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.statsText}>{item.answerCount}</Text>
                  {item.isSolved && (
                    <View style={styles.solvedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.solvedText}>Solved</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item._id}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tagFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  tagFilterText: {
    color: '#1976d2',
    marginRight: 4,
    fontSize: 14,
  },
  listContainer: {
    padding: 12,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  postPreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#1976d2',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    marginLeft: 4,
    marginRight: 8,
    color: '#666',
    fontSize: 14,
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  solvedText: {
    color: '#4CAF50',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ForumScreen;
