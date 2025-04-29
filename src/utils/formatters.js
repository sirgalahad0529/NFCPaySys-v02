/**
 * Utility functions for formatting and processing data
 */
import { format } from 'date-fns';

/**
 * Format date to display format (YYYY-MM-DD)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Failed to format date:', error);
    return dateString;
  }
};

/**
 * Format time from date (HH:mm:ss)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return format(date, 'HH:mm:ss');
  } catch (error) {
    console.error('Failed to format time:', error);
    return '';
  }
};

/**
 * Format date to short display format (MM/DD/YY)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return format(date, 'MM/dd/yy');
  } catch (error) {
    console.error('Failed to format short date:', error);
    return dateString;
  }
};

/**
 * Convert cents to decimal amount
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in decimal
 */
export const centsToAmount = (cents) => {
  if (typeof cents !== 'number') {
    return 0;
  }
  return parseFloat((cents / 100).toFixed(2));
};

/**
 * Convert decimal amount to cents
 * @param {number} amount - Amount in decimal
 * @returns {number} Amount in cents
 */
export const amountToCents = (amount) => {
  if (typeof amount !== 'number') {
    return 0;
  }
  return Math.round(amount * 100);
};

/**
 * Format amount as currency
 * @param {number} amount - Amount to format
 * @param {string} [currencySymbol='₱'] - Currency symbol to use
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currencySymbol = '₱') => {
  try {
    return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
  } catch (error) {
    console.error('Failed to format currency:', error);
    return `${currencySymbol}0.00`;
  }
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string
 * @returns {number} Amount as number
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  try {
    // Remove currency symbol and commas
    const numericString = currencyString.replace(/[₱$,]/g, '');
    return parseFloat(numericString);
  } catch (error) {
    console.error('Failed to parse currency:', error);
    return 0;
  }
};

/**
 * Format NFC card ID for display
 * @param {string} cardId - Raw card ID
 * @returns {string} Formatted card ID
 */
export const formatCardId = (cardId) => {
  if (!cardId) return '';
  
  // Convert to uppercase and add spaces for readability
  try {
    // Normalize to remove any existing spaces or special characters
    const normalized = cardId.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    
    // Add spaces every 4 characters
    return normalized.match(/.{1,4}/g)?.join(' ') || normalized;
  } catch (error) {
    console.error('Failed to format card ID:', error);
    return cardId;
  }
};

/**
 * Normalize card ID (remove spaces, convert to uppercase)
 * @param {string} cardId - Card ID with potential formatting
 * @returns {string} Normalized card ID
 */
export const normalizeCardId = (cardId) => {
  if (!cardId) return '';
  return cardId.replace(/\s+/g, '').toUpperCase();
};

/**
 * Prepare card ID for API (normalize and ensure correct format)
 * @param {string} cardId - Card ID input
 * @returns {string} API-ready card ID
 */
export const prepareCardIdForApi = (cardId) => {
  // Normalize the card ID first
  const normalized = normalizeCardId(cardId);
  
  // Ensure hexadecimal format if needed
  // This depends on the specific NFC card format your system uses
  return normalized;
};

/**
 * Format transaction type for display
 * @param {string} type - Transaction type
 * @returns {string} Formatted transaction type
 */
export const formatTransactionType = (type) => {
  if (!type) return '';
  
  const types = {
    'payment': 'Payment',
    'reload': 'Account Reload',
    'refund': 'Refund',
    'adjustment': 'Balance Adjustment',
  };
  
  return types[type.toLowerCase()] || type;
};

/**
 * Format transaction status for display
 * @param {string} status - Transaction status
 * @returns {string} Formatted transaction status
 */
export const formatTransactionStatus = (status) => {
  if (!status) return '';
  
  const statuses = {
    'completed': 'Completed',
    'pending': 'Pending',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
  };
  
  return statuses[status.toLowerCase()] || status;
};