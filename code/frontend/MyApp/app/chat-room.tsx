import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';
import socketService from '../utils/socketService';

interface Message {
  _id: string;
  text: string;
  createdAt: string | Date;
  sender: string;
  senderName?: string;
  senderImage?: string | null;
  receiver: string;
  read: boolean;
  pending?: boolean;
  tempId?: string;
  failed?: boolean;
}

export default function ChatRoomScreen() {
  const router = useRouter();
  // Update to also handle explicitly passed current user ID
  const { userId, userName, chatId, currentUserId: passedUserId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // Initialize with passed ID if available
  const [currentUserId, setCurrentUserId] = useState(passedUserId || null);
  const [chat, setChat] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const flatListRef = useRef(null);
  const MESSAGE_LIMIT = 20; // Number of messages to load per page
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  useEffect(() => {
    // Make sure we have the minimum required data
    if (!chatId) {
      console.error('No chat ID provided, cannot continue');
      router.back();
      return;
    }
    
    // Function to ensure we have current user ID
    const ensureCurrentUser = async () => {
      // If we already have the current user ID from URL params, use it
      if (passedUserId) {
        setCurrentUserId(passedUserId);
        return passedUserId;
      }
      
      // Otherwise get it from storage
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData && userData._id) {
            setCurrentUserId(userData._id);
            console.log('Using user ID from userData:', userData._id);
            return userData._id;
          }
        }
      } catch (err) {
        console.error('Error getting user data:', err);
      }
      return null;
    };
    
    // Function to initialize socket and join chat
    const initializeChat = async () => {
      const userIdToUse = await ensureCurrentUser();
      if (!userIdToUse) {
        console.error('Could not determine current user ID');
        return;
      }
      
      // Connect socket if needed
      await socketService.connect();
      
      // Join the chat room
      console.log(`Joining chat room ${chatId} as user ${userIdToUse}`);
      socketService.joinChat(chatId);
      setupSocketListeners(chatId);
      
      // Fetch messages
      fetchChatMessages(chatId, 1);
    };
    
    initializeChat();
    
    // Clean up function
    return () => {
      if (chatId) {
        socketService.leaveChat(chatId);
        removeSocketListeners();
      }
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [chatId, passedUserId]);

  const fetchInitialChat = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      // If we have a chat ID, fetch chat with pagination
      if (chatId) {
        fetchChatMessages(chatId, 1);
      } else if (userId && currentUserId) {
        // Try to find existing chat between users
        await findOrCreateChat();
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
      setIsLoading(false);
    }
  };

  const findOrCreateChat = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      // Get user chats
      const response = await axios.get(`${BACKEND_URL}/api/chat/user/${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Find chat with this user
        const relevantChat = response.data.find(chat =>  
          !chat.isGroup && chat.participants.some(p => 
            (p._id === userId || p === userId)
          )
        );
        
        if (relevantChat) {
          // Found existing chat
          setChat(relevantChat);
          console.log("helllloooooooooo" ,relevantChat)
          fetchChatMessages(relevantChat._id, 1);
        } else {
          // No existing chat, create one
          createNewChat();
        }
      } else {
        // No chats or invalid response
        createNewChat();
      }
    } catch (error) {
      console.error('Error finding chat:', error);
      createNewChat();
    }
  };

  const createNewChat = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        `${BACKEND_URL}/api/chat/create`,
        {
          userId: currentUserId,
          receiverId: userId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data._id) {
        setChat(response.data);
        // New chat won't have messages, so just set loading to false
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      setIsLoading(false);
    }
  };

  // Improve fetchChatMessages to better handle scroll position
  const fetchChatMessages = async (chatId, pageNum) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const token = await AsyncStorage.getItem('authToken');
      
      // Fetch messages with pagination
      const response = await axios.get(
        `${BACKEND_URL}/api/chat/${chatId}/messages`, {
          params: { page: pageNum, limit: MESSAGE_LIMIT },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        const { messages: newMessages, hasMore } = response.data;
        
        // Format messages for display with proper sender attribution
        const formattedMessages = newMessages.map(msg => {
          // Get the sender's ID (which should be an object with _id field if populated properly)
          const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
          
          // Compare with currentUserId to determine if this is a message from current user
          const isMyMessage = senderId === currentUserId;
          
          return {
            _id: msg._id,
            text: msg.content,
            createdAt: msg.createdAt,
            sender: isMyMessage ? 'me' : senderId,
            senderName: msg.sender?.name || 'Unknown',
            senderImage: msg.sender?.profilePicture || null,
            receiver: isMyMessage ? userId : currentUserId,
            read: msg.read
          };
        });
        
        // Important: Store current scroll position and content height before updating
        let scrollViewHeight = 0;
        let scrollPosition = 0;
        
        if (pageNum > 1 && flatListRef.current) {
          try {
            // Get current content metrics before adding more messages
            flatListRef.current.measure((x, y, width, height, pageX, pageY) => {
              scrollViewHeight = height;
            });
            
            // Get current scroll position
            const scrollOffset = await new Promise(resolve => {
              flatListRef.current?.getScrollOffset(offset => {
                resolve(offset);
              });
            });
            
            if (scrollOffset) {
              scrollPosition = scrollOffset;
            }
          } catch (err) {
            console.log('Error measuring scroll position:', err);
          }
        }
        
        // For first page, replace messages; for pagination, add older messages to beginning
        if (pageNum === 1) {
          setMessages(formattedMessages);
        } else {
          setMessages(prev => {
            const combined = [...formattedMessages, ...prev];
            
            // Log the pagination details
            console.log(`Added ${formattedMessages.length} older messages. Total: ${combined.length}`);
            
            return combined;
          });
        }
        
        console.log(`Loaded ${formattedMessages.length} messages for page ${pageNum}, hasMore: ${hasMore}`);
        setHasMoreMessages(hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error(`Error fetching messages for page ${pageNum}:`, error);
    } finally {
      if (pageNum === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const pollForNewMessages = async () => {
    if (!chat || !chat._id) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Only fetch new messages (those that came after our most recent one)
      const latestMessageId = messages.length > 0 ? messages[messages.length - 1]._id : null;
      
      const response = await axios.get(
        `${BACKEND_URL}/api/chat/${chat._id}/new-messages`, {
          params: { after: latestMessageId },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        // Format and append new messages
        const newMessages = response.data.messages.map(msg => ({
          _id: msg._id,
          text: msg.content,
          createdAt: msg.createdAt,
          sender: msg.sender._id === currentUserId ? 'me' : msg.sender._id,
          receiver: msg.sender._id === currentUserId ? userId : currentUserId,
          read: msg.read
        }));
        
        setMessages(prev => [...prev, ...newMessages]);
        
        // Scroll to bottom if new messages received
        if (flatListRef.current && newMessages.length > 0) {
          setTimeout(() => flatListRef.current.scrollToEnd(), 200);
        }
      }
    } catch (error) {
      console.error('Error polling for new messages:', error);
    }
  };

  // Enhanced loadMoreMessages function with better error handling and logging
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore || !hasMoreMessages ) {
      console.log('Skipping loadMoreMessages:', 
        isLoadingMore ? 'Already loading' : 
        !hasMoreMessages ? 'No more messages' : 
        'No chat data');
      return;
    }
    
    console.log('Loading more messages from page', page + 1);
    fetchChatMessages(chatId, page + 1);
  }, [isLoadingMore, hasMoreMessages, chat, page]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Stop typing indicator when sending a message
    handleStopTyping();

    setIsSending(true);
    const tempId = Date.now().toString();
    const newMessage = {
      _id: tempId,
      tempId: tempId, // Use this to match with server response
      text: inputMessage,
      createdAt: new Date(),
      sender: 'me',
      receiver: userId,
      read: false,
      pending: true
    };

    // Add to local messages immediately
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    try {
      // Get current user ID if not available
      let senderId = currentUserId;
      if (!senderId) {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData && userData._id) {
            senderId = userData._id;
            setCurrentUserId(senderId);
          }
        }
      }

      // Send message via socket
      if (chat && chat._id) {
        // Pass tempId to match the message after it's saved
        socketService.sendMessage(
          chat._id,
          inputMessage,
          [], // No attachments
          tempId // Pass the tempId
        );
      } else {
        // No existing chat, create one and then send message
        const token = await AsyncStorage.getItem('authToken');
        const createResponse = await axios.post(
          `${BACKEND_URL}/api/chat/create`,
          {
            userId: currentUserId || senderId,
            receiverId: userId
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (createResponse.data && createResponse.data._id) {
          const newChatId = createResponse.data._id;
          setChat(createResponse.data);
          
          // Join the new chat room
          socketService.joinChat(newChatId);
          setupSocketListeners(newChatId);
          
          // Send message via socket
          socketService.sendMessage(
            newChatId,
            inputMessage,
            [],
            tempId
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Keep message but mark as failed
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? { ...msg, pending: false, failed: true } : msg
        )
      );
    } finally {
      setIsSending(false);
      
      // Scroll to bottom after sending
      if (flatListRef.current) {
        setTimeout(() => flatListRef.current.scrollToEnd(), 200);
      }
    }
  };

  const setupSocketListeners = (roomId) => {
    // Listen for new messages - these are messages from OTHER users
    socketService.onMessage((data) => {
      if (data.chatId === roomId) {
        const { message, senderInfo } = data;
        
        // Format the message with clear sender attribution
        const formattedMessage = {
          _id: message._id,
          text: message.content,
          createdAt: message.createdAt,
          sender: message.sender._id,
          senderName: senderInfo?.name || "User",
          senderImage: senderInfo?.profilePicture || null,
          receiver: currentUserId,
          read: message.read
        };
        
        // Add to messages state (avoiding duplicates)
        setMessages(prev => {
          const exists = prev.some(m => m._id === formattedMessage._id);
          if (!exists) {
            return [...prev, formattedMessage];
          }
          return prev;
        });
        
        // Auto-scroll to bottom for new messages
        if (flatListRef.current) {
          setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 200);
        }
      }
    });

    // Listen for message sent confirmations - these are YOUR messages that were saved
    socketService.onMessageSent((data) => {
      if (data.chatId === roomId) {
        const { message, tempId } = data;
        
        // Update any pending message with the confirmed message data
        setMessages(prev => 
          prev.map(msg => 
            (msg.pending && msg.tempId === tempId) ? 
              {
                _id: message._id,
                text: message.content,
                createdAt: message.createdAt,
                sender: 'me',
                receiver: userId,
                read: message.read,
                pending: false
              } : msg
          )
        );
      }
    });

    // Listen for typing indicators
    socketService.onTyping((data) => {
      if (data.chatId === roomId && data.userId !== currentUserId) {
        setUserIsTyping(true);
      }
    });

    // Listen for stop typing indicators
    socketService.onStopTyping((data) => {
      if (data.chatId === roomId && data.userId !== currentUserId) {
        setUserIsTyping(false);
      }
    });

    // Listen for message read status updates
    socketService.onMessagesRead((data) => {
      if (data.chatId === roomId) {
        // Update read status for messages
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) 
              ? { ...msg, read: true } 
              : msg
          )
        );
      }
    });
  };

  const removeSocketListeners = () => {
    socketService.removeListeners('receive_message');
    socketService.removeListeners('typing');
    socketService.removeListeners('stop_typing');
    socketService.removeListeners('messages_read');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    // Correctly determine if this message is from the current user
    const isMyMessage = item.sender === 'me' || item.sender === currentUserId;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <Image 
              source={item.senderImage ? { uri: item.senderImage } : require('@/assets/images/profile-pic.jpg')} 
              style={styles.messageAvatar} 
            />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          {!isMyMessage && item.senderName && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {formatTime(item.createdAt)}
            </Text>
            
            {isMyMessage && (
              <View style={styles.messageStatus}>
                {item.pending ? (
                  <ActivityIndicator size="small" color="#999" />
                ) : item.read ? (
                  <Ionicons name="checkmark-done" size={14} color="#4FC3F7" />
                ) : (
                  <Ionicons name="checkmark" size={14} color="#999" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderLoadingHeader = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#999" />
        <Text style={styles.loadingMoreText}>Loading older messages...</Text>
      </View>
    );
  };

  // Add typing indicator handling
  const handleTyping = () => {
    if (!isTyping && chat?._id) {
      setIsTyping(true);
      socketService.sendTyping(chat._id);
      
      // Clear any existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds
      const timeout = setTimeout(handleStopTyping, 2000);
      setTypingTimeout(timeout);
    } else if (typingTimeout) {
      // Reset timeout
      clearTimeout(typingTimeout);
      const timeout = setTimeout(handleStopTyping, 2000);
      setTypingTimeout(timeout);
    }
  };

  const handleStopTyping = () => {
    if (isTyping && chat?._id) {
      setIsTyping(false);
      socketService.sendStopTyping(chat._id);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  // Mark messages as read when viewed
  const markMessagesAsRead = useCallback(() => {
    if (!chat?._id || !currentUserId) return;
    
    // Find unread messages from the other user
    const unreadMessages = messages.filter(
      msg => msg.sender !== 'me' && !msg.read
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      
      // Mark as read via socket
      socketService.markMessagesAsRead(chat._id, messageIds);
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
    }
  }, [messages, chat, currentUserId]);

  // Call markMessagesAsRead when messages are viewed
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      markMessagesAsRead();
    }
  }, [messages, isLoading, markMessagesAsRead]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <Image
            source={require('@/assets/images/profile-pic.jpg')}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userStatus}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={(w, h) => {
              // Only scroll to bottom automatically on initial load or new messages, not when loading older history
              if (!isLoadingMore && messages.length > 0 && !userScrolledUp) {
                flatListRef.current?.scrollToEnd({animated: false});
              }
            }}
            ListHeaderComponent={
              // Enhance loading indicator at the top
              <>
                {isLoadingMore && (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#999" />
                    <Text style={styles.loadingMoreText}>Loading older messages...</Text>
                  </View>
                )}
                {/* Add pull-to-refresh indicator when at top but has more to load */}
                {hasMoreMessages && !isLoadingMore && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton}
                    onPress={loadMoreMessages}
                  >
                    <Text style={styles.loadMoreText}>Load older messages</Text>
                    <Ionicons name="chevron-up" size={16} color="#666" />
                  </TouchableOpacity>
                )}
              </>
            }
            inverted={false} // Keep the list in normal order (oldest messages at top)
            onScrollBeginDrag={() => {
              // Track that user has manually scrolled
              if (messages.length > 0) {
                setUserScrolledUp(true);
              }
            }}
            onScroll={({nativeEvent}) => {
              const scrollY = nativeEvent.contentOffset.y;
              const threshold = 20;
              
              // Detect scrolling near the top to load more messages
              if (scrollY < threshold && hasMoreMessages && !isLoadingMore) {
                console.log('Reached top, loading more messages. ScrollY:', scrollY);
                loadMoreMessages();
              }
              
              // Track if user has scrolled up significantly from bottom
              const isScrolledUp = scrollY < (nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - 100);
              setUserScrolledUp(isScrolledUp);
            }}
            scrollEventThrottle={200} // Reduce frequency for better performance
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start a conversation!</Text>
              </View>
            }
          />
          {userIsTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{userName} is typing...</Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={inputMessage}
              onChangeText={(text) => {
                setInputMessage(text);
                handleTyping();
              }}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                !inputMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',  // Current user's messages on right
    marginLeft: 50,  // Leave more space on the left for my messages
    marginRight: 10,
  },
  theirMessageContainer: {
    alignSelf: 'flex-start', // Other user's messages on left
    marginRight: 50,  // Leave more space on the right for their messages
    marginLeft: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    minWidth: 80,
  },
  myMessageBubble: {
    backgroundColor: '#DCF8C6', // Light green for my messages
    borderTopRightRadius: 4,  // Slightly different shape
    borderBottomRightRadius: 18, 
    borderBottomLeftRadius: 18,
    borderTopLeftRadius: 18,
  },
  theirMessageBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,  // Slightly different shape
    borderTopRightRadius: 18, 
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#303030',
  },
  theirMessageText: {
    color: '#303030',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: '#7d7d7d',
  },
  theirMessageTime: {
    color: '#7d7d7d',
  },
  messageStatus: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
    color: '#888',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#aaa',
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadMoreButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    margin: 10,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  typingText: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarContainer: {
    alignSelf: 'flex-end',
    marginRight: 8,
    marginBottom: 5,  // Reduced from 15 for better alignment
  },
  senderName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
  },
});