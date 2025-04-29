import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getApiUrl, saveApiUrl, checkApiUrl } from '../api/api-settings';
import { checkApiStatus, saveAndVerifyApiUrl } from '../api/api';

export default function ApiSettingsScreen() {
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [apiVersion, setApiVersion] = useState(null);
  
  // Load saved API URL when component mounts
  useEffect(() => {
    loadApiUrl();
  }, []);
  
  // Load API URL from storage
  const loadApiUrl = async () => {
    setIsLoading(true);
    try {
      const url = await getApiUrl();
      setApiUrl(url);
    } catch (error) {
      console.error('Failed to load API URL:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save API URL to storage
  const handleSave = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid API URL');
      return;
    }
    
    setIsLoading(true);
    try {
      const saved = await saveApiUrl(apiUrl);
      
      if (saved) {
        Alert.alert('Success', 'API URL saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save API URL');
      }
    } catch (error) {
      console.error('Failed to save API URL:', error);
      Alert.alert('Error', 'Failed to save API URL: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test API connection
  const handleTest = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid API URL');
      return;
    }
    
    setIsTesting(true);
    setConnectionStatus(null);
    setApiVersion(null);
    
    try {
      // First check if URL is reachable
      const isReachable = await checkApiUrl(apiUrl);
      
      if (!isReachable) {
        setConnectionStatus(false);
        Alert.alert('Connection Failed', 'Could not connect to the API. Please check the URL and network connection.');
        return;
      }
      
      // Then check API status for version info
      const status = await checkApiStatus();
      setConnectionStatus(status.online);
      setApiVersion(status.version);
      
      if (status.online) {
        Alert.alert('Connection Successful', `Connected to API version ${status.version}`);
      } else {
        Alert.alert('Connection Failed', 'Could not verify API status');
      }
    } catch (error) {
      console.error('Failed to test API connection:', error);
      setConnectionStatus(false);
      Alert.alert('Error', 'Failed to test API connection: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };
  
  // Handle reset to default URL
  const handleReset = () => {
    Alert.alert(
      'Reset to Default',
      'Are you sure you want to reset to the default API URL?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Use default URL from api-settings
              await loadApiUrl();
              Alert.alert('Success', 'Reset to default API URL');
            } catch (error) {
              console.error('Failed to reset API URL:', error);
              Alert.alert('Error', 'Failed to reset API URL');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>API Server Configuration</Text>
          
          <Text style={styles.label}>API Server URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="Enter API URL (e.g., http://192.168.1.100:5000/api)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isLoading}
          />
          
          <Text style={styles.hint}>
            Enter the full URL to your API server, including the protocol (http/https) and /api path
          </Text>
          
          {connectionStatus !== null && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Connection Status:</Text>
              <Text
                style={[
                  styles.statusValue,
                  connectionStatus ? styles.statusSuccess : styles.statusError,
                ]}
              >
                {connectionStatus ? 'Connected' : 'Disconnected'}
              </Text>
              
              {apiVersion && (
                <>
                  <Text style={styles.statusLabel}>API Version:</Text>
                  <Text style={styles.statusValue}>{apiVersion}</Text>
                </>
              )}
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading || isTesting}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTest}
              disabled={isLoading || isTesting}
            >
              {isTesting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Test Connection</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            disabled={isLoading || isTesting}
          >
            <Text style={styles.buttonText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 5,
  },
  hint: {
    fontSize: 14,
    color: '#777',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginRight: 10,
  },
  testButton: {
    backgroundColor: '#34C759',
    flex: 1,
    marginLeft: 10,
  },
  resetButton: {
    backgroundColor: '#FF9500',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusSuccess: {
    color: '#34C759',
  },
  statusError: {
    color: '#FF3B30',
  },
});