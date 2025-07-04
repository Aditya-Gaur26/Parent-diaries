import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Animated,
  ActivityIndicator,
  LogBox,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config/environment';
import Markdown from 'react-native-markdown-display';
import { useLocalSearchParams } from 'expo-router';

// Suppress warnings during development
LogBox.ignoreAllLogs();

const arrayBufferToBase64 = (arrayBuffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

const SiriWaveView = ({ isActive, amplitude = 0 }: { isActive: boolean; amplitude: number }) => {
  const numBars = 12;
  const animations = [...Array(numBars)].map(() => useRef(new Animated.Value(0)).current);
  const [colors] = useState<string[]>(Array(numBars).fill('#000000'));

  useEffect(() => {
    let animationSubscriptions: any[] = [];

    if (isActive) {
      animations.forEach((anim, index) => {
        const createAnimation = () => {
          const distanceFromCenter = Math.abs((index - (numBars - 1) / 2) / ((numBars - 1) / 2));
          const baseAmplitude = Math.max(0.2, amplitude);
          const randomFactor = 0.7 + Math.random() * 0.3;
          const positionFactor = 1 - (distanceFromCenter * 0.5);
          const maxHeight = baseAmplitude * randomFactor * positionFactor;
          const minHeight = maxHeight * 0.3 * randomFactor;
          const upDuration = 600 + (index * 30) + Math.random() * 200;
          const downDuration = 700 + (index * 30) + Math.random() * 200;

          const animationSequence = Animated.sequence([
            Animated.timing(anim, {
              toValue: maxHeight,
              duration: upDuration,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: minHeight,
              duration: downDuration,
              useNativeDriver: false,
            })
          ]);

          const subscription = animationSequence.start(({ finished }) => {
            if (finished && isActive) {
              createAnimation();
            }
          });

          animationSubscriptions.push(subscription);
        };

        setTimeout(() => createAnimation(), index * 50);
      });
    } else {
      animations.forEach((anim) => {
        const subscription = Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }).start();
        animationSubscriptions.push(subscription);
      });
    }

    return () => {
      animations.forEach(anim => anim.stopAnimation());
      animationSubscriptions.forEach(subscription => {
        if (subscription && subscription.stop) {
          subscription.stop();
        }
      });
    };
  }, [isActive, amplitude, animations]);

  return (
    <View style={styles.siriWaveContainer}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.siriWaveLine,
            {
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [3, 60],
              }),
              backgroundColor: colors[index],
              width: 4 + Math.abs(index - (numBars - 1) / 2) * 0.4,
              marginHorizontal: 3,
            }
          ]}
        />
      ))}
    </View>
  );
};

