import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function LoginSignupScreen() {
  const router = useRouter();
  
  const recentQuestions = [
    {
      id: 1,
      question: 'My son just spoke for the first time',
      subtitle: 'How should I react?',
    },
    {
      id: 2,
      question: 'My son just turned 1 year old',
      subtitle: 'What should I gift him?',
    },
    {
      id: 3,
      question: 'My daughter demands a phone',
      subtitle: 'How should I respond?',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => router.push('/edit-profile')}>
              <Image
                source={require('@/assets/images/profile-pic.jpg')}
                style={styles.profilePic}
              />
            </TouchableOpacity>
            <Text style={styles.greeting}>Hi, Jazeel</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Help message */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>How may I help you today?</Text>
          <Text style={styles.companyText}>Empathetic Companion</Text>
        </View>

        {/* Main options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => router.push('/chat')}> {/* Changed from '/(tabs)' to '/chat' */}
            <View style={styles.optionContent}>
              <Image
                source={require('@/assets/images/chat-icon.png')}
                style={styles.optionImage}
              />
              <Text style={styles.optionText}>Chat with Companion</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => router.push('/voice-chat')}> {/* Changed from '/(tabs)' to '/voice-chat' */}
            <View style={styles.optionContent}>
              <Image
                source={require('@/assets/images/parent_child_image.jpg')}
                style={styles.optionImage}
              />
              <Text style={styles.optionText}>Talk with Companion </Text>
            </View>
          </TouchableOpacity>
        </View>
        

        {/* History section */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>History</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Recent questions */}
          <View style={styles.recentQuestionsContainer}>
            {recentQuestions.map(item => (
              <TouchableOpacity key={item.id} style={styles.questionItem}>
                <View style={styles.questionIconContainer}>
                  <MaterialIcons name="history" size={20} color="#555" />
                </View>
                <View style={styles.questionTextContainer}>
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Text style={styles.questionSubtitle}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#888" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 5,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpText: {
    fontSize: 16,
    color: '#333',
  },
  companyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historySection: {
    marginBottom: 30,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  recentQuestionsContainer: {
    marginTop: 5,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questionIconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  questionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
