import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView // Add this import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import useRoleProtection from '../hooks/useRoleProtection';

export default function ManageReportsScreen() {
  const { isLoading: isRoleLoading } = useRoleProtection(['admin']);
  const router = useRouter();
  
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'open', 'inProgress', 'resolved', 'closed'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh reports list when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [page, filterStatus])
  );

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        router.replace('/login');
        return;
      }

      // Prepare query parameters
      let queryParams = `page=${page}&limit=10`;
      if (filterStatus !== 'all') {
        // Convert camelCase status filter to Title Case for API
        const statusMap = {
          'open': 'Open',
          'inProgress': 'In Progress',
          'resolved': 'Resolved',
          'closed': 'Closed'
        };
        queryParams += `&status=${statusMap[filterStatus]}`;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.reports) {
        setReports(response.data.reports);
        applySearch(response.data.reports, searchQuery);
        
        // Update pagination
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleApiError = (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      AsyncStorage.removeItem('authToken');
      Alert.alert('Session Expired', 'Please login again');
      router.replace('/login');
    } else {
      Alert.alert('Error', 'Could not load reports');
    }
  };

  const applySearch = (reportsList, query) => {
    if (!query.trim()) {
      setFilteredReports(reportsList);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = reportsList.filter(report => 
      (report.description && report.description.toLowerCase().includes(lowercaseQuery)) ||
      (report.category && report.category.toLowerCase().includes(lowercaseQuery)) ||
      (report.userId?.name && report.userId.name.toLowerCase().includes(lowercaseQuery)) ||
      (report.userId?.email && report.userId.email.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredReports(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applySearch(reports, text);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setPage(1); // Reset to first page when changing filters
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1); // Reset to first page when refreshing
    fetchReports();
  };

  const navigateToReportDetails = (reportId) => {
    router.push({
      pathname: '/report-details',
      params: { reportId }
    });
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

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => navigateToReportDetails(item._id)}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportCategory}>{item.category}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text 
        style={styles.reportDescription}
        numberOfLines={2}
      >
        {item.description}
      </Text>
      
      <View style={styles.reportFooter}>
        <Text style={styles.reportUser}>
          From: {item.userId?.name || 'Unknown'} ({item.userId?.email || 'No email'})
        </Text>
        <Text style={styles.reportDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isRoleLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Verifying access...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Reports</Text>
        <View style={{ width: 24 }} /> {/* For symmetric spacing */}
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'all' && styles.activeFilterButton]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'open' && styles.activeFilterButton]}
            onPress={() => handleFilterChange('open')}
          >
            <Text style={[styles.filterText, filterStatus === 'open' && styles.activeFilterText]}>
              Open
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'inProgress' && styles.activeFilterButton]}
            onPress={() => handleFilterChange('inProgress')}
          >
            <Text style={[styles.filterText, filterStatus === 'inProgress' && styles.activeFilterText]}>
              In Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'resolved' && styles.activeFilterButton]}
            onPress={() => handleFilterChange('resolved')}
          >
            <Text style={[styles.filterText, filterStatus === 'resolved' && styles.activeFilterText]}>
              Resolved
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filterStatus === 'closed' && styles.activeFilterButton]}
            onPress={() => handleFilterChange('closed')}
          >
            <Text style={[styles.filterText, filterStatus === 'closed' && styles.activeFilterText]}>
              Closed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredReports}
            renderItem={renderReportItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? 'No reports match your search'
                    : filterStatus !== 'all' 
                      ? `No ${filterStatus} reports found` 
                      : 'No reports found'}
                </Text>
              </View>
            }
          />
          
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.pageButton, page === 1 && styles.disabledPageButton]}
                onPress={() => page > 1 && setPage(page - 1)}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={18} color={page === 1 ? '#ccc' : '#333'} />
              </TouchableOpacity>
              
              <Text style={styles.pageText}>
                Page {page} of {totalPages}
              </Text>
              
              <TouchableOpacity 
                style={[styles.pageButton, page === totalPages && styles.disabledPageButton]}
                onPress={() => page < totalPages && setPage(page + 1)}
                disabled={page === totalPages}
              >
                <Ionicons name="chevron-forward" size={18} color={page === totalPages ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#000',
  },
  filterText: {
    color: '#555',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reportItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  reportDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  reportUser: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  reportDate: {
    fontSize: 12,
    color: '#888',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  disabledPageButton: {
    backgroundColor: '#f8f8f8',
  },
  pageText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
});
