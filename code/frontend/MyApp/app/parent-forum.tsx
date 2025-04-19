import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput
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
  const [selectedTag, setSelectedTag] = useState('');
  const [activeTab, setActiveTab] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchPosts(selectedTag);
  }, [selectedTag, activeTab]);

  const fetchPosts = async (tag = '') => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      let queryParams = new URLSearchParams();
      
      if (tag) queryParams.append('tag', tag);
      
      switch (activeTab) {
        case 'popular':
          queryParams.append('sort', '-upvotes');
          break;
        case 'solved':
          queryParams.append('solved', 'true');
          break;
        default:
          queryParams.append('sort', '-createdAt');
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/forum/posts?${queryParams.toString()}`,
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

  const filterPosts = (posts) => {
    if (!searchQuery.trim()) return posts;

    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
  };

  const getVoteCount = (upvotes = [], downvotes = []) => {
    return (upvotes?.length || 0) - (downvotes?.length || 0);
  };

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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Parent Forum</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={22} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts, tags, or authors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color="#777" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'newest' && styles.activeTab]}
            onPress={() => setActiveTab('newest')}
          >
            <Ionicons name="time" size={18} color={activeTab === 'newest' ? "#1E88E5" : "#777"} />
            <Text style={[styles.tabText, activeTab === 'newest' && styles.activeTabText]}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
            onPress={() => setActiveTab('popular')}
          >
            <Ionicons name="trending-up" size={18} color={activeTab === 'popular' ? "#FFA500" : "#777"} />
            <Text style={[styles.tabText, activeTab === 'popular' && styles.activeTabText]}>Popular</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'solved' && styles.activeTab]}
            onPress={() => setActiveTab('solved')}
          >
            <Ionicons name="checkmark-circle" size={18} color={activeTab === 'solved' ? "#4CAF50" : "#777"} />
            <Text style={[styles.tabText, activeTab === 'solved' && styles.activeTabText]}>Solved</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.createPostContainer}
          onPress={() => router.push('/new-post')}
        >
          <View style={styles.profileImageSmall}>
            <Text style={styles.profileText}>P</Text>
          </View>
          <Text style={styles.placeholderText}>Share your parenting question...</Text>
          <View style={styles.createPostButton}>
            <Text style={styles.createPostButtonText}>Post</Text>
          </View>
        </TouchableOpacity>

        <FlatList
          data={filterPosts(posts)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.postsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.postCard}
              onPress={() => router.push(`/post-detail?id=${item._id}`)}
            >
              <View style={styles.postHeader}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postAuthor}>By {item.author.name}</Text>
              </View>

              <View style={styles.categoriesContainer}>
                {item.tags.map((tag, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.categoryPill}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text style={styles.categoryText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <Ionicons name="arrow-up" size={16} color="#4CAF50" />
                  <Text style={styles.statValue}>
                    {getVoteCount(item.upvotes, item.downvotes)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.statValue}>
                    {item.answerCount || 0}
                  </Text>
                </View>
                {item.isSolved && (
                  <View style={styles.solvedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={styles.solvedText}>Solved</Text>
                  </View>
                )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tagFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tagFilterText: {
    marginRight: 4,
    fontSize: 14,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#777',
  },
  activeTabText: {
    color: '#1E88E5',
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    margin: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileImageSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  placeholderText: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  createPostButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  postsContainer: {
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
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postAuthor: {
    fontSize: 12,
    color: '#777',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryPill: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    color: '#1976d2',
    fontSize: 12,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
});

export default ForumScreen;
