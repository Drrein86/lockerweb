// 🤖 Hardware Client - אופציונלי, לא מחליף את הקיים

const HARDWARE_SERVICE_URL = process.env.HARDWARE_SERVICE_URL || 'http://localhost:8080';

export class HardwareClientOptional {
  private baseUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.baseUrl = HARDWARE_SERVICE_URL;
    // אפשר להפעיל/לכבות דרך env variable
    this.isEnabled = process.env.USE_HARDWARE_MICROSERVICE === 'true';
  }

  // בדיקה אם המicroservice זמין
  async isServiceAvailable(): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('ℹ️ Hardware Microservice לא זמין, ממשיך עם השרת הראשי');
      return false;
    }
  }

  // פתיחת תא דרך המicroservice (רק אם זמין)
  async unlockCellIfAvailable(lockerId: string, cellNumber: number): Promise<{ success: boolean; message: string; usedMicroservice: boolean }> {
    const serviceAvailable = await this.isServiceAvailable();
    
    if (!serviceAvailable) {
      return {
        success: false,
        message: 'Hardware Microservice לא זמין - השתמש בשרת הראשי',
        usedMicroservice: false
      };
    }

    try {
      console.log(`📤 שולח פקודת פתיחה ל-Hardware Microservice: ${lockerId}, תא ${cellNumber}`);
      
      const response = await fetch(`${this.baseUrl}/hardware/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lockerId,
          cellNumber
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה בפתיחת תא');
      }

      const result = await response.json();
      console.log(`✅ תא נפתח בהצלחה דרך Microservice: ${result.message}`);
      
      return {
        ...result,
        usedMicroservice: true
      };

    } catch (error) {
      console.error('❌ שגיאה במicroservice, נסה עם השרת הראשי:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        usedMicroservice: false
      };
    }
  }

  // קבלת סטטוס (רק אם זמין)
  async getStatusIfAvailable(): Promise<any | null> {
    const serviceAvailable = await this.isServiceAvailable();
    if (!serviceAvailable) return null;

    try {
      const response = await fetch(`${this.baseUrl}/hardware/status`);
      if (!response.ok) return null;
      
      const status = await response.json();
      console.log(`📊 סטטוס Hardware Microservice: ${status.connectedLockers} לוקרים מחוברים`);
      return status;

    } catch (error) {
      console.error('❌ שגיאה בקבלת סטטוס Microservice:', error);
      return null;
    }
  }
}

// Singleton instance
export const hardwareClientOptional = new HardwareClientOptional();
