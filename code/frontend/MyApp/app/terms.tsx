import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TermsAndPoliciesScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Policies</Text>
      </View>
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>1. User Accounts</Text>
          <Text style={styles.sectionText}>
            You are solely responsible for maintaining the confidentiality of your account credentials. 
            We reserve the right to suspend or terminate any account at our discretion if breaches occur.
          </Text>

          <Text style={styles.sectionTitle}>2. Privacy</Text>
          <Text style={styles.sectionText}>
            We gather limited personal information as stated in our Privacy Policy. Your data is kept secure and is never sold to third parties.
          </Text>

          <Text style={styles.sectionTitle}>3. User Content</Text>
          <Text style={styles.sectionText}>
            While you retain ownership of content you post, you grant us the right to display, modify, and share it within the app. 
            Prohibited content includes anything illegal, harmful, or infringing.
          </Text>

          <Text style={styles.sectionTitle}>4. Liability Limitations</Text>
          <Text style={styles.sectionText}>
            Our service is provided on an "as-is" basis, without guarantees. We assume no liability for direct or indirect damages 
            resulting from use or inability to use the service.
          </Text>

          <Text style={styles.sectionTitle}>5. Updates to Terms</Text>
          <Text style={styles.sectionText}>
            We may revise these terms at any time. Continued use of the service indicates acceptance of any modifications.
          </Text>

          <Text style={styles.sectionTitle}>6. Governing Law</Text>
          <Text style={styles.sectionText}>
            These terms are governed by Indian law. All legal disputes must be resolved in the courts of India.
          </Text>

          <Text style={styles.sectionTitle}>7. Contact Us</Text>
          <Text style={styles.sectionText}>
            Please direct any inquiries about these terms to: adityagauraa@gmail.com
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default TermsAndPoliciesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  contentContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
});
