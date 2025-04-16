import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import useRoleProtection from '../hooks/useRoleProtection';

export default function ReportDetailsScreen() {
  const { isLoading: isRoleLoading } = useRoleProtection(['admin']);
  const router = useRouter();
  const { reportId } = useLocalSearchParams();
  
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
    } else {
      Alert.alert('Error', 'Report ID is missing');
      router.back();
    }
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/reports/${reportId}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.report) {
        setReport(response.data.report);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        Alert.alert('Not Found', 'Report does not exist or may have been deleted');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to load report details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdateLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/reports/${reportId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.report) {
        setReport(response.data.report);
        Alert.alert('Success', `Status updated to ${newStatus}`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Error', 'Failed to update report status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }
    
    try {
      setIsSending(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/reports/${reportId}/reply`,
        { message: replyText },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 207) {
        // Partial success - reply saved but email failed
        Alert.alert(
          'Partial Success', 
          'Reply saved but email notification could not be sent to the user'
        );
      } else {
        Alert.alert('Success', 'Reply sent and email notification delivered');
      }
      
      // Update local state with new report data
      if (response.data && response.data.report) {
        setReport(response.data.report);
        setReplyText(''); // Clear the reply input
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return '#F59E0B'; // Amber
      case 'In Progress':
        return '#3B82F6'; // Blue
      case 'Resolved':
        return '#10B981'; // Green
      case 'Closed':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isRoleLoading || isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>
          {isRoleLoading ? 'Verifying access...' : 'Loading report details...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Details</Text>
          <View style={{ width: 24 }} /> {/* For symmetric spacing */}
        </View>

        {report ? (
          <>
            <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 20}}>
              <View style={styles.section}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportCategory}>{report.category}</Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(report.status) }
                  ]}>
                    <Text style={styles.statusText}>{report.status}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Submitted by:</Text>
                  <Text style={styles.value}>{report.userId?.name || 'Unknown'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{report.userId?.email || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>{formatDate(report.createdAt)}</Text>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                  {report.description || 'No description provided'}
                </Text>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.statusButton,
                      report.status === 'Open' && styles.activeStatusButton,
                      { borderColor: '#F59E0B' }
                    ]}
                    onPress={() => handleStatusChange('Open')}
                    disabled={statusUpdateLoading || report.status === 'Open'}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      report.status === 'Open' && styles.activeStatusButtonText,
                      { color: '#F59E0B' }
                    ]}>Open</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusButton,
                      report.status === 'In Progress' && styles.activeStatusButton,
                      { borderColor: '#3B82F6' }
                    ]}
                    onPress={() => handleStatusChange('In Progress')}
                    disabled={statusUpdateLoading || report.status === 'In Progress'}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      report.status === 'In Progress' && styles.activeStatusButtonText,
                      { color: '#3B82F6' }
                    ]}>In Progress</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusButton,
                      report.status === 'Resolved' && styles.activeStatusButton,
                      { borderColor: '#10B981' }
                    ]}
                    onPress={() => handleStatusChange('Resolved')}
                    disabled={statusUpdateLoading || report.status === 'Resolved'}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      report.status === 'Resolved' && styles.activeStatusButtonText,
                      { color: '#10B981' }
                    ]}>Resolved</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.statusButton,
                      report.status === 'Closed' && styles.activeStatusButton,
                      { borderColor: '#6B7280' }
                    ]}
                    onPress={() => handleStatusChange('Closed')}
                    disabled={statusUpdateLoading || report.status === 'Closed'}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      report.status === 'Closed' && styles.activeStatusButtonText,
                      { color: '#6B7280' }
                    ]}>Closed</Text>
                  </TouchableOpacity>
                  
                  {statusUpdateLoading && (
                    <ActivityIndicator size="small" color="#000" style={styles.statusLoader} />
                  )}
                </View>
              </View>
              
              {report.replies && report.replies.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Previous Replies</Text>
                  {report.replies.map((reply, index) => (
                    <View key={index} style={styles.replyItem}>
                      <View style={styles.replyHeader}>
                        <Text style={styles.replyAdmin}>{reply.adminName}</Text>
                        <Text style={styles.replyDate}>{formatDate(reply.timestamp)}</Text>
                      </View>
                      <Text style={styles.replyMessage}>{reply.message}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            
            <View style={styles.replyContainer}>
              <Text style={styles.replyTitle}>Reply to User</Text>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your reply here..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity 
                style={[styles.sendButton, !replyText.trim() && styles.disabledButton]}
                onPress={handleSendReply}
                disabled={!replyText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.sendButtonText}>Send Reply</Text>
                    <Ionicons name="send" size={18} color="white" style={{marginLeft: 8}} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
            <Text style={styles.errorText}>Report not found</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 100,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  activeStatusButton: {
    backgroundColor: '#f8fafc',
  },
  statusButtonText: {
    fontSize: 14,
  },
  activeStatusButtonText: {
    fontWeight: '500',
  },
  statusLoader: {
    marginLeft: 8,
  },
  replyItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAdmin: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  replyDate: {
    fontSize: 12,
    color: '#888',
  },
  replyMessage: {
    fontSize: 14,
    color: '#333',
  },
  replyContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  replyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
  },
  sendButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});
