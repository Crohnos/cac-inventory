import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { dbAsync } from '../database/connection.js';

/**
 * Generate a unique QR code value
 * @returns A string that can be used as a unique QR code value
 */
export const generateUniqueQrValue = async (): Promise<string> => {
  let qrCodeValue = '';
  let isUnique = false;
  
  // Generate QR values until we get a unique one
  while (!isUnique) {
    // Generate a UUID as the base for our QR code value
    qrCodeValue = `item-${uuidv4()}`;
    
    // Check if this QR code value already exists in the database
    const existing = await dbAsync.get(
      'SELECT id FROM ItemDetail WHERE qrCodeValue = ?', 
      [qrCodeValue]
    );
    
    // If no match found, we have a unique value
    if (!existing) {
      isUnique = true;
    }
  }
  
  return qrCodeValue;
};

/**
 * Generate QR code data URL from a value
 * @param value The value to encode in the QR code
 * @returns A data URL containing the QR code image
 */
export const generateQrCodeDataUrl = async (value: string): Promise<string> => {
  try {
    // Generate a QR code as a data URL
    return await QRCode.toDataURL(value);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};