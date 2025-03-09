import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const VoiceChatScreen = () => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("Tap the mic and ask me anything...");
  const [recording, setRecording] = useState(null);
  
  // Create an array of animation values for the Siri-like waveform bars
  const numBars = 10;
  const barAnimations = useRef(
    Array.from({ length: numBars }, () => new Animated.Value(0.1))
  ).current;
  
  const micScale = useRef(new Animated.Value(1)).current;
  const micRingOpacity = useRef(new Animated.Value(0)).current;
  
  // Function to animate the waveform bars in a Siri-like pattern
  const animateWaveform = () => {
    if (!isListening) return;
    
    // Generate random heights for each bar (in a real app, this would be based on audio input)
    const animations = barAnimations.map((anim, index) => {
      const randomHeight = Math.random() * 0.9 + 0.1; // Between 0.1 and 1.0
      
      return Animated.timing(anim, {
        toValue: randomHeight,
        duration: 120 + Math.random() * 200, // Varied animation speed
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });
    
    // Run animations in sequence and loop
    Animated.stagger(50, animations).start(() => {
      if (isListening) {
        animateWaveform();
      }
    });
  };
  
  // Start/stop waveform animation based on isListening state
  useEffect(() => {
    if (isListening) {
      animateWaveform();
      
      // Simulate speech recognition (in a real app, use a speech recognition API)
      const simulatedSpeechInterval = setInterval(() => {
        const phrases = [
          "How do I handle tantrums?",
          "What are good activities for a 3 year old?",
          "How to teach my child sharing?",
          "How to teach my child moral values?"
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        setSpokenText(randomPhrase);
      }, 3000);
      
      return () => clearInterval(simulatedSpeechInterval);
    } else {
      // Reset bar animations when not listening
      barAnimations.forEach(anim => anim.setValue(0.1));
    }
  }, [isListening]);
  
  // Handle recording start/stop
  const toggleRecording = async () => {
    if (!recording) {
      setIsListening(true);
      setSpokenText("Listening...");
      
      // Animate mic button
      Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(micScale, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Animate the ring around mic button
      Animated.loop(
        Animated.sequence([
          Animated.timing(micRingOpacity, {
            toValue: 0.7,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(micRingOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      try {
        // Request permissions
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        // Start recording
        const { recording } = await Audio.Recording.createAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );
        setRecording(recording);
      } catch (err) {
        console.error('Failed to start recording', err);
        setIsListening(false);
      }
    } else {
      // Stop recording
      setIsListening(false);
      
      // Stop animations
      micScale.stopAnimation();
      micRingOpacity.stopAnimation();
      micScale.setValue(1);
      micRingOpacity.setValue(0);
      
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        
        // In a real app, you would send the audio to a speech recognition API
        // and then process the response. For now, we'll just simulate a response.
        setTimeout(() => {
          const responses = [
            "I recommend staying calm and acknowledging their feelings while setting firm boundaries.",
            "Reading together, building blocks, and simple puzzles are great for developing fine motor skills.",
            "You can teach sharing through playdates and modeling sharing behavior yourself."
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          setSpokenText(randomResponse);
        }, 1000);
        
      } catch (err) {
        console.error('Failed to stop recording', err);
      }
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Assistant</Text>
      </View>
      
      <View style={styles.content}>
        {/* Status text */}
        <Text style={styles.statusText}>
          {isListening ? "Listening..." : "Tap mic to start"}
        </Text>
        
        {/* Main content area with spoken text */}
        <View style={styles.mainContent}>
          <Text style={styles.spokenText}>{spokenText}</Text>
        </View>
        
        {/* Siri-like waveform */}
        <View style={styles.waveformContainer}>
          {barAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 60]
                  }),
                  backgroundColor: isListening ? 
                    `hsl(${index * (360 / numBars)}, 70%, 60%)` : 
                    '#C0C0C0'
                }
              ]}
            />
          ))}
        </View>
        
        {/* Mic button */}
        <View style={styles.micContainer}>
          <Animated.View
            style={[
              styles.micRing,
              {
                opacity: micRingOpacity,
                transform: [{ scale: micScale }],
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.micButton, recording && styles.micButtonActive]}
            onPress={toggleRecording}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{ scale: micScale }],
              }}
            >
              <Ionicons 
                name="mic" 
                size={24} 
                color="white" 
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  spokenText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    width: '100%',
    marginVertical: 30,
  },
  waveformBar: {
    width: 5,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  micContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  micRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(20, 40, 80, 0.2)',
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
    backgroundColor: '#FF2D55', // Siri-like color when active
  }
});

export default VoiceChatScreen;
