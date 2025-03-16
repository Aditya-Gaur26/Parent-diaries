import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PrivacyScreen = () => {
  const router = useRouter();
  const [isDataCollectionEnabled, setIsDataCollectionEnabled] = useState(true);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isMediaSharingEnabled, setIsMediaSharingEnabled] = useState(true);
  const [isPersonalizedLearningEnabled, setIsPersonalizedLearningEnabled] = useState(true);
  
  const privacySettings = [
    {
      title: "Child Data Protection",
      items: [
        { 
          label: "Child Profile Privacy", 
          description: "Manage what information is visible about your child",
          isToggle: false,
          action: () => router.push('/child-profile-privacy')
        },
        { 
          label: "Media Sharing", 
          description: "Allow sharing photos and videos of your child",
          isToggle: true,
          value: isMediaSharingEnabled,
          onValueChange: setIsMediaSharingEnabled
        },
        { 
          label: "Delete Child Data", 
          description: "Permanently remove all data associated with your child",
          isToggle: false,
          action: () => router.push('/delete-child-data')
        },
      ]
    },
    {
      title: "AI & Data Usage",
      items: [
        { 
          label: "Data Collection", 
          description: "Allow app to collect usage data to improve services",
          isToggle: true,
          value: isDataCollectionEnabled,
          onValueChange: setIsDataCollectionEnabled
        },
        { 
          label: "Personalized Learning", 
          description: "Use AI to provide personalized recommendations",
          isToggle: true,
          value: isPersonalizedLearningEnabled,
          onValueChange: setIsPersonalizedLearningEnabled
        },
        { 
          label: "View Collected Data", 
          description: "See what data has been collected about your family",
          isToggle: false,
          action: () => router.push('/view-data')
        },
      ]
    },
    {
      title: "Location & Device",
      items: [
        { 
          label: "Location Services", 
          description: "Allow app to access device location",
          isToggle: true,
          value: isLocationEnabled,
          onValueChange: setIsLocationEnabled
        },
        { 
          label: "Device Access", 
          description: "Manage which devices can access your account",
          isToggle: false,
          action: () => router.push('/device-access')
        },
      ]
    },
    {
      title: "Legal",
      items: [
        { 
          label: "Privacy Policy", 
          description: "Read our privacy policy",
          isToggle: false,
          action: () => router.push('/privacy-policy')
        },
        { 
          label: "Data Handling Consent", 
          description: "Review and update your consent settings",
          isToggle: false,
          action: () => router.push('/consent-settings')
        },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {privacySettings.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity 
                key={itemIndex} 
                style={styles.settingItem}
                onPress={() => item.action && item.action()}
                disabled={item.isToggle}
              >
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  {item.description && (
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  )}
                </View>
                
                {item.isToggle ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onValueChange}
                    trackColor={{ false: '#d1d1d1', true: '#000' }}
                    thumbColor="#fff"
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    marginBottom: 1,
    marginHorizontal: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default PrivacyScreen;
