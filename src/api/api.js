import { getApiUrl, saveApiUrl } from './api-settings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { amountToCents, centsToAmount } from '../utils/formatters';

// Offline storage keys
const OFFLINE_TRANSACTIONS_KEY = 'offline_transactions';
const OFFLINE_MODE_KEY = 'offline_mode';
const OFFLINE_CUSTOMERS_KEY = 'offline_customers';
const OFFLINE_CUSTOMERS_BY_CARD_KEY = 'offline_customers_by_card';

// API version
export const API_VERSION = '2.0.2';

// Track offline mode
let offlineMode = false;

// Initialize offline mode from storage
(async () => {
  try {
    const storedOfflineMode = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
    offlineMode = storedOfflineMode === 'true';
    console.log(`Initialized offline mode: ${offlineMode}`);
  } catch (error) {
    console.error('Failed to initialize offline mode:', error);
  }
})();

/**
 * Save and verify API URL - wrapper around the original saveApiUrl 
 * @param {string} url - API URL to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveAndVerifyApiUrl = async (url) => {
  try {
    await saveApiUrl(url);
    return true;
  } catch (error) {
    console.error('Failed to save API URL:', error);
    return false;
  }
};

/**
 * Check if API connection is available
 * @returns {Promise<boolean>} Connection status
 */
export const checkApiConnection = async () => {
  try {
    const status = await checkApiStatus();
    return status.online;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

/**
 * Get API status - includes version and connection info
 * @returns {Promise<{online: boolean, version: string}>} API status
 */
export const checkApiStatus = async () => {
  if (await shouldOperateOffline()) {
    return { online: false, version: API_VERSION };
  }

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { online: false, version: API_VERSION };
    }

    const data = await response.json();
    return { 
      online: true, 
      version: data.version || API_VERSION,
      serverTime: data.serverTime,
    };
  } catch (error) {
    console.error('API status check failed:', error);
    return { online: false, version: API_VERSION };
  }
};

/**
 * Enable or disable offline mode
 * @param {boolean} value - Whether to enable offline mode
 */
export const setOfflineMode = (value) => {
  offlineMode = value;
  AsyncStorage.setItem(OFFLINE_MODE_KEY, value.toString());
  console.log(`Offline mode set to: ${value}`);
};

/**
 * Check if offline mode is enabled
 * @returns {boolean} Whether offline mode is enabled
 */
export const isOfflineMode = () => offlineMode;

/**
 * Determine if we should operate in offline mode
 * Either manual offline mode is enabled or we can't reach the API
 * @returns {Promise<boolean>} Whether to operate in offline mode
 */
export const shouldOperateOffline = async () => {
  // If offline mode is explicitly enabled, use that
  if (offlineMode) {
    return true;
  }

  // Otherwise, check if API is reachable
  try {
    const apiUrl = await getApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return !response.ok;
  } catch (error) {
    console.log('API unreachable, operating in offline mode:', error.message);
    return true;
  }
};

