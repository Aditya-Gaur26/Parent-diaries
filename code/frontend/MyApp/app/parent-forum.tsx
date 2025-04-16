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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Forum</Text>
        <TouchableOpacity onPress={() => router.push('/new-post')}>
          <Ionicons name="add" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search discussions..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={posts.filter(post => 
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.postCard}
            onPress={() => router.push(`/post-detail?id=${item._id}`)}
          >
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
                <Text style={styles.statsText}>
                  {item.answerCount} answers
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ...add the styles from the example...
});

export default ForumScreen;
