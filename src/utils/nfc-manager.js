/**
 * NFC Manager for React Native
 * Handles NFC card reading and writing functionality
 */
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

// Flag to track if NFC is supported
let isNfcSupported = false;

/**
 * Initialize NFC manager and check if NFC is supported
 * @returns {Promise<boolean>} Whether NFC is supported
 */
export const initNfcManager = async () => {
  try {
    // Check if NFC is supported
    const supported = await NfcManager.isSupported();
    
    if (supported) {
      await NfcManager.start();
      isNfcSupported = true;
      console.log('NFC Manager initialized successfully');
    } else {
      console.log('NFC is not supported on this device');
    }
    
    return supported;
  } catch (error) {
    console.error('Error initializing NFC Manager:', error);
    return false;
  }
};

/**
 * Clean up NFC manager
 * Should be called when component unmounts
 */
export const cleanupNfcManager = () => {
  try {
    NfcManager.cancelTechnologyRequest().catch(() => {});
    console.log('NFC Manager cleaned up');
  } catch (error) {
    console.error('Error cleaning up NFC Manager:', error);
  }
};

/**
 * Read NFC tag and get its ID
 * @returns {Promise<string>} Card ID
 */
export const readNfcTag = async () => {
  if (!isNfcSupported) {
    console.log('NFC not supported');
    return null;
  }
  
  try {
    // Register for NFC tag reading
    await NfcManager.requestTechnology(NfcTech.Ndef);
    
    // Get tag info including ID
    const tag = await NfcManager.getTag();
    console.log('Tag found:', tag);
    
    // Extract ID in hex format
    const tagId = tag.id ? Buffer.from(tag.id, 'base64').toString('hex').toUpperCase() : null;
    
    // Clean up
    NfcManager.cancelTechnologyRequest();
    
    return tagId;
  } catch (error) {
    console.error('Error reading NFC tag:', error);
    NfcManager.cancelTechnologyRequest().catch(() => {});
    return null;
  }
};

/**
 * Write data to NFC tag
 * @param {string} data - Data to write to tag
 * @returns {Promise<boolean>} Whether write was successful
 */
export const writeNfcTag = async (data) => {
  if (!isNfcSupported) {
    console.log('NFC not supported');
    return false;
  }
  
  try {
    // Register for NFC tag tech
    await NfcManager.requestTechnology(NfcTech.Ndef);
    
    // Prepare data
    const bytes = Ndef.encodeMessage([Ndef.textRecord(data)]);
    
    // Write data to tag
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    console.log('Data written to tag successfully');
    
    // Clean up
    NfcManager.cancelTechnologyRequest();
    
    return true;
  } catch (error) {
    console.error('Error writing to NFC tag:', error);
    NfcManager.cancelTechnologyRequest().catch(() => {});
    return false;
  }
};

/**
 * Register for NFC tag discovery
 * @param {Function} onTagDetected - Callback when tag is detected
 * @returns {Promise<Function>} Cleanup function to cancel tag registration
 */
export const registerTagEvent = async (onTagDetected) => {
  if (!isNfcSupported) {
    console.log('NFC not supported');
    return () => {};
  }
  
  try {
    // Set event listener
    NfcManager.setEventListener(NfcTech.Ndef, event => {
      if (event.type === 'tag' && event.tag) {
        // Extract ID in hex format
        const tagId = event.tag.id 
          ? Buffer.from(event.tag.id, 'base64').toString('hex').toUpperCase() 
          : null;
        
        // Call callback with tag ID
        onTagDetected(tagId);
      }
    });
    
    // Start tag discovery
    await NfcManager.registerTagEvent();
    console.log('Registered for NFC tag discovery');
    
    // Return cleanup function
    return () => {
      NfcManager.setEventListener(NfcTech.Ndef, null);
      NfcManager.unregisterTagEvent().catch(() => {});
      console.log('Unregistered NFC tag discovery');
    };
  } catch (error) {
    console.error('Error registering for NFC tag discovery:', error);
    return () => {};
  }
};

/**
 * Check if NFC is enabled
 * @returns {Promise<boolean>} Whether NFC is enabled
 */
export const isNfcEnabled = async () => {
  if (!isNfcSupported) {
    return false;
  }
  
  try {
    return await NfcManager.isEnabled();
  } catch (error) {
    console.error('Error checking if NFC is enabled:', error);
    return false;
  }
};

export default {
  initNfcManager,
  cleanupNfcManager,
  readNfcTag,
  writeNfcTag,
  registerTagEvent,
  isNfcEnabled,
};