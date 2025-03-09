import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SettingsScreen = () => {
  const router = useRouter();
  
  // Store only the necessary data without JSX
  const settingsItems = [
    {
      title: "Account",
      items: [
        { iconName: "person-outline", iconType: "Ionicons", label: "Edit profile" },
        { iconName: "shield-outline", iconType: "Ionicons", label: "Security" },
        { iconName: "notifications-outline", iconType: "Ionicons", label: "Notifications" },
        { iconName: "lock-closed-outline", iconType: "Ionicons", label: "Privacy" },
      ]
    },
    {
      title: "Support & About",
      items: [
        { iconName: "card-outline", iconType: "Ionicons", label: "My Subscription" },
        { iconName: "help-circle-outline", iconType: "Ionicons", label: "Help & Support" },
        { iconName: "information-circle-outline", iconType: "Ionicons", label: "Terms and Policies" },
      ]
    },
    {
      title: "Cache & cellular",
      items: [
        { iconName: "trash-outline", iconType: "Ionicons", label: "Free up space" },
        { iconName: "speedometer-outline", iconType: "Ionicons", label: "Data Saver" },
      ]
    },
    {
      title: "Actions",
      items: [
        { iconName: "flag", iconType: "Feather", label: "Report a problem" },
        { iconName: "person-add-outline", iconType: "Ionicons", label: "Add account" },
        { iconName: "logout", iconType: "MaterialIcons", label: "Log out", action: () => router.replace('/login-signup') },
      ]
    },
  ];

  // Separate rendering logic for icons
  const renderIcon = (item) => {
    switch (item.iconType) {
      case "Ionicons":
        return <Ionicons name={item.iconName} size={22} color="#333" />;
      case "Feather":
        return <Feather name={item.iconName} size={22} color="#333" />;
      case "MaterialIcons":
        return <MaterialIcons name={item.iconName} size={22} color="#333" />;
      default:
        return null;
    }
  };

  const handleItemPress = (item) => {
    console.log(`Pressed: ${item.label}`);
    
    if (item.label === "Edit profile") {
      router.push('/edit-profile');
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} /> {/* Empty view for alignment */}
      </View>
      
      <ScrollView style={styles.scrollView}>
        {settingsItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity 
                  key={itemIndex} 
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 ? styles.lastItem : null
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.iconContainer}>
                    {renderIcon(item)}
                  </View>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  iconContainer: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 15,
    color: '#333',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
});

export default SettingsScreen;
