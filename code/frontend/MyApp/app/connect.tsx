import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ConnectScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Connect with others</Text>
        <Text style={styles.subtitle}>
          Join our community and connect with other parents and healthcare professionals
        </Text>
        
        {/* Chat with other parents */}
        <TouchableOpacity 
          style={styles.connectCard}
          onPress={() => router.push('/parent-chat')}
        >
          <View style={styles.cardImageContainer}>
            <Ionicons name="people" size={40} color="#4CAF50" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Chat with Other Parents</Text>
            <Text style={styles.cardDescription}>
              Connect directly with other parents to share experiences and advice
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#777" />
        </TouchableOpacity>
        
        {/* Parents Discussion Forum */}
        <TouchableOpacity 
          style={styles.connectCard}
          onPress={() => router.push('/parent-forum')}
        >
          <View style={styles.cardImageContainer}>
            <Ionicons name="chatbubbles" size={40} color="#FF9800" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Parent Discussion Forum</Text>
            <Text style={styles.cardDescription}>
              Join group discussions on topics related to parenting and child health
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#777" />
        </TouchableOpacity>
        
        {/* Connect with Doctors */}
        <TouchableOpacity 
          style={styles.connectCard}
          onPress={() => router.push('/doctor-directory')}
        >
          <View style={styles.cardImageContainer}>
            <Ionicons name="medkit" size={40} color="#2196F3" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Connect with Doctors</Text>
            <Text style={styles.cardDescription}>
              Find and consult with verified healthcare professionals
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#777" />
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  connectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
  },
});
