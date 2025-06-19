# 🛤️ אינטגרציה עם Railway

מדריך לשימוש בפונקציות הסנכרון עם שרת Railway.

## 📋 תוכן עניינים

- [הגדרה](#הגדרה)
- [פונקציות זמינות](#פונקציות-זמינות)
- [שימוש בקומפוננטה](#שימוש-בקומפוננטה)
- [API Endpoints](#api-endpoints)
- [דוגמאות קוד](#דוגמאות-קוד)
- [פתרון בעיות](#פתרון-בעיות)

## ⚙️ הגדרה

### 1. הגדרת משתני סביבה

צור קובץ `.env.local` בתיקיית הפרויקט והוסף את המשתנים הבאים:

```env
# כתובת ה-API של שרת Railway שלך
NEXT_PUBLIC_RAILWAY_API_URL=https://your-app-name.up.railway.app

# מפתח API (אופציונלי - אם נדרש אימות)
NEXT_PUBLIC_RAILWAY_API_KEY=your-api-key-here
```

### 2. הגדרת שרת Railway

וודא ששרת Railway שלך חושף את ה-endpoints הבאים:

- `GET /api/health` - בדיקת זמינות השרת
- `GET /api/lockers` - קבלת רשימת לוקרים
- `POST /api/lockers` - יצירת לוקר חדש
- `PUT /api/lockers/:id` - עדכון לוקר קיים
- `POST /api/lockers/status-update` - עדכון סטטוס לוקר

## 🔧 פונקציות זמינות

### 1. `sendLockerDataToRailway(lockerData)`

שולח נתוני לוקר חדש לשרת Railway.

```typescript
import { sendLockerDataToRailway } from '@/lib/railway-api'

const result = await sendLockerDataToRailway({
  id: "1",
  name: "לוקר ראשי",
  location: "קומה 1",
  ip: "192.168.1.100",
  deviceId: "ESP32_001",
  status: "ONLINE",
  lastSeen: new Date().toISOString(),
  isActive: true,
  cells: [...]
})

if (result.success) {
  console.log('✅ לוקר נשלח בהצלחה:', result.message)
} else {
  console.error('❌ שגיאה:', result.error)
}
```

### 2. `updateLockerDataInRailway(lockerId, updateData)`

מעדכן נתוני לוקר קיים ב-Railway.

```typescript
import { updateLockerDataInRailway } from '@/lib/railway-api'

const result = await updateLockerDataInRailway("1", {
  status: "OFFLINE",
  lastSeen: new Date().toISOString()
})
```

### 3. `sendLockerUpdateToRailway(updateData)`

שולח עדכון סטטוס לוקר מ-WebSocket.

```typescript
import { sendLockerUpdateToRailway } from '@/lib/railway-api'

const result = await sendLockerUpdateToRailway({
  type: 'lockerUpdate',
  data: {
    lockers: {
      "1": {
        isOnline: true,
        lastSeen: new Date().toISOString(),
        cells: {
          "A1": {
            id: "A1",
            locked: true,
            hasPackage: false
          }
        },
        ip: "192.168.1.100"
      }
    }
  },
  timestamp: Date.now()
})
```

### 4. `getLockersFromRailway()`

מביא רשימת לוקרים מ-Railway.

```typescript
import { getLockersFromRailway } from '@/lib/railway-api'

const result = await getLockersFromRailway()
if (result.success) {
  console.log('📦 לוקרים מ-Railway:', result.data)
}
```

### 5. `checkRailwayConnection()`

בודק חיבור לשרת Railway.

```typescript
import { checkRailwayConnection } from '@/lib/railway-api'

const result = await checkRailwayConnection()
if (result.success) {
  console.log('✅ חיבור תקין')
} else {
  console.error('❌ בעיית חיבור:', result.error)
}
```

## 🎨 שימוש בקומפוננטה

### RailwaySync Component

הקומפוננטה מספקת ממשק משתמש לסנכרון עם Railway:

```tsx
import RailwaySync from '@/components/RailwaySync'

function MyPage() {
  const handleSuccess = (message: string) => {
    console.log('✅ הצלחה:', message)
  }

  const handleError = (error: string) => {
    console.error('❌ שגיאה:', error)
  }

  return (
    <RailwaySync
      lockerData={myLockerData}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  )
}
```

### תכונות הקומפוננטה:

- 🔍 **בדיקת חיבור** - בודקת זמינות שרת Railway
- 📤 **שליחת לוקר חדש** - שולחת לוקר חדש לשרת
- 🔄 **עדכון לוקר** - מעדכנת לוקר קיים
- 📥 **קבלת רשימת לוקרים** - מביאה רשימה מ-Railway
- 📊 **מצג סטטוס** - מציגה סטטוס חיבור בזמן אמת
- 💬 **הודעות משוב** - מציגה הודעות הצלחה/שגיאה

## 🌐 API Endpoints

### 1. Health Check
```
GET /api/health
```

**תגובה:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 2. Get Lockers
```
GET /api/lockers
```

**תגובה:**
```json
{
  "lockers": [
    {
      "id": "1",
      "name": "לוקר ראשי",
      "location": "קומה 1",
      "status": "ONLINE",
      "cells": [...]
    }
  ]
}
```

### 3. Create Locker
```
POST /api/lockers
Content-Type: application/json

{
  "id": "1",
  "name": "לוקר חדש",
  "location": "קומה 2",
  "ip": "192.168.1.101",
  "deviceId": "ESP32_002",
  "status": "ONLINE",
  "cells": [...]
}
```

### 4. Update Locker
```
PUT /api/lockers/:id
Content-Type: application/json

{
  "status": "OFFLINE",
  "lastSeen": "2024-01-01T12:00:00Z"
}
```

### 5. Status Update
```
POST /api/lockers/status-update
Content-Type: application/json

{
  "type": "lockerUpdate",
  "data": {
    "lockers": {
      "1": {
        "isOnline": true,
        "lastSeen": "2024-01-01T12:00:00Z",
        "cells": {...}
      }
    }
  },
  "timestamp": 1704110400000
}
```

## 💡 דוגמאות קוד

### שליחת לוקר אוטומטית כשמתקבל מ-WebSocket

```typescript
// ב-websocket.ts
if (data.type === 'lockerUpdate') {
  console.log('🔄 עדכון סטטוס לוקרים:', data.lockers)
  
  // שליחת הנתונים לשרת Railway
  try {
    const railwayResult = await sendLockerUpdateToRailway(data as LockerUpdateData)
    if (railwayResult.success) {
      console.log('✅ עדכון נשלח בהצלחה ל-Railway')
    } else {
      console.warn('⚠️ שגיאה בשליחת עדכון ל-Railway:', railwayResult.error)
    }
  } catch (error) {
    console.error('❌ שגיאה בשליחת עדכון ל-Railway:', error)
  }
}
```

### המרת לוקר לפורמט Railway

```typescript
const convertLockerToRailwayFormat = (locker: Locker) => {
  return {
    id: locker.id.toString(),
    name: locker.name,
    location: locker.location,
    ip: locker.ip || '192.168.1.1',
    port: locker.port || 80,
    deviceId: locker.deviceId || `ESP32_${locker.id}`,
    status: locker.status as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE',
    lastSeen: locker.lastSeen || new Date().toISOString(),
    isActive: locker.isActive,
    cells: locker.cells.map(cell => ({
      id: cell.id.toString(),
      cellNumber: cell.cellNumber,
      code: cell.code,
      name: cell.name,
      size: cell.size as 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE',
      status: cell.status as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'LOCKED' | 'UNLOCKED',
      isLocked: cell.isLocked,
      isActive: cell.isActive,
      openCount: cell.openCount,
      lastOpenedAt: cell.lastOpenedAt
    }))
  }
}
```

## 🔧 פתרון בעיות

### שגיאה: "שגיאה בחיבור לשרת Railway"

**סיבות אפשריות:**
1. כתובת URL שגויה ב-`NEXT_PUBLIC_RAILWAY_API_URL`
2. שרת Railway לא פעיל
3. בעיית רשת

**פתרונות:**
1. בדוק את כתובת ה-URL ב-.env.local
2. וודא ששרת Railway פועל
3. בדוק חיבור לאינטרנט

### שגיאה: "HTTP 401: Unauthorized"

**סיבות אפשריות:**
1. מפתח API שגוי או חסר
2. שרת דורש אימות

**פתרונות:**
1. בדוק את `NEXT_PUBLIC_RAILWAY_API_KEY`
2. וודא שהמפתח תקף
3. בדוק את הגדרות האימות בשרת

### שגיאה: "HTTP 404: Not Found"

**סיבות אפשריות:**
1. Endpoint לא קיים בשרת
2. כתובת URL שגויה

**פתרונות:**
1. וודא שכל ה-endpoints קיימים בשרת Railway
2. בדוק את כתובת ה-URL

### שגיאה: "HTTP 500: Internal Server Error"

**סיבות אפשריות:**
1. שגיאה בשרת Railway
2. נתונים לא תקינים

**פתרונות:**
1. בדוק את לוגי השרת
2. וודא שהנתונים נשלחים בפורמט הנכון
3. בדוק את מסד הנתונים בשרת

## 📞 תמיכה

אם אתה נתקל בבעיות:

1. בדוק את ה-Console בדפדפן לשגיאות
2. וודא שכל המשתנים מוגדרים נכון
3. בדוק את לוגי השרת ב-Railway
4. פנה לתמיכה עם פרטי השגיאה

---

**🎉 מערכת הסנכרון עם Railway מוכנה לשימוש!** 