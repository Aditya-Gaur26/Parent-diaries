import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config/environment';

const PostDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${BACKEND_URL}/api/forum/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Failed to fetch post details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, []);

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${BACKEND_URL}/api/forum/posts/${id}/comments`,
        { content: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment('');
      fetchPost();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVotePost = async (type: 'up' | 'down') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${BACKEND_URL}/api/forum/posts/${id}/vote`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPost();
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const handleVoteComment = async (commentId: string, type: 'up' | 'down') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${BACKEND_URL}/api/forum/comments/${commentId}/vote`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPost();
    } catch (error) {
      console.error('Error voting comment:', error);
      Alert.alert('Error', 'Failed to vote on comment');
    }
  };

  const handleMarkAnswer = async (commentId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${BACKEND_URL}/api/forum/comments/${commentId}/mark-answer`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPost();
    } catch (error) {
      console.error('Error marking answer:', error);
      Alert.alert('Error', 'Failed to mark answer');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.author}>By {post.author.name}</Text>
        <Text style={styles.body}>{post.content}</Text>

        <View style={styles.voteContainer}>
          <TouchableOpacity onPress={() => handleVotePost('up')}>
            <Ionicons name="arrow-up" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{post.upvotes.length - post.downvotes.length}</Text>
          <TouchableOpacity onPress={() => handleVotePost('down')}>
            <Ionicons name="arrow-down" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Comments</Text>
        {post.comments.map((comment) => (
          <View key={comment._id} style={styles.comment}>
            <Text style={styles.commentAuthor}>{comment.author.name}</Text>
            <Text style={styles.commentContent}>{comment.content}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => handleVoteComment(comment._id, 'up')}>
                <Ionicons name="arrow-up" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <Text style={styles.voteCount}>
                {comment.upvotes.length - comment.downvotes.length}
              </Text>
              <TouchableOpacity onPress={() => handleVoteComment(comment._id, 'down')}>
                <Ionicons name="arrow-down" size={20} color="#F44336" />
              </TouchableOpacity>
              {post.author._id === comment.author._id && !comment.isAnswer && (
                <TouchableOpacity onPress={() => handleMarkAnswer(comment._id)}>
                  <Text style={styles.markAnswer}>Mark as Answer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAddComment}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    marginBottom: 24,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  voteCount: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  comment: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAnswer: {
    marginLeft: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  submitButton: {
    marginLeft: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f00',
  },
});

export default PostDetailScreen;