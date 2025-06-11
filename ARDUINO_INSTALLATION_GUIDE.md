# 🔧 מדריך התקנת קוד Arduino למערכת לוקרים חכמים

## 📋 מה תצטרך:

### חומרה:
- **ESP32 DevKit** (או כל דגם ESP32)
- **כבל USB** לחיבור למחשב
- **מעגל לוקרים** (לבדיקה מאוחר יותר)

### תוכנה:
- **Arduino IDE** (גרסה 1.8.19 או חדשה יותר)
- **מנהל התקן ESP32** (יותקן אוטומטית)

---

## 🔄 שלב 1: הורדה והתקנת Arduino IDE

1. **הורד Arduino IDE:**
   - גש לאתר: https://www.arduino.cc/en/software
   - הורד גרסה עבור Windows
   - התקן במיקום ברירת המחדל

2. **הפעל Arduino IDE:**
   - פתח את התוכנה
   - המתן לטעינה מלאה

---

## 📡 שלב 2: הוספת תמיכה ב-ESP32

1. **הוסף URL של ESP32:**
   - לך ל: `File` → `Preferences`
   - בשדה "Additional Boards Manager URLs" הכנס:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   - לחץ OK

2. **התקן ESP32 Board Package:**
   - לך ל: `Tools` → `Board` → `Boards Manager`
   - חפש "ESP32"
   - מצא "esp32 by Espressif Systems"
   - לחץ `Install`
   - המתן לסיום ההתקנה (כמה דקות)

---

## 📚 שלב 3: התקנת ספריות נדרשות

1. **פתח Library Manager:**
   - לך ל: `Tools` → `Manage Libraries`

2. **התקן ArduinoJson:**
   - חפש "ArduinoJson"
   - מצא "ArduinoJson by Benoit Blanchon"
   - לחץ `Install`
   - בחר בגרסה העדכנית ביותר

---

## 🛠️ שלב 4: הכנת הקוד

1. **פתח את קוד Arduino:**
   - פתח את הקובץ `esp32-locker-firmware.ino` מהתיקיה

2. **עדכן הגדרות WiFi:**
   עדכן בשורות 5-6:
   ```arduino
   const char* ssid = "שם_הרשת_שלך";
   const char* password = "סיסמת_הרשת_שלך";
   ```

3. **שמור את הקובץ:**
   - לחץ `Ctrl+S`
   - שמור עם השם שכבר קיים

---

## 🔌 שלב 5: חיבור ESP32 למחשב

1. **חבר ESP32:**
   - חבר את ה-ESP32 למחשב עם כבל USB
   - המתן לזיהוי המכשיר (כמה שניות)

2. **בחר את הלוח הנכון:**
   - לך ל: `Tools` → `Board` → `ESP32 Arduino`
   - בחר: `ESP32 Dev Module`

3. **בחר את הפורט:**
   - לך ל: `Tools` → `Port`
   - בחר את הפורט עם "ESP32" או "CP210x" בשם

---

## ⬆️ שלב 6: העלאת הקוד

1. **ודא הגדרות:**
   - Board: "ESP32 Dev Module"
   - Upload Speed: "921600"
   - CPU Frequency: "240MHz (WiFi/BT)"
   - Flash Frequency: "80MHz"
   - Flash Mode: "QIO"
   - Flash Size: "4MB (32Mb)"
   - Partition Scheme: "Default 4MB with spiffs"

2. **העלה את הקוד:**
   - לחץ על כפתור ה-Upload (חץ כלפי ימין)
   - המתן לקומפילציה (1-2 דקות)
   - המתן להעלאה (30 שניות)

3. **בדוק הודעות:**
   ```
   Sketch uses 243,000 bytes (18%) of program storage space
   Global variables use 13,000 bytes (39%) of dynamic memory
   Hard resetting via RTS pin...
   ```

---

## 🔍 שלב 7: בדיקת הפעולה

1. **פתח Serial Monitor:**
   - לחץ על `Tools` → `Serial Monitor`
   - הגדר baud rate ל: `115200`

2. **אתחל את ESP32:**
   - לחץ על כפתור RESET על ה-ESP32
   - אמורות להופיע ההודעות הבאות:

```
🚀 מתחיל ESP32 Smart Locker...
📌 פינים אותחלו
🔌 מתחבר לWiFi.....
✅ WiFi מחובר!
📍 כתובת IP: 192.168.1.xxx
✅ שרת HTTP פועל
🔄 מצבי תאים אותחלו
✅ ESP32 Smart Locker מוכן לשימוש!
```

3. **רשום את כתובת IP:**
   - תזדקק לה מאוחר יותר לחיבור מהשרת

---

## 🌐 שלב 8: בדיקה בדפדפן

1. **גש לכתובת ESP32:**
   - פתח דפדפן
   - הכנס את כתובת ה-IP: `http://192.168.1.xxx`

2. **אמור לראות:**
   - מסך מידע עם פרטי הלוקר
   - טבלה עם מצב כל התאים
   - זמן פעולה של המערכת

---

## ⚙️ שלב 9: עדכון השרת

1. **עדכן כתובת IP בשרת:**
   עדכן בקובץ `locker-hardware-server.js`:
   ```javascript
   ESP32Controller.registerESP32('LOC001', '192.168.1.xxx', 80);
   ```

2. **הפעל מחדש את השרת:**
   ```bash
   node locker-hardware-server.js
   ```

---

## 🚨 פתרון בעיות נפוצות

### ❌ ESP32 לא מזוהה:
- בדוק כבל USB
- התקן מנהל התקן CP210x או CH340
- נסה פורט USB אחר

### ❌ שגיאת קומפילציה:
- ודא שהספריות מותקנות נכון
- בדוק שבחרת את הלוח הנכון
- עדכן Arduino IDE לגרסה עדכנית

### ❌ לא מתחבר ל-WiFi:
- בדוק שם רשת וסיסמה
- ודא שה-ESP32 בטווח הרשת
- נסה רשת 2.4GHz (לא 5GHz)

### ❌ השרת לא עובד:
- בדוק Serial Monitor לשגיאות
- ודא שהפורט 80 פנוי
- אתחל את ה-ESP32

---

## ✅ בדיקה מהירה

**פקודת בדיקה בטרמינל:**
```bash
curl -X POST http://192.168.1.xxx/locker \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"ping\"}"
```

**תגובה צפויה:**
```json
{
  "success": true,
  "message": "ESP32 פעיל ומחובר",
  "lockerId": "LOC001",
  "timestamp": 1234567890
}
```

---

## 🎉 סיום

כעת ESP32 שלך מוכן ופועל!
המערכת תזהה אוטומטית פתיחה וסגירה של תאים ותעדכן את השרת הראשי.

**הצעד הבא:** חבר את החומרה הפיזית (ממסרים וחיישנים) לפי התרשים שבהוראות המלאות. 