// Customer API methods
export const customerAPI = {
  /**
   * Get customer by card ID
   * @param {string} cardId - Card ID
   * @returns {Promise<any>} Customer data
   */
  async getByCardId(cardId) {
    if (await shouldOperateOffline()) {
      return this.getOfflineCustomerByCardId(cardId);
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/customers/card/${cardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get customer: ${response.status}`);
      }

      const customer = await response.json();
      
      // Cache customer data for offline use
      this.cacheOfflineCustomer(customer);
      
      return customer;
    } catch (error) {
      console.error(`Failed to get customer for card ${cardId}:`, error);
      // Try to get from offline cache as a fallback
      return this.getOfflineCustomerByCardId(cardId);
    }
  },

  /**
   * Get customer by ID
   * @param {number} id - Customer ID
   * @returns {Promise<any>} Customer data
   */
  async getById(id) {
    if (await shouldOperateOffline()) {
      return this.getOfflineCustomerById(id);
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/customers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get customer: ${response.status}`);
      }

      const customer = await response.json();
      
      // Cache customer data for offline use
      this.cacheOfflineCustomer(customer);
      
      return customer;
    } catch (error) {
      console.error(`Failed to get customer ${id}:`, error);
      // Try to get from offline cache as a fallback
      return this.getOfflineCustomerById(id);
    }
  },

  /**
   * Register a new customer
   * @param {object} customerData - Customer data
   * @returns {Promise<any>} Created customer
   */
  async register(customerData) {
    if (await shouldOperateOffline()) {
      throw new Error('Cannot register new customers in offline mode');
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to register customer: ${response.status}`);
      }

      const customer = await response.json();
      
      // Cache customer data for offline use
      this.cacheOfflineCustomer(customer);
      
      return customer;
    } catch (error) {
      console.error('Failed to register customer:', error);
      throw error;
    }
  },

  /**
   * Update customer balance
   * @param {number} customerId - Customer ID
   * @param {number} amount - Amount to add or subtract (positive to add, negative to subtract)
   * @returns {Promise<any>} Updated customer
   */
  async updateBalance(customerId, amount) {
    if (await shouldOperateOffline()) {
      return this.updateOfflineBalance(customerId, amount);
    }

    try {
      const apiUrl = await getApiUrl();
      const amountInCents = amountToCents(amount);
      
      const response = await fetch(`${apiUrl}/customers/${customerId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amountInCents }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update balance: ${response.status}`);
      }

      const customer = await response.json();
      
      // Update cache
      this.cacheOfflineCustomer(customer);
      
      return customer;
    } catch (error) {
      console.error(`Failed to update balance for customer ${customerId}:`, error);
      // Try offline update as a fallback
      return this.updateOfflineBalance(customerId, amount);
    }
  },

  /**
   * Get all customers
   * @returns {Promise<any[]>} List of customers
   */
  async getAll() {
    if (await shouldOperateOffline()) {
      return this.getAllOfflineCustomers();
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get customers: ${response.status}`);
      }

      const customers = await response.json();
      
      // Cache all customers for offline use
      await AsyncStorage.setItem(OFFLINE_CUSTOMERS_KEY, JSON.stringify(customers));
      
      // Update card ID index
      const customersByCard = {};
      for (const customer of customers) {
        if (customer.cardId) {
          customersByCard[customer.cardId] = customer;
        }
      }
      await AsyncStorage.setItem(OFFLINE_CUSTOMERS_BY_CARD_KEY, JSON.stringify(customersByCard));
      
      return customers;
    } catch (error) {
      console.error('Failed to get customers:', error);
      // Try to get from offline cache as a fallback
      return this.getAllOfflineCustomers();
    }
  },

  /**
   * Cache customer data for offline use
   * @param {object} customer - Customer data
   */
  async cacheOfflineCustomer(customer) {
    try {
      // Get current customer cache
      const customersStr = await AsyncStorage.getItem(OFFLINE_CUSTOMERS_KEY);
      let customers = customersStr ? JSON.parse(customersStr) : [];
      
      // Update or add customer
      const index = customers.findIndex(c => c.id === customer.id);
      if (index >= 0) {
        customers[index] = customer;
      } else {
        customers.push(customer);
      }
      
      // Save updated cache
      await AsyncStorage.setItem(OFFLINE_CUSTOMERS_KEY, JSON.stringify(customers));
      
      // Update card ID index
      if (customer.cardId) {
        const cardIndexStr = await AsyncStorage.getItem(OFFLINE_CUSTOMERS_BY_CARD_KEY);
        const cardIndex = cardIndexStr ? JSON.parse(cardIndexStr) : {};
        cardIndex[customer.cardId] = customer;
        await AsyncStorage.setItem(OFFLINE_CUSTOMERS_BY_CARD_KEY, JSON.stringify(cardIndex));
      }
    } catch (error) {
      console.error('Failed to cache customer:', error);
    }
  },

  /**
   * Get customer from offline cache by card ID
   * @param {string} cardId - Card ID
   * @returns {Promise<any>} Customer data
   */
  async getOfflineCustomerByCardId(cardId) {
    try {
      const cardIndexStr = await AsyncStorage.getItem(OFFLINE_CUSTOMERS_BY_CARD_KEY);
      const cardIndex = cardIndexStr ? JSON.parse(cardIndexStr) : {};
      
      return cardIndex[cardId] || null;
    } catch (error) {
      console.error(`Failed to get offline customer for card ${cardId}:`, error);
      return null;
    }
  },

  /**
   * Get customer from offline cache by ID
   * @param {number} id - Customer ID
   * @returns {Promise<any>} Customer data
   */
  async getOfflineCustomerById(id) {
    try {
      const customersStr = await AsyncStorage.getItem(OFFLINE_CUSTOMERS_KEY);
      const customers = customersStr ? JSON.parse(customersStr) : [];
      
      return customers.find(c => c.id === id) || null;
    } catch (error) {
      console.error(`Failed to get offline customer ${id}:`, error);
      return null;
    }
  },

  /**
   * Get all customers from offline cache
   * @returns {Promise<any[]>} List of customers
   */
  async getAllOfflineCustomers() {
    try {
      const customersStr = await AsyncStorage.getItem(OFFLINE_CUSTOMERS_KEY);
      return customersStr ? JSON.parse(customersStr) : [];
    } catch (error) {
      console.error('Failed to get offline customers:', error);
      return [];
    }
  },

  /**
   * Update customer balance in offline cache
   * @param {number} customerId - Customer ID
   * @param {number} amount - Amount to add or subtract (positive to add, negative to subtract)
   * @returns {Promise<any>} Updated customer
   */
  async updateOfflineBalance(customerId, amount) {
    try {
      const customer = await this.getOfflineCustomerById(customerId);
      if (!customer) {
        throw new Error(`Customer ${customerId} not found in offline cache`);
      }
      
      // Update balance in pesos
      const amountInCents = amountToCents(amount);
      customer.balance += amountInCents;
      
      // Save updated customer
      await this.cacheOfflineCustomer(customer);
      
      return customer;
    } catch (error) {
      console.error(`Failed to update offline balance for customer ${customerId}:`, error);
      throw error;
    }
  }
};

