
// services/api.ts
import { verifyLicenseKey } from "../utils/security";

// This simulates the Backend API
const API_BASE_URL = "https://api.maidah-pos.com/v1"; 
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface LicenseResponse {
    valid: boolean;
    expiryDate?: string;
    message?: string;
    clientName?: string;
}

export const api = {
    /**
     * Verify license key (Simulating Server-Side Verification)
     */
    verifyLicense: async (key: string, deviceId: string): Promise<LicenseResponse> => {
        try {
            console.log(`[API] Connecting to ${API_BASE_URL}/license/verify...`);
            await delay(1500); // Simulate network delay

            // Use the Robust Security Util
            const result = await verifyLicenseKey(key, deviceId);
            
            return {
                valid: result.valid,
                message: result.message,
                expiryDate: result.expiryDate,
                clientName: 'Client' // Placeholder
            };

        } catch (error) {
            console.error("API Error", error);
            throw new Error("Connection failed");
        }
    },

    checkUpdates: async () => {
        await delay(1000);
        return { hasUpdate: false, version: '2.1.0' };
    },

    syncOrders: async (orders: any[]) => {
        await delay(800);
        return { success: true };
    }
};
