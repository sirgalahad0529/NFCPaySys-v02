import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '../api/api';
import { readNfcTag, cleanupNfcManager, registerTagEvent } from '../utils/nfc-manager';
import { formatCardId } from '../utils/formatters';

export default function NFCScanScreen({ navigation }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup NFC when screen is unfocused
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isScanning) {
          stopScan();
        }
      };
    }, [isScanning])
  );

  // Stop scanning when component unmounts
  useEffect(() => {
    return () => {
      cleanupNfcManager();
    };
  }, []);

  // Start NFC scanning
  const startScan = async () => {
    setIsScanning(true);
    setError('');
    setCardId('');

    try {
      // Register for tag events
      const cleanupListener = await registerTagEvent(handleTagDetected);
      
      // Return cleanup function
      return cleanupListener;
    } catch (error) {
      console.error('Error starting scan:', error);
      setError('Failed to start NFC scan. Please try again.');
      setIsScanning(false);
    }
  };

  // Stop NFC scanning
  const stopScan = () => {
    cleanupNfcManager();
    setIsScanning(false);
  };

  // Handle NFC tag detection
  const handleTagDetected = async (detectedCardId) => {
    if (!detectedCardId) {
      setError('Invalid card. Please try again.');
      return;
    }
    
    setCardId(detectedCardId);
    setIsProcessing(true);
    
    try {
      // Look up customer by card ID
      const customer = await customerAPI.getByCardId(detectedCardId);
      
      // Stop scanning
      stopScan();
      
      if (customer) {
        // Navigate to customer details
        navigation.navigate('CustomerDetails', { customer });
      } else {
        // No customer found for this card
        Alert.alert(
          'Customer Not Found',
          'No customer is associated with this card. Would you like to register a new customer?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Register',
              onPress: () => {
                navigation.navigate('CustomerRegistration', { cardId: detectedCardId });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error looking up customer:', error);
      setError('Failed to look up customer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual card entry
  const handleManualEntry = () => {
    Alert.prompt(
      'Manual Card Entry',
      'Enter the card ID:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Look Up',
          onPress: async (manualCardId) => {
            if (!manualCardId) return;
            
            setCardId(manualCardId);
            setIsProcessing(true);
            
            try {
              // Look up customer by card ID
              const customer = await customerAPI.getByCardId(manualCardId);
              
              if (customer) {
                // Navigate to customer details
                navigation.navigate('CustomerDetails', { customer });
              } else {
                // No customer found for this card
                Alert.alert(
                  'Customer Not Found',
                  'No customer is associated with this card. Would you like to register a new customer?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Register',
                      onPress: () => {
                        navigation.navigate('CustomerRegistration', { cardId: manualCardId });
                      },
                    },
                  ]
                );
              }
            } catch (error) {
              console.error('Error looking up customer:', error);
              setError('Failed to look up customer. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.nfcIconContainer}>
        {isScanning ? (
          <View style={styles.scanningContainer}>
            <Ionicons name="scan-circle" size={150} color="#007AFF" />
            <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
          </View>
        ) : (
          <Ionicons name="scan-circle-outline" size={150} color="#888" />
        )}
      </View>
      
      <Text style={styles.instruction}>
        {isScanning
          ? 'Scanning for NFC Card...\nHold card near the back of your device'
          : 'Tap "Start Scan" to begin scanning for NFC cards'}
      </Text>
      
      {cardId ? (
        <View style={styles.cardContainer}>
          <Text style={styles.cardLabel}>Card ID:</Text>
          <Text style={styles.cardId}>{formatCardId(cardId)}</Text>
        </View>
      ) : null}
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <View style={styles.buttonContainer}>
        {isScanning ? (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopScan}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>Stop Scan</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startScan}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>Start Scan</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.manualButton]}
          onPress={handleManualEntry}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Manual Entry</Text>
        </TouchableOpacity>
      </View>
      
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  nfcIconContainer: {
    marginBottom: 30,
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  cardContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  cardId: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  manualButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#007AFF',
  },
});