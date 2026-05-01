
// Shared Security Logic
// Uses HMAC-SHA256 (Government Grade Security) via Web Crypto API

// --- KEY OBFUSCATION (Security by obscurity layer) ---
// We split the key into parts so it's not searchable in the bundle as a single string.
const K_PART_1 = "MAIDAH_POS_";
const K_PART_2 = "SECURE_SYSTEM_";
const K_PART_3 = "V2_2025_";
const K_PART_4 = "OFFICIAL_LICENSE_SIGNATURE";

// Reconstruct the key at runtime
const GET_SECRET = () => K_PART_1 + K_PART_3 + K_PART_2 + K_PART_4;

/**
 * Imports the secret key for cryptographic operations
 */
async function getCryptoKey() {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(GET_SECRET()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return keyMaterial;
}

/**
 * Generates a cryptographically secure license key
 * Format: Base64( DeviceID | ExpiryTimestamp | Signature )
 */
export const generateLicenseKey = async (deviceId: string, expiryTimestamp: string) => {
  const key = await getCryptoKey();
  const enc = new TextEncoder();
  
  // The data payload we want to sign
  const data = `${deviceId}|${expiryTimestamp}`;
  
  // Sign the data
  const signatureBuffer = await window.crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(data)
  );

  // Convert signature buffer to hex string
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Combine Data + Signature
  const rawString = `${data}|${signatureHex}`;
  
  // Encode to Base64 for the user
  return btoa(rawString);
};

/**
 * Verifies if a license key is valid and untampered
 */
export const verifyLicenseKey = async (inputKey: string, currentDeviceId: string) => {
  try {
    // 1. Decode Base64
    const decoded = atob(inputKey);
    const parts = decoded.split('|');

    // Must have 3 parts: DeviceID, Expiry, Signature
    if (parts.length !== 3) return { valid: false, message: 'تنسيق الكود غير صحيح' };

    const [keyDeviceId, expiryTimestamp, keySignature] = parts;

    // 2. Verify Device ID
    if (keyDeviceId !== currentDeviceId) {
      return { valid: false, message: 'هذا الكود غير مخصص لهذا الجهاز' };
    }

    // 3. Verify Signature (Integrity Check)
    const key = await getCryptoKey();
    const enc = new TextEncoder();
    const dataToVerify = `${keyDeviceId}|${expiryTimestamp}`;
    
    // Convert hex signature back to buffer
    const signatureBytes = new Uint8Array(keySignature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const isValid = await window.crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      enc.encode(dataToVerify)
    );

    if (!isValid) {
      return { valid: false, message: 'كود التفعيل مزور أو تم التلاعب به' };
    }

    // 4. Verify Expiry
    const expiryDate = new Date(parseInt(expiryTimestamp));
    const now = new Date();

    if (now > expiryDate) {
      return { valid: false, message: 'انتهت صلاحية هذا الكود', expiryDate: expiryDate.toISOString() };
    }

    return { 
      valid: true, 
      expiryDate: expiryDate.toISOString(), 
      message: 'تم التفعيل بنجاح' 
    };

  } catch (error) {
    console.error("Verification Error:", error);
    return { valid: false, message: 'حدث خطأ أثناء التحقق من الكود' };
  }
};