// Transaction API methods
export const transactionAPI = {
  /**
   * Create a new transaction
   * @param {object} transactionData - Transaction data
   * @returns {Promise<any>} Created transaction
   */
  async create(transactionData) {
    const shouldOffline = await shouldOperateOffline();
    
    // Function to process the transaction
    const processTransaction = async () => {
      // Convert amounts to cents if needed
      const processedData = {
        ...transactionData,
        amount: typeof transactionData.amount === 'number' 
          ? amountToCents(transactionData.amount) 
          : transactionData.amount,
      };
      
      // Process items if present
      if (processedData.items && Array.isArray(processedData.items)) {
        processedData.items = processedData.items.map(item => ({
          ...item,
          unitPrice: typeof item.unitPrice === 'number' 
            ? amountToCents(item.unitPrice) 
            : item.unitPrice,
          amount: typeof item.amount === 'number' 
            ? amountToCents(item.amount) 
            : item.amount,
        }));
      }
      
      if (shouldOffline) {
        return this.createOfflineTransaction(processedData);
      }
      
      try {
        const apiUrl = await getApiUrl();
        const response = await fetch(`${apiUrl}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processedData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create transaction: ${response.status} - ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Failed to create transaction:', error);
        
        // If online attempt fails, try offline as a fallback
        return this.createOfflineTransaction(processedData);
      }
    };
    
    // Process the transaction
    const transaction = await processTransaction();
    
    // If we have a customer ID, update the customer's balance
    if (transaction && transaction.customerId) {
      try {
        // For payment transactions, subtract the amount
        const amount = -1 * centsToAmount(transaction.amount);
        await customerAPI.updateBalance(transaction.customerId, amount);
      } catch (balanceError) {
        console.error('Failed to update customer balance:', balanceError);
        // Continue anyway, the transaction was already recorded
      }
    }
    
    return transaction;
  },

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<any>} Transaction data
   */
  async getById(transactionId) {
    if (await shouldOperateOffline()) {
      return this.getOfflineTransactionById(transactionId);
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get transaction: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get transaction ${transactionId}:`, error);
      // Try to get from offline cache as a fallback
      return this.getOfflineTransactionById(transactionId);
    }
  },

  /**
   * Get all transactions
   * @returns {Promise<any[]>} List of transactions
   */
  async getAll() {
    if (await shouldOperateOffline()) {
      return this.getAllOfflineTransactions();
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/transactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get transactions: ${response.status}`);
      }

      const transactions = await response.json();
      
      // Cache transactions for offline use
      await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
      
      return transactions;
    } catch (error) {
      console.error('Failed to get transactions:', error);
      // Try to get from offline cache as a fallback
      return this.getAllOfflineTransactions();
    }
  },

  /**
   * Get transactions by customer card ID
   * @param {string} cardId - Card ID
   * @returns {Promise<any[]>} List of transactions
   */
  async getByCardId(cardId) {
    if (await shouldOperateOffline()) {
      return this.getOfflineTransactionsByCardId(cardId);
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/transactions/card/${cardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get transactions for card: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get transactions for card ${cardId}:`, error);
      // Try to get from offline cache as a fallback
      return this.getOfflineTransactionsByCardId(cardId);
    }
  },

  /**
   * Create a transaction in offline mode
   * @param {object} transactionData - Transaction data
   * @returns {Promise<any>} Created transaction
   */
  async createOfflineTransaction(transactionData) {
    try {
      // Generate a temporary ID for the transaction
      const tmpId = `offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create the transaction object
      const transaction = {
        ...transactionData,
        transactionId: tmpId,
        status: 'pending',
        offlineCreated: true,
        createdAt: new Date().toISOString(),
      };
      
      // Get current offline transactions
      const transactionsStr = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      const transactions = transactionsStr ? JSON.parse(transactionsStr) : [];
      
      // Add the new transaction
      transactions.push(transaction);
      
      // Save updated transactions
      await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
      
      return transaction;
    } catch (error) {
      console.error('Failed to create offline transaction:', error);
      throw error;
    }
  },

  /**
   * Get transaction from offline cache by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<any>} Transaction data
   */
  async getOfflineTransactionById(transactionId) {
    try {
      const transactionsStr = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      const transactions = transactionsStr ? JSON.parse(transactionsStr) : [];
      
      return transactions.find(t => t.transactionId === transactionId) || null;
    } catch (error) {
      console.error(`Failed to get offline transaction ${transactionId}:`, error);
      return null;
    }
  },

  /**
   * Get all transactions from offline cache
   * @returns {Promise<any[]>} List of transactions
   */
  async getAllOfflineTransactions() {
    try {
      const transactionsStr = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      return transactionsStr ? JSON.parse(transactionsStr) : [];
    } catch (error) {
      console.error('Failed to get offline transactions:', error);
      return [];
    }
  },

  /**
   * Get transactions from offline cache by card ID
   * @param {string} cardId - Card ID
   * @returns {Promise<any[]>} List of transactions
   */
  async getOfflineTransactionsByCardId(cardId) {
    try {
      const transactions = await this.getAllOfflineTransactions();
      return transactions.filter(t => t.cardId === cardId);
    } catch (error) {
      console.error(`Failed to get offline transactions for card ${cardId}:`, error);
      return [];
    }
  },

  /**
   * Sync offline transactions with the server
   * @returns {Promise<{success: number, failed: number, total: number}>} Sync results
   */
  async syncOfflineTransactions() {
    // Check if we're still offline
    if (await shouldOperateOffline()) {
      throw new Error('Cannot sync transactions while in offline mode');
    }
    
    // Get offline transactions
    const transactions = await this.getAllOfflineTransactions();
    const pendingTransactions = transactions.filter(t => t.offlineCreated && t.status === 'pending');
    
    if (pendingTransactions.length === 0) {
      return { success: 0, failed: 0, total: 0 };
    }
    
    // Track sync results
    const results = {
      success: 0,
      failed: 0,
      total: pendingTransactions.length,
    };
    
    // Get API URL
    const apiUrl = await getApiUrl();
    
    // Sync each transaction
    for (const transaction of pendingTransactions) {
      try {
        // Remove offline-specific properties
        const { offlineCreated, ...syncData } = transaction;
        
        // Send to server
        const response = await fetch(`${apiUrl}/transactions/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(syncData),
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        // Mark as synced
        transaction.status = 'completed';
        transaction.synced = true;
        results.success++;
      } catch (error) {
        console.error(`Failed to sync transaction ${transaction.transactionId}:`, error);
        transaction.syncError = error.message;
        results.failed++;
      }
    }
    
    // Save updated transactions
    await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    
    return results;
  }
};

export default {
  customerAPI,
  transactionAPI,
  saveAndVerifyApiUrl,
  getApiUrl,
  checkApiConnection,
  checkApiStatus,
  setOfflineMode,
  isOfflineMode,
  shouldOperateOffline,
  API_VERSION,
};