import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Custom simplified wave animation without problematic easing functions
const SiriWaveView = ({ isActive, amplitude = 0 }: { isActive: boolean; amplitude: number }) => {
  // Create 12 bars for a smooth wave effect
  const numBars = 12;
  const animations = [...Array(numBars)].map(() => useRef(new Animated.Value(0)).current);
  const [colors] = useState<string[]>(Array(numBars).fill('#4287f5'));
  
  useEffect(() => {
    let animationSubscriptions: any[] = [];
    
    if (isActive) {
      // Create fluid wave effect with varying heights and timing
      animations.forEach((anim, index) => {
        const createAnimation = () => {
          // Calculate bar position from center (0-1)
          const distanceFromCenter = Math.abs((index - (numBars - 1) / 2) / ((numBars - 1) / 2));
          
          // Generate values for natural movement
          const baseAmplitude = Math.max(0.2, amplitude);
          const randomFactor = 0.7 + Math.random() * 0.3;
          const positionFactor = 1 - (distanceFromCenter * 0.5);
          
          // Calculate heights
          const maxHeight = baseAmplitude * randomFactor * positionFactor;
          const minHeight = maxHeight * 0.3 * randomFactor;
          
          // Durations
          const upDuration = 600 + (index * 30) + Math.random() * 200;
          const downDuration = 700 + (index * 30) + Math.random() * 200;
          
          const animationSequence = Animated.sequence([
            Animated.timing(anim, {
              toValue: maxHeight,
              duration: upDuration,
              // Remove problematic easing function
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: minHeight,
              duration: downDuration,
              // Remove problematic easing function
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
        
        // Stagger animation starts
        setTimeout(() => createAnimation(), index * 50);
      });
    } else {
      // Reset animations when inactive
      animations.forEach((anim) => {
        const subscription = Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          // Remove problematic easing function
          useNativeDriver: false,
        }).start();
        animationSubscriptions.push(subscription);
      });
    }
    
    return () => {
      // Clean up animations
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

const AudioRecorderScreen = () => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Tap mic to start recording");
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [recordingObject, setRecordingObject] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingDurationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to add debug info
  const addDebugInfo = (message: string) => {
    console.log(message); // Also log to console
    setDebugInfo(prev => `${message}\n${prev}`);
  };

  useEffect(() => {
    let isMounted = true;
    
    // Set up audio with proper configuration
    const setupAudio = async () => {
      try {
        addDebugInfo(`Setting up audio for ${Platform.OS}...`);
        
        // Configure audio mode for optimal recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        
        // Fix permissions check to avoid TypeError
        try {
          const permissionResponse = await Audio.getPermissionsAsync();
          addDebugInfo(`Audio permission status: ${permissionResponse.status}`);
          
          // Add device info for debugging
          addDebugInfo(`Device: ${Platform.OS} ${Platform.Version}`);
        } catch (permErr) {
          addDebugInfo(`Error checking permissions: ${String(permErr)}`);
        }
        
        // Request permissions
        const { status } = await Audio.requestPermissionsAsync();
        addDebugInfo(`Permission status: ${status}`);
        
        if (!isMounted) return;
        
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Audio recording permission is required for this feature.'
          );
        }
      } catch (error) {
        console.error('Error in setupAudio:', error);
        addDebugInfo(`Error setting up audio: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      
      // Clean up timers
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current);
      }
      
      // Clean up recording and sound
      if (recordingObject) {
        try {
          recordingObject.stopAndUnloadAsync();
        } catch (error) {
          console.error("Error cleaning up recording:", error);
        }
      }
      
      if (sound) {
        sound.unloadAsync();
      }
      
      clearAnimationInterval();
    };
  }, []);

  const clearAnimationInterval = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required.'
        );
        return;
      }
      
      // Clean up any existing recording first
      if (recordingObject) {
        await recordingObject.stopAndUnloadAsync();
        setRecordingObject(null);
      }
      
      // Clean up timing counter
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current);
      }
      
      // Reset duration counter and start it
      setRecordingDuration(0);
      
      // Re-initialize audio session before recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      addDebugInfo("Creating new recording...");
      
      // Create recording with enhanced options for troubleshooting
      const recording = new Audio.Recording();
      
      // Use high quality preset with specific settings for better recording
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          audioEncoder: 3, // AAC
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          audioQuality: Audio.IOSAudioQuality.HIGH,
        }
      });
      
      // Add status update listener with improved logging
      recording.setOnRecordingStatusUpdate((status: any) => {
        if (status.isRecording) {
          // Update audio level for visualization
          if (status.metering !== undefined && !isNaN(status.metering)) {
            const normalizedMeter = Math.max(0, Math.min(1, (status.metering + 160) / 160));
            setAudioLevel(normalizedMeter);
            
            // Log sound level periodically (every 2 seconds)
            if (Math.floor(status.durationMillis / 2000) !== Math.floor((status.durationMillis - 500) / 2000)) {
              addDebugInfo(`Audio level: ${status.metering.toFixed(2)} dB (${normalizedMeter.toFixed(2)})`);
            }
          }
        }
      });
      
      addDebugInfo("Starting recording...");
      await recording.startAsync();
      addDebugInfo("Recording started successfully");
      
      // Start a timer to track recording duration
      recordingDurationRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      setRecordingObject(recording);
      setIsRecording(true);
      setRecordingStatus("Recording in progress...");
      
      // Animation for audio level visualization
      clearAnimationInterval();
      animationIntervalRef.current = setInterval(() => {
        const level = Math.random() * 0.7 + 0.3;
        setAudioLevel(level);
      }, 300);
    } catch (error) {
      console.error('Error starting recording:', error);
      addDebugInfo(`Recording error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert(
        'Recording Error',
        `Failed to start audio recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const stopRecording = async () => {
    try {
      // Stop duration timer
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current);
        recordingDurationRef.current = null;
      }
      
      if (recordingObject) {
        clearAnimationInterval();
        
        addDebugInfo("Stopping recording...");
        await recordingObject.stopAndUnloadAsync();
        addDebugInfo("Recording stopped");
        
        // Get recording URI
        const uri = recordingObject.getURI();
        addDebugInfo(`Recording URI: ${uri}`);
        
        if (!uri) {
          throw new Error("Recording URI is null");
        }
        
        // Check if file exists and get size
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            addDebugInfo(`File exists: ${fileInfo.exists}, Size: ${fileInfo.size} bytes`);
          } else {
            addDebugInfo(`File does not exist`);
          }
          
          if (fileInfo.exists && fileInfo.size < 1000) {
            addDebugInfo("WARNING: File size is very small, may not contain audio");
          }
        } catch (e) {
          addDebugInfo(`Error checking file: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        setRecordingUri(uri);
        setRecordingStatus(`Recording complete (${recordingDuration}s). Tap Play to listen.`);
        
        // Unload previous sound if it exists
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
        }
        
        // Configure audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        
        console.log("Recording is available at temporary URI:", uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      addDebugInfo(`Stop error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRecording(false);
      setAudioLevel(0);
      setRecordingObject(null);
      clearAnimationInterval();
    }
  };

  const playRecording = async () => {
    try {
      if (!recordingUri) {
        Alert.alert('Error', 'No recording available to play');
        return;
      }
      
      addDebugInfo("Preparing to play recording...");
      
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      // Load sound with volume at maximum
      if (!sound) {
        addDebugInfo(`Loading sound from: ${recordingUri}`);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true, volume: 1.0 }
        );
        
        setSound(newSound);
        setIsPlaying(true);
        
        // Enhanced playback status updates with logging
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            // Log playback position periodically
            if (status.positionMillis % 1000 < 100 && status.positionMillis > 0) {
              addDebugInfo(`Playback at: ${(status.positionMillis/1000).toFixed(1)}s`);
            }
            
            if (!status.isPlaying && status.didJustFinish) {
              addDebugInfo("Playback finished");
              setIsPlaying(false);
            }
          }
        });
      } else {
        // Play existing sound
        addDebugInfo("Playing existing sound");
        await sound.setVolumeAsync(1.0); // Ensure volume is at maximum
        await sound.playFromPositionAsync(0); // Play from beginning
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play the recording');
      addDebugInfo(`Playback error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const stopPlayback = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with a back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audio Recorder</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.recordingStatusText}>
          {recordingStatus}
        </Text>
        
        {/* Wave visualization */}
        <View style={styles.waveContainer}>
          <SiriWaveView 
            isActive={isRecording || isPlaying} 
            amplitude={audioLevel}
          />
        </View>
        
        {/* Status text with duration */}
        <Text style={styles.statusText}>
          {isRecording ? `Recording... ${recordingDuration}s` : 
           recordingUri ? "Ready to play" : "Ready to record"}
        </Text>
        
        {/* Control buttons container */}
        <View style={styles.controlsContainer}>
          {/* Record button */}
          <TouchableOpacity
            style={[styles.micButton, isRecording ? styles.micButtonActive : {}]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.7}
            disabled={isPlaying}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
          </TouchableOpacity>
          
          {/* Play button (only show if we have a recording) */}
          {recordingUri && !isRecording && (
            <TouchableOpacity
              style={[styles.playButton, isPlaying ? styles.playButtonActive : {}]}
              onPress={isPlaying ? stopPlayback : playRecording}
              activeOpacity={0.7}
            >
              <Ionicons name={isPlaying ? "stop" : "play"} size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Expanded debug section */}
        <ScrollView style={styles.debugScrollView}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6e6e6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  recordingStatusText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  waveContainer: {
    width: 200,
    height: 100,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  waveLine: {
    width: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 20,
  },
  micContainer: {
    marginTop: 30,
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#142850',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#cc0000',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#228B22',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playButtonActive: {
    backgroundColor: '#FF8C00',
  },
  debugScrollView: {
    marginTop: 20,
    maxHeight: 150,
    width: '95%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 5,
    padding: 10,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
});

export default AudioRecorderScreen;