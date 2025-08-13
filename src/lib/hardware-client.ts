// Client לתקשורת עם Hardware Microservice

// Hardware service עכשיו רץ דרך Next.js APIs
const HARDWARE_SERVICE_URL = process.env.HARDWARE_SERVICE_URL || 'https://lockerweb-production.up.railway.app';

export class HardwareClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = HARDWARE_SERVICE_URL;
  }

  // פתיחת תא דרך WebSocket API
  async unlockCell(lockerId: string, cellNumber: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📤 שולח פקודת פתיחה ל-WebSocket API: ${lockerId}, תא ${cellNumber}`);
      
      const response = await fetch(`${this.baseUrl}/api/ws`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'unlock',
          id: lockerId,
          cell: cellNumber.toString()
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

  // נעילת תא דרך WebSocket API
  async lockCell(lockerId: string, cellNumber: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📤 שולח פקודת נעילה ל-WebSocket API: ${lockerId}, תא ${cellNumber}`);
      
      const response = await fetch(`${this.baseUrl}/api/ws`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'lock',
          id: lockerId,
          cell: cellNumber.toString()
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
      const response = await fetch(`${this.baseUrl}/api/admin/lockers-management`);
      
      if (!response.ok) {
        throw new Error('שגיאה בקבלת סטטוס לוקרים');
      }

      const data = await response.json();
      const lockers = data.lockers || [];
      console.log(`📊 סטטוס לוקרים: ${lockers.length} לוקרים זמינים`);
      return {
        connectedLockers: lockers.length,
        lockers: lockers
      };

    } catch (error) {
      console.error('❌ שגיאה בקבלת סטטוס לוקרים:', error);
      throw error;
    }
  }

  // בדיקה אם לוקר מחובר
  async isLockerConnected(lockerId: string): Promise<boolean> {
    try {
      const status = await this.getHardwareStatus();
      return status.lockers.some(locker => locker.deviceId === lockerId || locker.id === lockerId);
    } catch (error) {
      console.error('❌ שגיאה בבדיקת חיבור לוקר:', error);
      return false;
    }
  }
}

// Singleton instance
export const hardwareClient = new HardwareClient();