const Chat2Screen = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
  }
  
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingObject, setRecordingObject] = useState<Audio.Recording | null>(null);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [inputHeight, setInputHeight] = useState(50); // Default height
  const [isLoading, setIsLoading] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const sound = useRef<Audio.Sound | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Make sure audio mode is properly set before any audio operations
  const configureAudioMode = async (forRecording: boolean) => {
    try {
      console.log(`Configuring audio mode for ${forRecording ? 'recording' : 'playback'}`);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: forRecording, // Critical for iOS recording
        playsInSilentModeIOS: true,
        // staysActiveInBackground: false,
        // interruptionModeIOS: Audio.InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        // interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  };

  useEffect(() => {
    const setup = async () => {
      try {
        // Get authentication token
        const authToken = await AsyncStorage.getItem('authToken');
        setToken(authToken);
        
        // Request audio permissions first
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Audio recording permission is required for this feature.');
          return;
        }
        
        // Then configure audio mode
        await configureAudioMode(true);
      } catch (error) {
        console.error('Error in setup:', error);
      }
    };

    setup();
    
    // Add cleanup to stop audio when component unmounts
    return () => {
      // Stop and unload any audio playing
      if (sound.current) {
        sound.current.stopAsync().catch(() => {});
        sound.current.unloadAsync().catch(() => {});
        sound.current = null;
      }
      
      // Stop any ongoing speech
      Speech.stop().catch(() => {});
      
      if (recordingObject) {
        try {
          recordingObject.stopAndUnloadAsync();
        } catch (error) {
          console.error("Error cleaning up recording:", error);
        }
      }

      clearAnimationInterval();
    };
  }, []);

  // Add an effect for AppState changes to handle app going to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Stop audio when app goes to background or becomes inactive
        if (sound.current) {
          sound.current.stopAsync().catch(() => {});
          sound.current.unloadAsync().catch(() => {});
          sound.current = null;
        }
        
        // Stop any ongoing speech
        Speech.stop().catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadChatHistory(sessionId as string);
    }
  }, [sessionId]);

  const loadChatHistory = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found');
        return;
      }
      
      console.log(`Loading chat history for session ${sessionId}`);
      
      // Updated endpoint to use llm sessions history
      const response = await axios.get(
        `${BACKEND_URL}/llm/sessions/${sessionId}/history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Process messages for display
      if (response.data && response.data.messages) {
        const historyMessages: Message[] = response.data.messages.map((msg, index) => ({
          id: `hist-${index}`,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.timestamp).getTime()
        }));
        
        setMessages(historyMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }
      
      Alert.alert('Error', 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAnimationInterval = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
  };

  const toggleSpeechMute = async () => {
    // If we're turning mute on (from unmuted to muted), stop any playing audio
    if (!isSpeechMuted) {
      // Stop any currently playing audio
      if (sound.current) {
        try {
          const status = await sound.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.current.stopAsync();
            await sound.current.unloadAsync();
          }
          sound.current = null;
        } catch (error) {
          console.warn('Error stopping audio:', error);
        }
      }
      
      // Also stop any ongoing speech
      try {
        Speech.stop();
      } catch (error) {
        console.warn('Error stopping speech:', error);
      }
    }
    
    // Toggle the mute state
    setIsSpeechMuted(!isSpeechMuted);
  };

  const startRecording = async () => {
    try {
      // Set audio mode explicitly for recording
      await configureAudioMode(true);
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          audioEncoder: 3,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          audioQuality: Audio.IOSAudioQuality.HIGH,
        }
      });

      recording.setOnRecordingStatusUpdate((status: any) => {
        if (status.isRecording) {
          if (status.metering !== undefined && !isNaN(status.metering)) {
            const normalizedMeter = Math.max(0, Math.min(1, (status.metering + 160) / 160));
            setAudioLevel(normalizedMeter);
          }
        }
      });

      await recording.startAsync();
      setRecordingObject(recording);
      setIsRecording(true);

      clearAnimationInterval();
      animationIntervalRef.current = setInterval(() => {
        const level = Math.random() * 0.7 + 0.3;
        setAudioLevel(level);
      }, 300);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', `Failed to start audio recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingObject) {
        clearAnimationInterval();
        await recordingObject.stopAndUnloadAsync();
        const uri = recordingObject.getURI();
        if (!uri) {
          throw new Error("Recording URI is null");
        }
        setRecordingUri(uri);
        setRecordingObject(null);
        setIsRecording(false);
        setAudioLevel(0);
        
        // Process the audio based on mute status
        // Set audio mode to playback before processing audio
        await configureAudioMode(false);
        
        if (isSpeechMuted) {
          // If muted, use ASR + LLM (audio input -> text output)
          await processAudioWithASR(uri);
        } else {
          // If not muted, use speech2speech (audio input -> audio output)
          await processAudioWithSpeech2Speech(uri);
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const processAudioWithASR = async (audioUri: string) => {
    setIsLoading(true);
    try {
      // Create form data for audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      // Call ASR API to transcribe audio
      const response = await axios.post(`${BACKEND_URL}/asr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const transcription = response.data.transcription;
      
      // Add user's message to chat
      const userMessage = {
        id: Date.now().toString(),
        text: transcription,
        sender: 'user',
        timestamp: new Date().getTime(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Call LLM API with transcription
      await sendMessageToLLM(transcription);
    } catch (error) {
      console.error('Error processing audio with ASR:', error);
      Alert.alert('Error', 'Failed to process voice input. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processAudioWithSpeech2Speech = async (audioUri: string) => {
    setIsLoading(true);
    try {
      // Create form data for audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('voice', 'alloy'); // Default voice

      console.log("Sending audio to speech2speech API...");
      
      // Add headers to include session ID if available
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      };
      
      if (currentSessionId) {
        headers['session-id'] = currentSessionId;
      }
      
      // Call speech2speech API
      const response = await axios.post(`${BACKEND_URL}/speech2speech`, formData, {
        headers
      });

      // Extract session ID from header or response data
      const newSessionId = response.headers['x-session-id'] || response.data.sessionId;
      if (newSessionId) {
        console.log(`Received session ID: ${newSessionId}`);
        setCurrentSessionId(newSessionId);
      }

      // Process response data
      if (response.data && response.data.audioBuffer) {
        console.log("Received response from speech2speech API");
        
        // Extract user input and LLM response
        const { userInput, audioBuffer } = response.data;
        // Get the actual LLM response text (it's nested in the response object)
        const llmResponse = response.data.llmResponse?.response || 
                            response.data.llmResponse || 
                            "I processed your request";
        
        // Generate a unique filename for this response
        const fileUri = `${FileSystem.documentDirectory}response_${Date.now()}.wav`;
        console.log("Saving audio to:", fileUri);
        
        try {
          // Write the audio data to a file - audioBuffer is already base64 encoded
          await FileSystem.writeAsStringAsync(fileUri, audioBuffer, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          // Verify file was written successfully
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists || fileInfo.size < 100) {
            throw new Error(`Audio file not saved properly: ${fileInfo.size} bytes`);
          }
          
          console.log(`Audio file saved successfully, size: ${fileInfo.size} bytes`);
        } catch (fileError) {
          console.error("Error saving audio file:", fileError);
          throw new Error(`Failed to save audio: ${fileError.message}`);
        }
        
        // Add user message to chat
        const userMessage = {
          id: Date.now().toString(),
          text: userInput,
          sender: 'user',
          timestamp: new Date().getTime(),
        };
        
        // Add AI response message to chat
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: typeof llmResponse === 'string' ? llmResponse : JSON.stringify(llmResponse),
          sender: 'ai',
          timestamp: new Date().getTime() + 1000,
        };
        
        // Update messages state with both messages
        setMessages(prevMessages => [...prevMessages, userMessage, aiMessage]);
        
        // Scroll to bottom after adding messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
        
        // Play audio response
        await playAudioResponse(fileUri);
      } else {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response format from speech2speech API");
      }
    } catch (error) {
      console.error('Error processing speech to speech:', error);
      
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        if (error.response?.status === 401) {
          Alert.alert('Session Expired', 'Please login again');
          return;
        }
      }
      
      Alert.alert('Error', 'Failed to process voice input. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioResponse = async (audioUri: string) => {
    try {
      console.log("Attempting to play audio from:", audioUri);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        console.error("Audio file does not exist:", audioUri);
        throw new Error("Audio file not found");
      }
      
      console.log(`Audio file exists, size: ${fileInfo.size} bytes`);
      
      // Unload any existing sound
      if (sound.current) {
        console.log("Unloading previous sound");
        try {
          await sound.current.unloadAsync();
        } catch (unloadError) {
          console.warn("Error unloading previous sound:", unloadError);
        }
        sound.current = null;
      }
      
      // Configure audio mode for playback
      await configureAudioMode(false);
      
      try {
        // Create and load the sound object first without auto-playing
        const soundObject = new Audio.Sound();
        await soundObject.loadAsync({ uri: audioUri });
        
        // Set playback status callback before playing
        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              console.log("Audio playback finished");
              // Cleanup when finished playing
              soundObject.unloadAsync().catch(e => console.warn("Error unloading sound:", e));
            }
          } else if (status.error) {
            console.error(`Playback error: ${status.error}`);
            Alert.alert('Playback Error', `Unable to play audio: ${status.error}`);
          }
        });
        
        // Store the sound object reference
        sound.current = soundObject;
        
        // Now start playing with volume ramped up
        console.log("Starting audio playback");
        await soundObject.setVolumeAsync(1.0);
        await soundObject.playAsync();
        console.log("Audio playback started successfully");
      } catch (audioError) {
        console.error("Error creating or playing sound:", audioError);
        
        // Fall back to native device Speech API
        Speech.speak("I'm sorry, I couldn't play the audio response. Let me try again.", {
          language: 'en',
          pitch: 1.0,
          rate: 0.9
        });
        
        throw audioError;
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
      Alert.alert('Playback Error', 'Unable to play the audio response. Try again or restart the app.');
    }
  };

  const handleSendText = async () => {
    if (inputText.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date().getTime(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      const textToSend = inputText;
      setInputText('');
      
      // Send message to LLM API
      await sendMessageToLLM(textToSend);
      
      // Scroll to bottom after update
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  };

  const sendMessageToLLM = async (message: string) => {
    setIsLoading(true);
    try {
      // Prepare headers with session ID if available
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      if (currentSessionId) {
        headers['session-id'] = currentSessionId;
      }
      
      // Call LLM API with message
      const response = await axios.post(`${BACKEND_URL}/llm`, {
        message: message
      }, { headers });
      
      const llmResponse = response.data.response;
      
      // Update session ID if returned
      if (response.data.sessionId && !currentSessionId) {
        setCurrentSessionId(response.data.sessionId);
      }
      
      // Add AI response to chat
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: llmResponse,
        sender: 'ai',
        timestamp: new Date().getTime() + 1000,
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // If speech is not muted, use TTS to read the response
      if (!isSpeechMuted) {
        await speakWithTTS(llmResponse);
      }
    } catch (error) {
      console.error('Error sending message to LLM:', error);
      
      // Enhanced error handling
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          Alert.alert('Session Expired', 'Please login again');
          return;
        }
      }
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your request. Please try again.",
        sender: 'ai',
        timestamp: new Date().getTime() + 1000,
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakWithTTS = async (text: string) => {
    try {
      console.log("Requesting TTS for text:", text.substring(0, 50) + "...");
      
      try {
        const response = await axios.post(`${BACKEND_URL}/tts`, {
          text: text,
          voice: 'alloy'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'arraybuffer'
        });
        
        console.log("Received TTS response, data length:", response.data.byteLength);
        
        // Convert binary data to base64
        const base64data = arrayBufferToBase64(response.data);
        
        // Generate a unique filename
        const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
        console.log("Saving TTS audio to:", fileUri);
        
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        // Play audio
        await playAudioResponse(fileUri);
      } catch (apiError) {
        console.error('Error with TTS API:', apiError);
        throw apiError; // Throw to trigger fallback
      }
    } catch (error) {
      console.error('Error using TTS, falling back to device TTS:', error);
      // Fall back to device TTS
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9
      });
    }
  };

  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    setInputHeight(Math.min(Math.max(50, height), 100));
  };

  // Update render message to handle Markdown
  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userBubble : styles.aiBubble
    ]}>
      {item.sender === 'user' ? (
        // User messages - just plain text
        <Text style={[
          styles.messageText,
          { color: item.sender === 'user' ? '#fff' : '#333' }
        ]}>
          {item.text}
        </Text>
      ) : (
        // AI messages - render Markdown
        <Markdown
          style={{
            body: {
              color: '#333',
              fontSize: 16,
            },
            heading1: {
              fontSize: 20,
              fontWeight: 'bold',
              marginTop: 8,
              marginBottom: 8,
              color: '#333',
            },
            heading2: {
              fontSize: 18, 
              fontWeight: 'bold',
              marginTop: 6,
              marginBottom: 6,
              color: '#333',
            },
            strong: {
              fontWeight: 'bold',
            },
            bullet_list: {
              marginTop: 4,
              marginBottom: 4,
            },
            ordered_list: {
              marginTop: 4,
              marginBottom: 4,
            },
            list_item: {
              marginTop: 2,
              marginBottom: 2,
              flexDirection: 'row',
            },
            code_block: {
              backgroundColor: '#f0f0f0',
              padding: 8,
              borderRadius: 4,
              marginVertical: 4,
            },
            code_inline: {
              backgroundColor: '#f0f0f0',
              padding: 2,
              borderRadius: 3,
            },
            blockquote: {
              backgroundColor: '#f7f7f7',
              borderLeftWidth: 4,
              borderLeftColor: '#cccccc',
              paddingLeft: 8,
              paddingVertical: 4,
              marginVertical: 4,
            }
          }}
        >
          {item.text}
        </Markdown>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parenting Companion</Text>
        <TouchableOpacity onPress={toggleSpeechMute} style={styles.muteButton}>
          <Ionicons
            name={isSpeechMuted ? "volume-mute" : "volume-medium"}
            size={24}
            color={isSpeechMuted ? "#888" : "#000000"}
          />
        </TouchableOpacity>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatText}>
            Ask me anything about parenting or child development
          </Text>
          <Text style={styles.emptyChatSubtext}>
            Type your question or tap the microphone to speak
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

      {isRecording && (
        <View style={styles.recordingContainer}>
          <SiriWaveView isActive={isRecording} amplitude={audioLevel} />
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { height: inputHeight }]}
            placeholder="Ask me anything..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendText}
            multiline={true}
            onContentSizeChange={handleContentSizeChange}
            editable={!isLoading}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.iconButton, isLoading ? styles.iconButtonDisabled : {}]} 
              onPress={toggleRecording}
              disabled={isLoading}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, isLoading ? styles.iconButtonDisabled : {}]} 
              onPress={handleSendText}
              disabled={isLoading || !inputText.trim()}
            >
              <Ionicons name="paper-plane" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
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
  muteButton: {
    marginLeft: 'auto',
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
    backgroundColor: '#000000',
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
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 30,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'center',
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
  recordingContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  siriWaveContainer: {
    width: 280,
    height: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  siriWaveLine: {
    borderRadius: 50,
  },
  iconButton: {
    backgroundColor: '#000000',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
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
    marginBottom: 8,
  },
  emptyChatSubtext: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: '#000000',
    fontSize: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButtonDisabled: {
    backgroundColor: '#888888',
  },
});

export default Chat2Screen;