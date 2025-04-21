import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function GrowthTracker() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.mainScroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Growth Tracker</Text>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.banner}>
          <Image 
            source={require('@/assets/images/parent_child_image.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Child Development Milestones</Text>
            <Text style={styles.bannerSubtitle}>Track your child's growth journey</Text>
          </View>
        </View>

        <View style={styles.milestoneContainer}>
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => router.push('/vaccination')}
          >
            <View style={styles.navigationContent}>
              <MaterialCommunityIcons name="needle" size={24} color="#4A90E2" />
              <Text style={styles.navigationText}>Track Vaccinations</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => router.push('/growth-milestones-tracking')}
          >
            <View style={styles.navigationContent}>
              <MaterialCommunityIcons name="star-circle-outline" size={24} color="#FF9500" />
              <Text style={styles.navigationText}>Growth Milestones</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => router.push('/milestone-tracker')}
          >
            <View style={styles.navigationContent}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#4CAF50" />
              <Text style={styles.navigationText}>Development Progress</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainScroll: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  infoButton: {
    padding: 8,
  },
  banner: {
    position: 'relative',
    height: 150,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: 'white',
    fontSize: 14,
  },
  milestoneContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  navigationButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  navigationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navigationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
});
