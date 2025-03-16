import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../config/environment';

const MySubscriptionScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    type: 'free', // 'free' or 'premium'
    expiryDate: null, // for premium subscription
    autoRenew: true
  });

  useEffect(() => {
    // Fetch subscription information
    const fetchSubscription = async () => {
      try {
        // First, try to get the user data from AsyncStorage
        const userData = await AsyncStorage.getItem('user');
        let userSubscriptionType = 'free';
        
        if (userData) {
          const user = JSON.parse(userData);
          // Get the basic subscription type from user
          if (user.subscriptionType) {
            userSubscriptionType = user.subscriptionType;
          }
        }
        
        // Get auth token for API call
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          try {
            // Always fetch detailed subscription info from dedicated endpoint
            const response = await axios.get(`${BACKEND_URL}/api/users/get-subscription`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.subscription) {
              setSubscription(response.data.subscription);
            } else {
              // If API doesn't return subscription data, use basic info from user
              setSubscription({ 
                type: userSubscriptionType, 
                expiryDate: null, 
                autoRenew: true 
              });
            }
          } catch (apiError) {
            console.error('API call failed:', apiError);
            setSubscription({ 
              type: userSubscriptionType, 
              expiryDate: null, 
              autoRenew: true 
            });
          }
        } else {
          // No token, use default free subscription
          setSubscription({ type: 'free', expiryDate: null, autoRenew: true });
        }
      } catch (error) {
        console.error('Failed to load subscription data:', error);
        // Default to free subscription on errors
        setSubscription({ type: 'free', expiryDate: null, autoRenew: true });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscription();
  }, []);

  const handleUpgrade = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Upgrade to Premium',
      'You will be charged ₹250 per month. Proceed to payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: async () => {
            setIsLoading(true);
            try {
              // Get the auth token
              const token = await AsyncStorage.getItem('authToken');
              if (!token) {
                Alert.alert('Error', 'You need to be logged in to upgrade.');
                router.push('/login');
                return;
              }
              
              // Update subscription through API
              const response = await axios.post(
                `${BACKEND_URL}/api/users/update-subscription`,
                {
                  type: 'premium',
                  autoRenew: true,
                  paymentMethod: {
                    cardType: 'Visa',
                    lastFourDigits: '1234'
                  }
                },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              // Update local state
              setSubscription(response.data.subscription);
              
              // Save to local storage as backup
              await AsyncStorage.setItem('subscription', JSON.stringify(response.data.subscription));
              
              Alert.alert('Success', 'You are now subscribed to the Premium plan!');
            } catch (error) {
              console.error('Failed to upgrade subscription:', error);
              Alert.alert('Error', 'Failed to process your payment. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleAutoRenewal = async () => {
    try {
      setIsLoading(true);
      
      // Get the auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to change this setting.');
        return;
      }
      
      // Toggle auto-renewal via API
      const response = await axios.post(
        `${BACKEND_URL}/api/users/update-subscription`,
        {
          autoRenew: !subscription.autoRenew
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setSubscription(response.data.subscription);
      
      // Save to local storage as backup
      await AsyncStorage.setItem('subscription', JSON.stringify(response.data.subscription));
      
      Alert.alert(
        'Auto-Renewal ' + (response.data.subscription.autoRenew ? 'Enabled' : 'Disabled'),
        response.data.subscription.autoRenew 
          ? 'Your subscription will automatically renew when it expires.' 
          : 'Your subscription will expire on the end date.'
      );
    } catch (error) {
      console.error('Failed to toggle auto-renewal:', error);
      Alert.alert('Error', 'Failed to update auto-renewal setting.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription? You will still have access until the expiry date.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Get the auth token
              const token = await AsyncStorage.getItem('authToken');
              if (!token) {
                Alert.alert('Error', 'You need to be logged in to cancel your subscription.');
                return;
              }
              
              // Cancel subscription via API
              const response = await axios.post(
                `${BACKEND_URL}/api/users/update-subscription`,
                {
                  type: 'free'
                },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              // Update local state
              setSubscription(response.data.subscription);
              
              // Save to local storage as backup
              await AsyncStorage.setItem('subscription', JSON.stringify(response.data.subscription));
              
              Alert.alert('Cancelled', 'Your premium subscription has been cancelled.');
            } catch (error) {
              console.error('Failed to cancel subscription:', error);
              Alert.alert('Error', 'Failed to cancel your subscription.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Current Plan Banner */}
        <View style={[
          styles.currentPlanBanner, 
          subscription.type === 'premium' ? styles.premiumBanner : styles.freeBanner
        ]}>
          <View style={styles.planTitleContainer}>
            <Text style={styles.currentPlanText}>Current Plan:</Text>
            <Text style={styles.planName}>
              {subscription.type === 'premium' ? 'Premium' : 'Free'}
            </Text>
          </View>
          
          {subscription.type === 'premium' && (
            <View style={styles.expiryContainer}>
              <Text style={styles.expiryLabel}>Expires on:</Text>
              <Text style={styles.expiryDate}>
                {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
              </Text>
              <Text style={styles.renewalStatus}>
                {subscription.autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'}
              </Text>
            </View>
          )}
        </View>

        {/* Plans Comparison */}
        <View style={styles.comparisonContainer}>
          <Text style={styles.sectionTitle}>Plans Comparison</Text>
          
          <View style={styles.planRow}>
            <View style={styles.featureColumn}>
              <Text style={styles.featureTitle}>Feature</Text>
              <Text style={styles.feature}>Basic Features</Text>
              <Text style={styles.feature}>Content Storage</Text>
              <Text style={styles.feature}>Content Recommendations</Text>
              <Text style={styles.feature}>Offline Access</Text>
              <Text style={styles.feature}>Ad-Free Experience</Text>
              <Text style={styles.feature}>Priority Support</Text>
            </View>
            
            <View style={styles.planColumn}>
              <Text style={styles.planTitle}>Free</Text>
              <Text style={styles.included}><Ionicons name="checkmark" size={16} color="green" /></Text>
              <Text style={styles.value}>Limited</Text>
              <Text style={styles.included}><Ionicons name="checkmark" size={16} color="green" /></Text>
              <Text style={styles.notIncluded}><Ionicons name="close" size={16} color="red" /></Text>
              <Text style={styles.notIncluded}><Ionicons name="close" size={16} color="red" /></Text>
              <Text style={styles.notIncluded}><Ionicons name="close" size={16} color="red" /></Text>
            </View>
            
            <View style={styles.planColumn}>
              <Text style={styles.planTitle}>Premium</Text>
              <Text style={styles.included}><Ionicons name="checkmark" size={16} color="green" /></Text>
              <Text style={styles.value}>Unlimited</Text>
              <Text style={styles.included}><Ionicons name="checkmark" size={16} color="green" /></Text>
              <Text style={styles.included}><Ionicons name="checkmark" size={16} color="green" /></Text>
              <Text style={styles.included}><Ionicons name="checkmark" size={16} color="green" /></Text>
              <Text style={styles.included}><Ionicons name="checkmark" size={16} color="green" /></Text>
            </View>
          </View>
        </View>

        {/* Price information */}
        <View style={styles.priceContainer}>
          <View style={styles.priceTierContainer}>
            <Text style={styles.tierName}>Free</Text>
            <Text style={styles.price}>₹0</Text>
            <Text style={styles.period}>forever</Text>
          </View>
          
          <View style={styles.priceTierContainer}>
            <Text style={styles.tierName}>Premium</Text>
            <Text style={styles.price}>₹250</Text>
            <Text style={styles.period}>per month</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {subscription.type === 'free' ? (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.premiumActionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={toggleAutoRenewal}
            >
              <Text style={styles.actionButtonText}>
                {subscription.autoRenew ? 'Disable Auto-Renewal' : 'Enable Auto-Renewal'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={cancelSubscription}
            >
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Payment Methods section for Premium users */}
        {subscription.type === 'premium' && (
          <View style={styles.paymentMethodsContainer}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethod}>
              <MaterialIcons name="credit-card" size={24} color="#333" />
              <Text style={styles.paymentMethodText}>•••• •••• •••• 1234</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  currentPlanBanner: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  freeBanner: {
    backgroundColor: '#f0f0f0',
  },
  premiumBanner: {
    backgroundColor: '#f5f5dc', // beige color
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expiryContainer: {
    marginTop: 8,
  },
  expiryLabel: {
    fontSize: 14,
    color: '#666',
  },
  expiryDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  renewalStatus: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  comparisonContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  planRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  featureColumn: {
    flex: 2,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  planColumn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  featureTitle: {
    fontWeight: '600',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  planTitle: {
    fontWeight: '600',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  feature: {
    paddingVertical: 6,
  },
  included: {
    paddingVertical: 6,
  },
  notIncluded: {
    paddingVertical: 6,
    color: '#999',
  },
  value: {
    paddingVertical: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
  },
  priceTierContainer: {
    alignItems: 'center',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '500',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  period: {
    fontSize: 14,
    color: '#666',
  },
  upgradeButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumActionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  cancelButtonText: {
    color: '#cc0000',
    fontSize: 16,
    fontWeight: '500',
  },
  paymentMethodsContainer: {
    margin: 16,
    marginTop: 0,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  paymentMethodText: {
    marginLeft: 12,
    fontSize: 16,
  },
});

export default MySubscriptionScreen;
