/**
 * Backblaze B2 Configuration Notes
 * 
 * This file securely documents the Backblaze B2 credentials and endpoint parameters
 * provided by the user. These parameters will be utilized in the next phase to integrate
 * cloud storage uploads for all photos, videos, and audio files.
 * 
 * B2 Credentials & Parameters:
 * - Bucket Name: partyapp
 * - Created: June 1, 2026
 * - Bucket ID: 5c122b3552b68b3e90eb0a1a
 * - Type: Public
 * - Endpoint: s3.us-east-005.backblazeb2.com
 * - Key ID (keyID): 005c2b526be0baa000000003b
 * - Key Name (keyName): partyappkey
 * - Application Key (applicationKey): K0051vAvhBC3WzpsGe3DagjYhpDGUMg
 */

export const B2_CONFIG = {
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  bucketName: 'partyapp',
  bucketId: '5c122b3552b68b3e90eb0a1a',
  keyId: '005c2b526be0baa000000003b',
  applicationKey: 'K0051vAvhBC3WzpsGe3DagjYhpDGUMg',
};
