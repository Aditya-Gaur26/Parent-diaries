import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config/environment';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Enhanced connect method with retry logic
  async connect() {
    try {
      // If already connected, return the socket
      if (this.isConnected && this.socket) {
        console.log('Socket already connected');
        return this.socket;
      }
      
      // If connecting, wait briefly and return
      if (this.socket) {
        console.log('Socket connection in progress');
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.socket;
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, cannot connect socket');
        return null;
      }

      console.log('Connecting to socket at:', BACKEND_URL);
      
      // Create socket connection with proper configuration
      this.socket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        extraHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Return a promise that resolves when connected
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);
        
        this.socket.on('connect', () => {
          console.log('Socket connected successfully');
          this.isConnected = true;
          clearTimeout(timeout);
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnected = false;
          clearTimeout(timeout);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Socket disconnected');
          this.isConnected = false;
        });
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
      return null;
    }
  }

  // Safely emit an event
  emit(event, data) {
    if (!this.socket) {
      console.warn(`Cannot emit ${event}: Socket not connected`);
      return false;
    }
    
    this.socket.emit(event, data);
    return true;
  }
  
  // Send a message and return a promise that resolves when the message is sent
  sendMessageWithAck(chatId, content, attachments = []) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Set up a one-time listener for acknowledgment
      this.socket.once('message_sent', (response) => {
        if (response.chatId === chatId) {
          resolve(response);
        }
      });

      // Set up error handler
      const errorHandler = (error) => {
        if (error.chatId === chatId) {
          this.socket.off('error', errorHandler);
          reject(error);
        }
      };
      this.socket.on('error', errorHandler);

      // Send the message
      this.socket.emit('send_message', { chatId, content, attachments });

      // Set timeout for acknowledgment
      setTimeout(() => {
        this.socket.off('error', errorHandler);
        reject(new Error('Message acknowledgment timed out'));
      }, 5000);
    });
  }
  
  // Enhanced join chat with connection check
  async joinChat(chatId) {
    if (!this.isConnected) {
      try {
        await this.connect();
      } catch (error) {
        console.error('Failed to connect socket before joining chat:', error);
        return false;
      }
    }
    
    return this.emit('join_chat', chatId);
  }

  // Leave a chat room
  leaveChat(chatId) {
    return this.emit('leave_chat', chatId);
  }

  // Send a message to a chat
  sendMessage(chatId, content, attachments = [], tempId = null) {
    return this.emit('send_message', { 
      chatId, 
      content, 
      attachments,
      tempId: tempId || Date.now().toString() 
    });
  }

  // Notify typing status
  sendTyping(chatId) {
    return this.emit('typing', chatId);
  }

  // Notify stopped typing
  sendStopTyping(chatId) {
    return this.emit('stop_typing', chatId);
  }

  // Mark messages as read
  markMessagesAsRead(chatId, messageIds) {
    return this.emit('mark_read', { chatId, messageIds });
  }

  // Listen for message sent confirmation
  onMessageSent(callback) {
    return this.on('message_sent', callback);
  }

  // Add event listener with tracking for cleanup
  on(event, callback) {
    if (!this.socket) {
      console.warn(`Cannot listen to ${event}: Socket not connected`);
      return false;
    }
    
    this.socket.on(event, callback);
    
    // Store listeners for later removal
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    return true;
  }
  
  // Helper methods for specific event types
  onMessage(callback) {
    return this.on('receive_message', callback);
  }
  
  onTyping(callback) {
    return this.on('typing', callback);
  }
  
  onStopTyping(callback) {
    return this.on('stop_typing', callback);
  }
  
  onMessagesRead(callback) {
    return this.on('messages_read', callback);
  }

  // Remove specific listeners
  removeListeners(event) {
    if (!this.socket || !this.listeners.has(event)) return;
    
    const listeners = this.listeners.get(event) || [];
    for (const callback of listeners) {
      this.socket.off(event, callback);
    }
    
    this.listeners.delete(event);
  }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) return;
    
    for (const [event, callbacks] of this.listeners.entries()) {
      for (const callback of callbacks) {
        this.socket.off(event, callback);
      }
    }
    
    this.listeners.clear();
  }

  // Disconnect and cleanup socket
  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected and cleaned up');
    }
  }

  // Get connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

const socketService = new SocketService();
export default socketService;
