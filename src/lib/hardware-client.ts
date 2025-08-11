// Client לתקשורת עם Hardware Microservice

const HARDWARE_SERVICE_URL = process.env.HARDWARE_SERVICE_URL || 'http://localhost:8080';

export class HardwareClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = HARDWARE_SERVICE_URL;
  }

  // פתיחת תא דרך Hardware Service
  async unlockCell(lockerId: string, cellNumber: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📤 שולח פקודת פתיחה ל-Hardware Service: ${lockerId}, תא ${cellNumber}`);
      
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
      console.log(`✅ תא נפתח בהצלחה: ${result.message}`);
      return result;

    } catch (error) {
      console.error('❌ שגיאה בפתיחת תא דרך Hardware Service:', error);
      throw error;
    }
  }

  // נעילת תא דרך Hardware Service
  async lockCell(lockerId: string, cellNumber: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📤 שולח פקודת נעילה ל-Hardware Service: ${lockerId}, תא ${cellNumber}`);
      
      const response = await fetch(`${this.baseUrl}/hardware/lock`, {
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
        throw new Error(error.error || 'שגיאה בנעילת תא');
      }

      const result = await response.json();
      console.log(`✅ תא נעל בהצלחה: ${result.message}`);
      return result;

    } catch (error) {
      console.error('❌ שגיאה בנעילת תא דרך Hardware Service:', error);
      throw error;
    }
  }

  // קבלת סטטוס חיבורי לוקרים
  async getHardwareStatus(): Promise<{ connectedLockers: number; lockers: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/hardware/status`);
      
      if (!response.ok) {
        throw new Error('שגיאה בקבלת סטטוס Hardware Service');
      }

      const status = await response.json();
      console.log(`📊 סטטוס Hardware Service: ${status.connectedLockers} לוקרים מחוברים`);
      return status;

    } catch (error) {
      console.error('❌ שגיאה בקבלת סטטוס Hardware Service:', error);
      throw error;
    }
  }

  // בדיקה אם לוקר מחובר
  async isLockerConnected(lockerId: string): Promise<boolean> {
    try {
      const status = await this.getHardwareStatus();
      return status.lockers.some(locker => locker.lockerId === lockerId);
    } catch (error) {
      console.error('❌ שגיאה בבדיקת חיבור לוקר:', error);
      return false;
    }
  }
}

// Singleton instance
export const hardwareClient = new HardwareClient();
