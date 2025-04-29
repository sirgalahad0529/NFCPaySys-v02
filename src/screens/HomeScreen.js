import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI, transactionAPI, checkApiStatus, isOfflineMode } from '../api/api';
import { formatCurrency, centsToAmount, formatDate } from '../utils/formatters';

export default function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    customerCount: 0,
    transactionCount: 0,
    totalTransactions: 0,
    offlineMode: false,
    offlineTransactions: 0,
    apiStatus: { online: false, version: '' },
  });

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);

  // Load dashboard data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Check API status
      const apiStatus = await checkApiStatus();
      
      // Check offline mode
      const offlineMode = isOfflineMode();
      
      // Get customers
      const customers = await customerAPI.getAll();
      
      // Get transactions
      const transactions = await transactionAPI.getAll();
      
      // Get offline transactions
      const offlineTransactions = transactions.filter(t => t.offlineCreated && t.status === 'pending');
      
      // Calculate total transaction value
      const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Update stats
      setStats({
        customerCount: customers.length,
        transactionCount: transactions.length,
        totalTransactions,
        offlineMode,
        offlineTransactions: offlineTransactions.length,
        apiStatus,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle sync offline transactions
  const handleSync = async () => {
    if (stats.offlineTransactions === 0) {
      Alert.alert('No Offline Transactions', 'There are no offline transactions to sync');
      return;
    }
    
    if (!stats.apiStatus.online) {
      Alert.alert('Offline Mode', 'Cannot sync while in offline mode. Please connect to the API first.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Sync offline transactions
      const result = await transactionAPI.syncOfflineTransactions();
      
      // Show result
      Alert.alert(
        'Sync Complete',
        `Synced ${result.success} of ${result.total} transactions\n${result.failed} failed`
      );
      
      // Reload data
      loadData();
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      Alert.alert('Error', 'Failed to sync transactions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Status Bar */}
      <View style={[styles.statusBar, stats.apiStatus.online ? styles.statusOnline : styles.statusOffline]}>
        <Text style={styles.statusText}>
          {stats.apiStatus.online
            ? `Connected to API v${stats.apiStatus.version}`
            : 'Offline Mode'}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NFC Payment System</Text>
        <Text style={styles.subtitle}>Dashboard</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Customers</Text>
          </View>
          <Text style={styles.cardValue}>{stats.customerCount}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#34C759" />
            <Text style={styles.cardTitle}>Transactions</Text>
          </View>
          <Text style={styles.cardValue}>{stats.transactionCount}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={24} color="#FF9500" />
            <Text style={styles.cardTitle}>Total Value</Text>
          </View>
          <Text style={styles.cardValue}>
            {formatCurrency(centsToAmount(stats.totalTransactions))}
          </Text>
        </View>
      </View>

      {/* Offline Transactions */}
      {stats.offlineTransactions > 0 && (
        <View style={styles.offlineCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud-offline" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Offline Transactions</Text>
          </View>
          <Text style={styles.offlineValue}>{stats.offlineTransactions}</Text>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            disabled={!stats.apiStatus.online}
          >
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="scan-circle" size={36} color="#007AFF" />
            <Text style={styles.actionButtonText}>Scan Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CustomerRegistration')}
          >
            <Ionicons name="person-add" size={36} color="#34C759" />
            <Text style={styles.actionButtonText}>Register Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="list" size={36} color="#FF9500" />
            <Text style={styles.actionButtonText}>View Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ApiSettings')}
          >
            <Ionicons name="settings" size={36} color="#5856D6" />
            <Text style={styles.actionButtonText}>API Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* System Info */}
      <View style={styles.systemInfoContainer}>
        <Text style={styles.systemInfoText}>
          System Date: {formatDate(new Date().toISOString())}
        </Text>
        <Text style={styles.systemInfoText}>
          Offline Mode: {stats.offlineMode ? 'Enabled' : 'Disabled'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  statusBar: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusOnline: {
    backgroundColor: '#d4edda',
  },
  statusOffline: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 6,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  offlineCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  offlineValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginVertical: 5,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  systemInfoContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  systemInfoText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
});