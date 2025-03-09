import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const HistoryScreen = () => {
  const router = useRouter();
  
  const historyData = [
    {
      id: '1',
      title: 'How to teach my child moral values?',
      date: '08 August 2024 | 03:23 AM',
    },
    {
      id: '2',
      title: 'My child lied to me today. How should I respond to mend him?',
      date: '08 August 2024 | 03:23 AM',
    },
    {
      id: '3',
      title: 'How to improve reading and writing skills of my child?',
      date: '08 August 2024 | 03:23 AM',
    },
    {
      id: '4',
      title: 'How to improve the speaking and listening skills of my child?',
      date: '08 August 2024 | 03:23 AM',
    },
    {
      id: '5',
      title: 'How to help my child learn and grasp things quickly?',
      date: '08 August 2024 | 03:23 AM',
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => router.push({
        pathname: '/history-detail',
        params: { id: item.id }
      })}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{item.date}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="trash-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={historyData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
  },
});

export default HistoryScreen;
