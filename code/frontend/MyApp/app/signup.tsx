import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SignUpScreen = () => {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('@/assets/images/sparkles.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Wave Diaries for a better{'\n'}
            parenting experience
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={() => router.push('/homeScreen')}
          >
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
              style={styles.googleIcon}
            />
            <Text style={styles.buttonText}>Sign up with Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.emailButton}
            onPress={() => router.push('/email-signup')}
          >
            <Ionicons name="mail-outline" size={20} color="black" />
            <Text style={styles.buttonText}>Sign up with Email</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.linkText} onPress={() => router.push('/login')}>Log in</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '1E1E1E', // Changed from '#1E1E1E' to white to match other screens
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white', // Changed from '#F5F7FF' to white for full coverage
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    flex: 1, // Added to ensure it takes full height
  },
  illustrationContainer: {
    marginVertical: 20,
    height: 280, // Increased from 150 to 280
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Added to ensure full width
  },
  illustration: {
    width: 280, // Increased from 180 to 280
    height: 230, // Increased from 120 to 230
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
