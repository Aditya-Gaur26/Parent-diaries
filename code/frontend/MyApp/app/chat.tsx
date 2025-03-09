import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const ChatScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuestion = params.question ? String(params.question) : '';
  
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef(null);

  // Simulate initial messages based on the topic
  useEffect(() => {
    if (initialQuestion) {
      // Add user's initial question
      const initialUserMessage = {
        id: '1',
        text: initialQuestion,
        sender: 'user',
        timestamp: new Date().getTime(),
      };

      // Add AI's initial response
      let initialAIResponse;
      if (initialQuestion.toLowerCase().includes('moral values')) {
        initialAIResponse = {
          id: '2',
          text: "Teaching moral values to children is essential for their development. Start by being a good role model and demonstrating the values you wish to instill. Use everyday situations as teaching moments and discuss the importance of honesty, respect, and kindness.",
          sender: 'ai',
          timestamp: new Date().getTime() + 1000,
        };
        
        const followUpAI = {
          id: '3',
          text: "I recommend using age-appropriate stories and examples that illustrate these values. Would you like some specific examples for your child's age group?",
          sender: 'ai',
          timestamp: new Date().getTime() + 2000,
        };
        
        setMessages([initialUserMessage, initialAIResponse, followUpAI]);
      } else {
        initialAIResponse = {
          id: '2',
          text: `I'd be happy to help you with "${initialQuestion}". What specific information are you looking for?`,
          sender: 'ai',
          timestamp: new Date().getTime() + 1000,
        };
        
        setMessages([initialUserMessage, initialAIResponse]);
      }
    }
  }, [initialQuestion]);

  const handleSend = () => {
    if (inputText.trim()) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date().getTime(),
      };
      
      // Simulate AI response
      let aiResponse;
      if (inputText.toLowerCase().includes('development')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "Child development is influenced by various factors including genetics, environment, parenting styles, and experiences. I can provide more specific guidance based on your child's age and developmental needs.",
          sender: 'ai',
          timestamp: new Date().getTime() + 1000,
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: `That's a great question about "${inputText}". As a parenting companion, I can offer some perspective on this topic based on child development research.`,
          sender: 'ai',
          timestamp: new Date().getTime() + 1000,
        };
      }
      
      setMessages(prevMessages => [...prevMessages, userMessage, aiResponse]);
      setInputText('');
      
      // Scroll to bottom after update
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userBubble : styles.aiBubble
    ]}>
      <Text style={[
        styles.messageText, 
        {color: item.sender === 'user' ? '#fff' : '#333'}
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Parenting Companion
        </Text>
      </View>
      
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatText}>
            Ask me anything about parenting or child development
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="paper-plane" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChatText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  messagesList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 6,
  },
  userBubble: {
    backgroundColor: '#5F3DC4',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 30,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#5F3DC4',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
});

export default ChatScreen;
