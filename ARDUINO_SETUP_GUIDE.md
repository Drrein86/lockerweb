# 🚀 מדריך הגדרת Arduino ESP32 עם שרת WebSocket

## 📋 דרישות מערכת

### חומרה נדרשת:
- ESP32 Development Board
- 2x PCF8574 I/O Expander (0x20, 0x21)
- חיישן מגנטי לתא A1 (Reed Switch)
- נוריות LED לסטטוס (GPIO 18, 19)
- ממסרים לפתיחת מנעולים
- חיבורי I2C (SDA: GPIO4, SCL: GPIO5)

### ספריות Arduino נדרשות:
```
WiFi.h
WebServer.h
ArduinoJson.h
WebSocketsClient.h
Preferences.h
Wire.h
PCF8574.h
```

## 🔧 הגדרת חומרה

### חיבורי I2C:
```
ESP32 GPIO4 → SDA
ESP32 GPIO5 → SCL
VCC → 3.3V
GND → GND
```

### חיבורי PCF8574:
```
PCF8574 (0x20):
- פינים 0-7 → ממסרים לתאים A1-A8

PCF8574 (0x21):
- פינים 0-7 → ממסרים לתאים A9-A16
```

### חיישן תא A1:
```
GPIO 20 → חיישן מגנטי (Reed Switch)
```

### נוריות סטטוס:
```
GPIO 18 → נורית סטטוס WiFi
GPIO 19 → נורית סטטוס WebSocket
```

## ⚙️ הגדרת קוד

### 1. הגדרות WiFi
```cpp
const char* password = "0508882403";
String targetPrefix = "Elior 5g";
```

### 2. הגדרות WebSocket
```cpp
const char* websocket_host = "lockerweb-production.up.railway.app";
const int websocket_port = 443;
const char* websocket_path = "/";
```

### 3. מזהה לוקר
הקוד ייצור מזהה אוטומטי בפורמט `LOCxxx` (לדוגמה: `LOC632`)

## 🔄 זרימת עבודה

### 1. אתחול המערכת
1. סריקת רשתות WiFi
2. חיבור לרשת המתאימה
3. אתחול מרחיבי I2C
4. חיבור לשרת WebSocket
5. רישום במערכת

### 2. תקשורת עם השרת
- **פינג**: כל 10 שניות
- **רישום**: בעת חיבור
- **עדכוני סטטוס**: בעת שינוי מצב תאים

### 3. פתיחת תאים
- קבלת פקודה מהשרת
- הפעלת ממסר
- בדיקת משוב (לתא A1 בלבד)
- שליחת אישור לשרת

## 📡 פרוטוקול תקשורת

### הודעות נשלחות לשרת:
```json
// רישום
{
  "type": "register",
  "id": "LOC632",
  "ip": "192.168.1.100",
  "cells": {
    "A1": {"locked": true}
  }
}

// פינג
{
  "type": "ping",
  "id": "LOC632"
}

// עדכון סטטוס תא
{
  "type": "cellClosed",
  "id": "LOC632",
  "cell": "A1",
  "status": "closed"
}
```

### הודעות מתקבלות מהשרת:
```json
// פתיחה ע"י לקוח
{
  "type": "openByClient",
  "lockerId": "LOC632",
  "cellId": "A1",
  "packageId": "PKG123",
  "clientToken": "token123"
}

// פקודת פתיחה רגילה
{
  "type": "unlock",
  "cell": "A1"
}

// פונג
{
  "type": "pong",
  "id": "LOC632"
}
```

## 🛠️ פתרון בעיות

### בעיות חיבור WiFi:
1. בדוק שהרשת קיימת
2. בדוק סיסמה
3. בדוק עוצמת אות

### בעיות WebSocket:
1. בדוק כתובת שרת
2. בדוק חיבור אינטרנט
3. בדוק נורית סטטוס

### בעיות חומרה:
1. בדוק חיבורי I2C
2. בדוק כתובות PCF8574
3. בדוק חיישן תא A1

## 📊 ניטור מערכת

### נוריות סטטוס:
- **GPIO 18 (WiFi)**: כבוי = מחובר, דולק = לא מחובר
- **GPIO 19 (WebSocket)**: כבוי = מחובר, דולק = לא מחובר

### לוגים סריאל:
```
🔍 סורק רשתות WiFi...
✅ WiFi מחובר! IP: 192.168.1.100
📡 נרשם לוקר LOC632
🟢 WebSocket התחבר לשרת
📤 נשלח פינג לRailway
```

## 🔧 הגדרות מתקדמות

### שינוי מזהה לוקר:
```cpp
// בקובץ Arduino
String deviceId = "LOC720"; // במקום generateFixedDeviceId()
```

### שינוי כתובת שרת:
```cpp
const char* websocket_host = "your-server.com";
const int websocket_port = 443;
```

### הוספת תאים נוספים:
```cpp
// הוספת פינים למרחיבים
// הוספת חיישנים
// עדכון פונקציות
```

## 📞 תמיכה

לבעיות טכניות או שאלות:
1. בדוק לוגים סריאל
2. בדוק חיבורי חומרה
3. בדוק הגדרות רשת
4. פנה לתמיכה טכנית

---

**הערה**: קוד זה מתוכנן לעבוד עם שרת WebSocket ב-Railway. וודא שהשרת פעיל ונגיש לפני הפעלת ה-Arduino. 