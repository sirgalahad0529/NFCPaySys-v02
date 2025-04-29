import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Initialize NFC
import { initNfcManager } from './src/utils/nfc-manager';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import NFCScanScreen from './src/screens/NFCScanScreen';
import CustomerDetailsScreen from './src/screens/CustomerDetailsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ReloadAccountScreen from './src/screens/ReloadAccountScreen'; 
import SettingsScreen from './src/screens/SettingsScreen';
import ApiSettingsScreen from './src/screens/ApiSettingsScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import CustomerRegistrationScreen from './src/screens/CustomerRegistrationScreen';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main tab navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Scan') {
          iconName = focused ? 'scan-circle' : 'scan-circle-outline';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'settings' : 'settings-outline';
        } else if (route.name === 'History') {
          iconName = focused ? 'list' : 'list-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Scan" component={NFCScanScreen} />
    <Tab.Screen name="History" component={TransactionHistoryScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

// Main app component
export default function App() {
  const [isNfcInitialized, setIsNfcInitialized] = useState(false);

  // Initialize NFC when app loads
  useEffect(() => {
    const initNfc = async () => {
      const nfcSupported = await initNfcManager();
      setIsNfcInitialized(nfcSupported);
      console.log('NFC initialized:', nfcSupported);
    };

    initNfc();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="CustomerDetails" 
            component={CustomerDetailsScreen} 
            options={{ title: 'Customer Details' }} 
          />
          <Stack.Screen 
            name="Payment" 
            component={PaymentScreen} 
            options={{ title: 'Make Payment' }} 
          />
          <Stack.Screen 
            name="ReloadAccount" 
            component={ReloadAccountScreen} 
            options={{ title: 'Reload Account' }} 
          />
          <Stack.Screen 
            name="ApiSettings" 
            component={ApiSettingsScreen} 
            options={{ title: 'API Settings' }} 
          />
          <Stack.Screen 
            name="CustomerRegistration" 
            component={CustomerRegistrationScreen} 
            options={{ title: 'Register Customer' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}