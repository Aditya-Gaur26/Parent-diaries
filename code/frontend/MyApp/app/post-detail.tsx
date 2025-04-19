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
import { SafeAreaView } from 'react-native-safe-area-context';

const PostDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const { id } = JSON.parse(jsonPayload);
          setUserId(id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/forum/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data) {
        throw new Error('Post not found');
      }

      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          Alert.alert('Error', 'Post not found');
          router.back();
        } else if (error.response?.status === 401) {
          Alert.alert('Error', 'Please login again');
          router.replace('/login');
        } else {
          Alert.alert('Error', 'Failed to load post. Please try again later.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const isUpvoted = (votes = []) => {
    return Array.isArray(votes) && votes.includes(userId);
  };

  const isDownvoted = (votes = []) => {
    return Array.isArray(votes) && votes.includes(userId);
  };

  const handleVotePost = async (type: 'up' | 'down') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const currentVoteStatus = type === 'up' ? isUpvoted(post.upvotes) : isDownvoted(post.downvotes);

      // Optimistic update for post votes
      const updatedPost = { ...post };
      if (currentVoteStatus) {
        if (type === 'up') {
          updatedPost.upvotes = updatedPost.upvotes.filter(id => id !== userId);
        } else {
          updatedPost.downvotes = updatedPost.downvotes.filter(id => id !== userId);
        }
      } else {
        if (type === 'up') {
          updatedPost.upvotes = [...updatedPost.upvotes, userId];
          updatedPost.downvotes = updatedPost.downvotes.filter(id => id !== userId);
        } else {
          updatedPost.downvotes = [...updatedPost.downvotes, userId];
          updatedPost.upvotes = updatedPost.upvotes.filter(id => id !== userId);
        }
      }
      setPost(updatedPost);

      await axios.post(
        `${BACKEND_URL}/api/forum/posts/${id}/vote`,
        { 
          type: currentVoteStatus ? 'remove' : type,
          voteType: type
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote');
      fetchPost(); // Only fetch on error to revert optimistic update
    }
  };

  const handleVoteComment = async (commentId: string, type: 'up' | 'down') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const commentIndex = post.comments.findIndex(c => c._id === commentId);
      const comment = post.comments[commentIndex];
      const currentVoteStatus = type === 'up' ? isUpvoted(comment?.upvotes) : isDownvoted(comment?.downvotes);

      // Optimistic update for comment votes
      const updatedPost = { ...post };
      const updatedComment = { ...comment };

      if (currentVoteStatus) {
        if (type === 'up') {
          updatedComment.upvotes = updatedComment.upvotes.filter(id => id !== userId);
        } else {
          updatedComment.downvotes = updatedComment.downvotes.filter(id => id !== userId);
        }
      } else {
        if (type === 'up') {
          updatedComment.upvotes = [...updatedComment.upvotes, userId];
          updatedComment.downvotes = updatedComment.downvotes.filter(id => id !== userId);
        } else {
          updatedComment.downvotes = [...updatedComment.downvotes, userId];
          updatedComment.upvotes = updatedComment.upvotes.filter(id => id !== userId);
        }
      }

      updatedPost.comments[commentIndex] = updatedComment;
      setPost(updatedPost);

      await axios.post(
        `${BACKEND_URL}/api/forum/comments/${commentId}/vote`,
        { 
          type: currentVoteStatus ? 'remove' : type,
          voteType: type
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error voting comment:', error);
      Alert.alert('Error', 'Failed to vote on comment');
      fetchPost(); // Only fetch on error to revert optimistic update
    }
  };

  const getVoteCount = (upvotes = [], downvotes = []) => {
    return (upvotes?.length || 0) - (downvotes?.length || 0);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        router.replace('/login');
        return;
      }

      await axios.post(
        `${BACKEND_URL}/api/forum/posts/${id}/comments`,
        { content: comment.trim() },
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

  const renderVoteButtons = (item, itemType = 'post') => (
    <View style={styles.voteContainer}>
      <TouchableOpacity 
        style={[
          styles.voteButton,
          isUpvoted(item.upvotes) && styles.voteButtonActive
        ]}
        onPress={() => itemType === 'post' ? handleVotePost('up') : handleVoteComment(item._id, 'up')}
      >
        <Ionicons 
          name="arrow-up" 
          size={itemType === 'post' ? 24 : 20} 
          color={isUpvoted(item.upvotes) ? "#fff" : "#4CAF50"}
        />
      </TouchableOpacity>
      <Text style={styles.voteCount}>
        {getVoteCount(item.upvotes, item.downvotes)}
      </Text>
      <TouchableOpacity 
        style={[
          styles.voteButton,
          isDownvoted(item.downvotes) && styles.voteButtonDownActive
        ]}
        onPress={() => itemType === 'post' ? handleVotePost('down') : handleVoteComment(item._id, 'down')}
      >
        <Ionicons 
          name="arrow-down" 
          size={itemType === 'post' ? 24 : 20} 
          color={isDownvoted(item.downvotes) ? "#fff" : "#F44336"}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discussion</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.author}>By {post.author.name}</Text>
          <Text style={styles.body}>{post.content}</Text>

          {renderVoteButtons(post, 'post')}

          <Text style={styles.sectionTitle}>Comments</Text>
          {post.comments.map((comment) => (
            <View key={comment._id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{comment.author.name}</Text>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <View style={styles.commentActions}>
                {renderVoteButtons(comment, 'comment')}
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
    marginVertical: 12,
    justifyContent: 'center',
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
    marginTop: 8,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  voteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  voteButtonActive: {
    backgroundColor: '#4CAF50',
  },
  voteButtonDownActive: {
    backgroundColor: '#F44336',
  },
});

export default PostDetailScreen;