import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useRoleProtection from '../hooks/useRoleProtection';

export default function SystemSettingsScreen() {
  const { isLoading: isRoleLoading } = useRoleProtection(['admin']);
  const router = useRouter();
  
  // System settings states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // General settings
  const [enableDoctorRegistration, setEnableDoctorRegistration] = useState(true);
  const [autoApproveNewDoctors, setAutoApproveNewDoctors] = useState(false);
  const [enableMaintenance, setEnableMaintenance] = useState(false);
  
  // Notification settings
  const [sendDoctorApprovalEmails, setSendDoctorApprovalEmails] = useState(true);
  const [sendAdminNotifications, setSendAdminNotifications] = useState(true);
  const [enablePushNotifications, setEnablePushNotifications] = useState(true);
  
  // Security settings
  const [enforceStrongPasswords, setEnforceStrongPasswords] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  // Load current settings
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        // In a real app, this would be an API call to load settings
        setIsLoading(false);
        
        // For demo purposes, we'll just simulate settings loaded from AsyncStorage
        const savedSettings = await AsyncStorage.getItem('systemSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setEnableDoctorRegistration(parsedSettings.enableDoctorRegistration ?? true);
          setAutoApproveNewDoctors(parsedSettings.autoApproveNewDoctors ?? false);
          setEnableMaintenance(parsedSettings.enableMaintenance ?? false);
          setSendDoctorApprovalEmails(parsedSettings.sendDoctorApprovalEmails ?? true);
          setSendAdminNotifications(parsedSettings.sendAdminNotifications ?? true);
          setEnablePushNotifications(parsedSettings.enablePushNotifications ?? true);
          setEnforceStrongPasswords(parsedSettings.enforceStrongPasswords ?? true);
          setSessionTimeout(parsedSettings.sessionTimeout ?? true);
          setTwoFactorAuth(parsedSettings.twoFactorAuth ?? false);
        }
      } catch (error) {
        console.error('Error loading system settings:', error);
        Alert.alert('Error', 'Failed to load system settings');
        setIsLoading(false);
      }
    };
    
    loadSystemSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would be an API call to save settings
      // For demo purposes, we'll just save to AsyncStorage
      const settingsToSave = {
        enableDoctorRegistration,
        autoApproveNewDoctors,
        enableMaintenance,
        sendDoctorApprovalEmails,
        sendAdminNotifications,
        enablePushNotifications,
        enforceStrongPasswords,
        sessionTimeout,
        twoFactorAuth
      };
      
      await AsyncStorage.setItem('systemSettings', JSON.stringify(settingsToSave));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'System settings saved successfully');
    } catch (error) {
      console.error('Failed to save system settings:', error);
      Alert.alert('Error', 'Failed to save system settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaintenanceToggle = () => {
    if (!enableMaintenance) {
      Alert.alert(
        'Enable Maintenance Mode?',
        'This will make the app inaccessible to normal users. Only admins will be able to login.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Enable',
            onPress: () => setEnableMaintenance(true)
          }
        ]
      );
    } else {
      setEnableMaintenance(false);
    }
  };

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
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={{ width: 24 }} /> {/* Empty view for alignment */}
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* General Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Public Doctor Registration</Text>
                <Text style={styles.settingDescription}>Allow doctors to register through public form</Text>
              </View>
              <Switch
                value={enableDoctorRegistration}
                onValueChange={setEnableDoctorRegistration}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-approve New Doctors</Text>
                <Text style={styles.settingDescription}>Automatically approve new doctor registrations</Text>
              </View>
              <Switch
                value={autoApproveNewDoctors}
                onValueChange={setAutoApproveNewDoctors}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Maintenance Mode</Text>
                <Text style={styles.settingDescription}>Enable maintenance mode (blocks user access)</Text>
              </View>
              <Switch
                value={enableMaintenance}
                onValueChange={handleMaintenanceToggle}
                trackColor={{ false: '#d1d1d1', true: '#e53e3e' }}
                thumbColor="#fff"
              />
            </View>
          </View>
          
          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Doctor Approval Emails</Text>
                <Text style={styles.settingDescription}>Send email when doctors are approved</Text>
              </View>
              <Switch
                value={sendDoctorApprovalEmails}
                onValueChange={setSendDoctorApprovalEmails}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Admin Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications for system events</Text>
              </View>
              <Switch
                value={sendAdminNotifications}
                onValueChange={setSendAdminNotifications}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Enable push notifications for all users</Text>
              </View>
              <Switch
                value={enablePushNotifications}
                onValueChange={setEnablePushNotifications}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
          </View>
          
          {/* Security Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Strong Password Enforcement</Text>
                <Text style={styles.settingDescription}>Require complex passwords for all users</Text>
              </View>
              <Switch
                value={enforceStrongPasswords}
                onValueChange={setEnforceStrongPasswords}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Session Timeout</Text>
                <Text style={styles.settingDescription}>Automatically logout inactive users</Text>
              </View>
              <Switch
                value={sessionTimeout}
                onValueChange={setSessionTimeout}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>Require 2FA for admin accounts</Text>
              </View>
              <Switch
                value={twoFactorAuth}
                onValueChange={setTwoFactorAuth}
                trackColor={{ false: '#d1d1d1', true: '#000' }}
                thumbColor="#fff"
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.savingButton]}
            onPress={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
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
