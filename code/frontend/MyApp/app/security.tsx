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

const SecurityScreen = () => {
  const router = useRouter();
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isAutoLogoutEnabled, setIsAutoLogoutEnabled] = useState(true);
  
  const securitySettings = [
    {
      title: "Authentication",
      items: [
        { 
          label: "App PIN Lock", 
          description: "Require a PIN to open the app",
          isToggle: true,
          value: isPinEnabled,
          onValueChange: setIsPinEnabled
        },
        { 
          label: "Biometric Authentication", 
          description: "Use Face ID or fingerprint to unlock the app",
          isToggle: true,
          value: isBiometricEnabled,
          onValueChange: setIsBiometricEnabled
        },
        { 
          label: "Change PIN", 
          isToggle: false,
          action: () => router.push('/change-pin')
        },
      ]
    },
    {
      title: "Session Security",
      items: [
        { 
          label: "Auto Logout", 
          description: "Automatically log out after 30 minutes of inactivity",
          isToggle: true,
          value: isAutoLogoutEnabled,
          onValueChange: setIsAutoLogoutEnabled
        },
        { 
          label: "Login History", 
          description: "View recent account access",
          isToggle: false,
          action: () => router.push('/login-history')
        },
      ]
    },
    {
      title: "Child Protection",
      items: [
        { 
          label: "Manage Parental Controls", 
          description: "Set restrictions and content filters",
          isToggle: false,
          action: () => router.push('/parental-controls')
        },
        { 
          label: "Activity Monitoring Settings", 
          description: "Configure child activity monitoring options",
          isToggle: false,
          action: () => router.push('/monitoring-settings')
        },
      ]
    },
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
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {securitySettings.map((section, sectionIndex) => (
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

export default SecurityScreen;
