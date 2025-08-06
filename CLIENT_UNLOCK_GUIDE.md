# 🔓 מדריך פתיחת תא על ידי לקוח

## סקירה כללית

המערכת מאפשרת ללקוחות לפתוח תאים בלוקר דרך השרת (Railway) במקום ישירות דרך Wi-Fi. זה מספק אבטחה טובה יותר ושליטה מרכזית.

## 🚀 איך זה עובד

### 1. זרימת הפעולה
```
לקוח → שרת Railway → WebSocket Server → ESP32 → פתיחת תא
```

### 2. שלבי הפעולה
1. **לקוח שולח בקשה** לשרת עם פרטי התא והחבילה
2. **השרת מאמת** את הטוקן של הלקוח
3. **השרת שולח פקודה** ללוקר דרך WebSocket
4. **הלוקר פותח** את התא
5. **השרת מחזיר** אישור ללקוח

## 📡 API Endpoints

### פתיחת תא דרך HTTP
```http
POST /api/lockers/unlock-cell
Content-Type: application/json

{
  "lockerId": "LOC632",
  "cellId": "A1",
  "packageId": "PKG123456",
  "clientToken": "TOKEN123456"
}
```

### תשובה מוצלחת
```json
{
  "status": "success",
  "message": "Unlock request sent successfully",
  "lockerId": "LOC632",
  "cellId": "A1",
  "packageId": "PKG123456"
}
```

### תשובת שגיאה
```json
{
  "status": "error",
  "error": "Invalid client token"
}
```

## 🔌 WebSocket Messages

### שליחת הודעה לשרת WebSocket
```json
{
  "type": "openByClient",
  "lockerId": "LOC632",
  "cellId": "A1",
  "packageId": "PKG123456",
  "clientToken": "TOKEN123456"
}
```

### תשובה מהשרת
```json
{
  "type": "unlockResponse",
  "status": "success",
  "lockerId": "LOC632",
  "cellId": "A1"
}
```

## 🛡️ אבטחה

### אימות לקוח
- כל בקשה חייבת לכלול `clientToken` תקין
- הטוקן חייב להיות באורך של לפחות 6 תווים
- ניתן להרחיב את הלוגיקה לבדיקה מול מסד נתונים

### הגנה נוספת
- בדיקת קיום הלוקר במערכת
- לוג של כל פעולת פתיחה
- הגבלת מספר ניסיונות

## 📱 דוגמה לשימוש באפליקציה

### JavaScript/TypeScript
```javascript
async function unlockCell(lockerId, cellId, packageId, clientToken) {
  try {
    const response = await fetch('/api/lockers/unlock-cell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lockerId,
        cellId,
        packageId,
        clientToken
      }),
    });

    const result = await response.json();
    
    if (result.status === 'success') {
      console.log('✅ התא נפתח בהצלחה');
      return result;
    } else {
      console.error('❌ שגיאה בפתיחת התא:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ שגיאה בתקשורת:', error);
    throw error;
  }
}

// שימוש
unlockCell('LOC632', 'A1', 'PKG123456', 'TOKEN123456')
  .then(result => {
    console.log('התא נפתח:', result);
  })
  .catch(error => {
    console.error('שגיאה:', error);
  });
```

### React Hook
```typescript
import { useState } from 'react';

export function useUnlockCell() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlockCell = async (params: {
    lockerId: string;
    cellId: string;
    packageId: string;
    clientToken: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lockers/unlock-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { unlockCell, loading, error };
}
```

## 🔧 הגדרות שרת

### משתני סביבה נדרשים
```env
# WebSocket Server
PORT=3003
ADMIN_SECRET=your_admin_secret

# ESP32 Devices
ESP32_LOCKER1_IP=192.168.0.104
ESP32_LOCKER2_IP=192.168.0.105

# SSL (אופציונלי)
USE_SSL=false
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
```

### לוגים
השרת מייצר לוגים מפורטים לכל פעולה:
- `client_unlock` - פתיחה מוצלחת על ידי לקוח
- `client_unlock_failed` - כישלון בפתיחה
- `auth_failed` - כישלון באימות
- `auth_success` - אימות מוצלח

## 🧪 בדיקה

### דף בדיקה
גש ל-`/customer/unlock-demo` לבדיקת המערכת

### בדיקה ידנית
```bash
curl -X POST http://localhost:3000/api/lockers/unlock-cell \
  -H "Content-Type: application/json" \
  -d '{
    "lockerId": "LOC632",
    "cellId": "A1",
    "packageId": "PKG123456",
    "clientToken": "TOKEN123456"
  }'
```

## 🔄 הרחבות עתידיות

### אימות מתקדם
- בדיקה מול מסד נתונים
- טוקנים מוצפנים
- הגבלת זמן לטוקנים

### ניטור
- מעקב אחר ניסיונות פתיחה
- התראות על פעילות חשודה
- דוחות שימוש

### אבטחה נוספת
- Rate limiting
- IP whitelisting
- Audit trails

## 📞 תמיכה

לשאלות או בעיות, פנה לצוות הפיתוח עם:
- פרטי השגיאה
- לוגים מהשרת
- פרטי הבקשה שנשלחה 