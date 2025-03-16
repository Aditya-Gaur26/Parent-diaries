import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {  BACKEND_URL } from '../config/environment';

const NotificationSettingsScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification settings
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    notificationTypes: {
      newMessages: true,
      reminders: true,
      updates: true,
      marketingEmails: false,
      activitySummary: true
    }
  });
  
  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First check local storage
        const savedSettings = await AsyncStorage.getItem('notificationSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        
        // Then try to get from backend if user is logged in
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await axios.get(`${BACKEND_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.notificationSettings) {
            setSettings(response.data.notificationSettings);
            // Update local storage with latest settings
            await AsyncStorage.setItem('notificationSettings', JSON.stringify(response.data.notificationSettings));
          }
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleMainToggle = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTypeToggle = (key, value) => {
    setSettings(prev => ({ 
      ...prev, 
      notificationTypes: { 
        ...prev.notificationTypes, 
        [key]: value 
      } 
    }));
  };
  
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to local storage
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      // Send to backend API
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await axios.post(`${BACKEND_URL}/api/users/notification-settings`, settings, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      Alert.alert('Success', 'Notification settings saved successfully');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} /> {/* Empty view for alignment */}
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications on your device</Text>
            </View>
            <Switch 
              value={settings.pushEnabled}
              onValueChange={(value) => handleMainToggle('pushEnabled', value)}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive email notifications</Text>
            </View>
            <Switch 
              value={settings.emailEnabled}
              onValueChange={(value) => handleMainToggle('emailEnabled', value)}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types of Notifications</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>New Messages</Text>
            <Switch 
              value={settings.notificationTypes.newMessages}
              onValueChange={(value) => handleTypeToggle('newMessages', value)}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor="#fff"
              disabled={!settings.pushEnabled && !settings.emailEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Reminders</Text>
            <Switch 
              value={settings.notificationTypes.reminders}
              onValueChange={(value) => handleTypeToggle('reminders', value)}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor="#fff"
              disabled={!settings.pushEnabled && !settings.emailEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>App Updates</Text>
            <Switch 
              value={settings.notificationTypes.updates}
              onValueChange={(value) => handleTypeToggle('updates', value)}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor="#fff"
              disabled={!settings.pushEnabled && !settings.emailEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Marketing Emails</Text>
            <Switch 
              value={settings.notificationTypes.marketingEmails}
              onValueChange={(value) => handleTypeToggle('marketingEmails', value)}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor="#fff"
              disabled={!settings.emailEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Activity Summary</Text>
            <Switch 
              value={settings.notificationTypes.activitySummary}
              onValueChange={(value) => handleTypeToggle('activitySummary', value)}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor="#fff"
              disabled={!settings.pushEnabled && !settings.emailEnabled}
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.savingButton]}
          onPress={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
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
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationSettingsScreen;
