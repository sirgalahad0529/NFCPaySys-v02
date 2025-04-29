import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, centsToAmount, formatDate, formatCardId } from '../utils/formatters';
import { customerAPI, transactionAPI } from '../api/api';

export default function CustomerDetailsScreen({ route, navigation }) {
  const { customer: initialCustomer } = route.params;
  const [customer, setCustomer] = useState(initialCustomer);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Refresh customer data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      refreshCustomerData();
      loadTransactions();
    }, [])
  );

  // Refresh customer data
  const refreshCustomerData = async () => {
    if (!customer || !customer.id) return;
    
    setIsLoading(true);
    try {
      const refreshedCustomer = await customerAPI.getById(customer.id);
      if (refreshedCustomer) {
        setCustomer(refreshedCustomer);
      }
    } catch (error) {
      console.error('Failed to refresh customer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load customer transactions
  const loadTransactions = async () => {
    if (!customer || !customer.cardId) return;
    
    setIsLoadingTransactions(true);
    try {
      const results = await transactionAPI.getByCardId(customer.cardId);
      // Sort by date, newest first
      const sorted = results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // Show only last 5 transactions
      setTransactions(sorted.slice(0, 5));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Handle Make Payment
  const handleMakePayment = () => {
    navigation.navigate('Payment', { customer });
  };

  // Handle Reload Account
  const handleReloadAccount = () => {
    navigation.navigate('ReloadAccount', { customer });
  };

  // Handle View All Transactions
  const handleViewAllTransactions = () => {
    // For now, just show last 10 transactions
    Alert.alert('Transactions', 'This would show all transactions for this customer.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Customer Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerId}>ID: {customer.id}</Text>
          </View>
          
          {isLoading && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
        </View>
        
        {customer.photoUrl ? (
          <Image source={{ uri: customer.photoUrl }} style={styles.customerPhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={80} color="#ccc" />
          </View>
        )}
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(centsToAmount(customer.balance))}
          </Text>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Card ID:</Text>
            <Text style={styles.detailValue}>{formatCardId(customer.cardId)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{customer.email || 'Not provided'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{customer.phone || 'Not provided'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registered:</Text>
            <Text style={styles.detailValue}>{formatDate(customer.createdAt)}</Text>
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.paymentButton]}
          onPress={handleMakePayment}
        >
          <Ionicons name="cash-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Make Payment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.reloadButton]}
          onPress={handleReloadAccount}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Reload Account</Text>
        </TouchableOpacity>
      </View>
      
      {/* Recent Transactions */}
      <View style={styles.transactionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={handleViewAllTransactions}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingTransactions ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
        ) : transactions.length > 0 ? (
          transactions.map((transaction) => (
            <View key={transaction.transactionId} style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionType}>
                  {transaction.type === 'payment' ? 'Payment' : 'Reload'}
                </Text>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'payment' ? styles.paymentAmount : styles.reloadAmount,
                ]}>
                  {transaction.type === 'payment' ? '-' : '+'}
                  {formatCurrency(centsToAmount(transaction.amount))}
                </Text>
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.createdAt)}
                </Text>
                <Text style={styles.transactionStatus}>
                  {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noTransactionsText}>No recent transactions</Text>
        )}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  customerId: {
    fontSize: 14,
    color: '#777',
  },
  customerPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
    color: '#555',
  },
  detailValue: {
    flex: 2,
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  paymentButton: {
    backgroundColor: '#FF3B30',
  },
  reloadButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  transactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentAmount: {
    color: '#FF3B30',
  },
  reloadAmount: {
    color: '#34C759',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDate: {
    fontSize: 14,
    color: '#777',
  },
  transactionStatus: {
    fontSize: 14,
    color: '#007AFF',
  },
  noTransactionsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginVertical: 16,
  },
});