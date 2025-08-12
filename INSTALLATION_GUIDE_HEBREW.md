# 🔧 מדריך התקנת התיקונים למערכת הלוקר

## 🚨 התיקונים שבוצעו

### בעיות שזוהו ותוקנו:

1. **בעיית פרוטוקול**: Arduino שלח `cell` אבל השרת ציפה ל-`cellId`
2. **בעיית רישום**: מבנה התאים לא היה מלא בהודעת הרישום
3. **בעיית טיפול בהודעות**: חסרה תמיכה בפורמטים שונים
4. **בעיית הודעות סגירה**: השימוש ב-`cell` במקום `cellId` היה לא עקבי

## 📁 הקבצים שהשתנו:

### 1. שרת WebSocket (Railway):
- ✅ `src/lib/websocket-server.ts` - עודכן לתמוך הן ב-`cell` והן ב-`cellId`

### 2. קוד Arduino:
- ✅ `esp32-locker-firmware-FIXED.ino` - קוד מתוקן עם כל התיקונים

## 🔧 שלבי ההתקנה:

### שלב 1: עדכון שרת Railway

השרת כבר עודכן אוטומטית. התיקונים כוללים:
- תמיכה ב-`cell`, `cellId`, ו-`cellCode`
- שיפור הטיפול בהודעות רישום
- תמיכה טובה יותר בפורמטים שונים

### שלב 2: עדכון קוד Arduino

1. **פתח את Arduino IDE**
2. **טען את הקובץ החדש**: `esp32-locker-firmware-FIXED.ino`
3. **וודא התקנת הספריות הנדרשות**:
   ```
   - ArduinoJson (גרסה 6.x)
   - WebSocketsClient
   - PCF8574
   ```

4. **בדוק הגדרות החיבור**:
   ```cpp
   // וודא שהגדרות WiFi נכונות
   const char* password = "0508882403";
   String targetPrefix = "Elior 5g";
   
   // וודא שכתובת השרת נכונה
   const char* websocket_host = "lockerweb-production.up.railway.app";
   ```

5. **העלה את הקוד ל-ESP32**

### שלב 3: בדיקת החיבור

1. **פתח Serial Monitor** (115200 baud)
2. **אתחל את ESP32** (לחץ על כפתור Reset)
3. **בדוק את הלוגים**:

#### ✅ חיבור מוצלח:
```
🔍 סורק רשתות WiFi...
✅ WiFi מחובר! IP: 192.168.x.x
✅ WebSocket התחבר לשרת החומרה
📤 נשלח רישום לRailway: {"type":"register","id":"LOC632",...}
```

#### ❌ חיבור כושל:
```
❌ WiFi נכשל
❌ WebSocket נותק מRailway
```

### שלב 4: בדיקת פונקציונליות

1. **בדוק בלוגים של Railway**:
   ```bash
   railway logs
   ```
   אמור להראות:
   ```
   📝 נרשם לוקר LOC632 מכתובת xxx.xxx.xxx.xxx
   ```

2. **נסה לפתוח תא** דרך ממשק הניהול
3. **בדוק שה-ESP32 מגיב** בSerial Monitor

## 🔍 התיקונים הטכניים שבוצעו:

### בקוד Arduino:

1. **תיקון הודעת רישום**:
   ```cpp
   // לפני:
   cellA1["locked"] = true;
   
   // אחרי:
   cellA1["locked"] = true;
   cellA1["opened"] = false;      // הוספה
   cellA1["hasPackage"] = false;  // הוספה
   ```

2. **תיקון טיפול בהודעות unlock**:
   ```cpp
   // תמיכה הן ב-cellId והן ב-cell
   if (doc.containsKey("cellId")) {
     cell = doc["cellId"].as<String>();
   } else if (doc.containsKey("cell")) {
     cell = doc["cell"].as<String>();
   }
   ```

3. **תיקון הודעות cellClosed**:
   ```cpp
   doc["cellId"] = cell;  // תיקון עיקרי
   doc["cell"] = cell;    // לתאימות לאחור
   ```

### בשרת Railway:

1. **תמיכה בפורמטים מרובים**:
   ```typescript
   const cellId = data.cellId || data.cellCode || data.cell;
   ```

2. **שיפור לוגים**:
   ```typescript
   cellId: data.cellId || data.cellCode || data.cell,
   cell: data.cell, // הוספה
   ```

## 🚨 נקודות חשובות:

1. **מזהה הלוקר**: וודא ש-ESP32 יוצר מזהה `LOC632` או `LOC720`
2. **רשת WiFi**: וודא חיבור יציב לרשת
3. **כתובת שרת**: וודא שהכתובת `lockerweb-production.up.railway.app` נגישה
4. **פורטים**: WebSocket דרך פורט 443 (HTTPS)

## 🧪 בדיקות לאחר התקנה:

### בדיקה 1: חיבור WiFi
```
🔗 מתחבר ל-Elior 5g
✅ WiFi מחובר! IP: 192.168.x.x
```

### בדיקה 2: חיבור WebSocket
```
✅ WebSocket התחבר לשרת החומרה
📤 נשלח רישום לRailway
```

### בדיקה 3: רישום בשרת
ב-Railway logs:
```
📝 נרשם לוקר LOC632 מכתובת xxx.xxx.xxx.xxx
💾 נתוני לוקר LOC632 נשמרו ב-Railway
```

### בדיקה 4: פתיחת תא
```
🔓 נפתח תא A1 עבור LOC632
📤 נשלח סטטוס: {"type":"cellClosed",...}
```

## 🆘 פתרון בעיות נפוצות:

### בעיה: WiFi לא מתחבר
**פתרון**: בדוק שם רשת וסיסמה
```cpp
const char* password = "0508882403";
String targetPrefix = "Elior 5g";
```

### בעיה: WebSocket לא מתחבר
**פתרון**: בדוק כתובת שרת וחיבור אינטרנט
```cpp
const char* websocket_host = "lockerweb-production.up.railway.app";
```

### בעיה: לוקר לא נרשם
**פתרון**: בדוק שהמזהה במתחם המורשה (LOC632/LOC720)

### בעיה: תא לא נפתח
**פתרון**: בדוק חיבורי I2C ופינים

## 📞 תמיכה נוספת

אם יש בעיות נוספות:
1. בדוק Serial Monitor ב-Arduino
2. בדוק Railway logs
3. וודא שכל הקישורים הפיזיים תקינים

## ✅ סיכום

לאחר ביצוע התיקונים, המערכת אמורה לעבוד כך:
1. ESP32 מתחבר ל-WiFi
2. ESP32 מתחבר לשרת Railway דרך WebSocket
3. ESP32 נרשם בהצלחה בשרת
4. פקודות פתיחה עובדות דרך ממשק הניהול
5. מעקב אחר סטטוס התאים פועל

המערכת כעת תומכת בכל הפורמטים (`cell`, `cellId`, `cellCode`) ואמורה לעבוד בצורה יציבה.
