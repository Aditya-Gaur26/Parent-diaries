import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { Asset } from 'react-native-image-picker';

// havent implemented its backend yet

const PrescriptionUploadScreen = () => {
  
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);

  const openCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });
    
    if (!result.didCancel && result.assets) {
      setSelectedImage(result.assets[0]);
    }
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    
    if (!result.didCancel && result.assets) {
      setSelectedImage(result.assets[0]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <View style={styles.header}>
        <Icon name="menu-outline" size={24} color="#000" />
        <Text style={styles.headerTitle}>OCR</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Upload a photo of your prescription</Text>
        
        <View style={styles.infoContainer}>
          <Icon name="information-circle-outline" size={20} color="#000" />
          <Text style={styles.infoText}>
            Regulations require you to upload a certified prescription. Don't worry, your data will stay safe and private.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.uploadBox} 
          onPress={openGallery}
        >
          {selectedImage ? (
            <Image 
              source={{ uri: selectedImage.uri }} 
              style={styles.previewImage} 
            />
          ) : (
            <>
              <View style={styles.placeholderIcon}>
                <Icon name="image-outline" size={24} color="#999" />
              </View>
              <Text style={styles.uploadText}>Select file</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.orText}>or</Text>

        <TouchableOpacity 
          style={styles.cameraButton} 
          onPress={openCamera}
        >
          <Icon name="camera-outline" size={20} color="#00BFA5" />
          <Text style={styles.cameraButtonText}>Open Camera & Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.submitButton}
          disabled={!selectedImage}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingRight: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  uploadBox: {
    height: 160,
    borderWidth: 2,
    borderColor: '#00BFA5',
    borderRadius: 12,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadText: {
    color: '#999999',
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  orText: {
    textAlign: 'center',
    color: '#666666',
    marginVertical: 16,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  cameraButtonText: {
    color: '#00BFA5',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PrescriptionUploadScreen;