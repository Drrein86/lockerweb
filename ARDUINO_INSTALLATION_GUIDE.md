# מדריך התקנת Arduino IDE ו-ESP32

## התקנת Arduino IDE

1. הורד את Arduino IDE מהאתר הרשמי: https://www.arduino.cc/en/software
2. התקן את התוכנה על המחשב

## הוספת ESP32 Board Manager

1. פתח Arduino IDE
2. עבור ל File > Preferences
3. ב-"Additional Board Manager URLs" הוסף:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. עבור ל Tools > Board > Boards Manager
5. חפש "esp32" והתקן את "ESP32 by Espressif Systems"

## התקנת ספריות נדרשות

עבור ל Tools > Manage Libraries והתקן:

1. **ArduinoJson** by Benoit Blanchon
2. **WebSockets** by Markus Sattler

## הגדרת הבורד

1. חבר את ESP32 למחשב
2. ב Tools > Board בחר: "ESP32 Dev Module"
3. ב Tools > Port בחר את הפורט המתאים

## פתרון בעיות קומפילציה

### שגיאה: "Unable to handle compilation, expected exactly one compiler job"

**פתרונות:**

1. **בדוק בחירת בורד:**
   - Tools > Board > בחר "ESP32 Dev Module"
   - אם לא מופיע, וודא שהתקנת את ESP32 board package

2. **התקן ספריות חסרות:**
   ```
   ArduinoJson (גרסה 6.x)
   WebSockets by Markus Sattler
   ```

3. **נקה ובנה מחדש:**
   - Sketch > Verify/Compile (Ctrl+R)
   - אם נכשל, סגור Arduino IDE ופתח מחדש

4. **בדוק שם קובץ:**
   - הקובץ חייב להיות עם סיומת `.ino`
   - הקובץ חייב להיות בתיקייה עם אותו שם

5. **עדכן Arduino IDE:**
   - השתמש בגרסה 2.x החדשה
   - או גרסה 1.8.19 לפחות

### אם השגיאה נמשכת:

1. צור פרויקט ESP32 חדש
2. העתק את הקוד לקובץ החדש
3. שמור בתיקייה חדשה עם שם תואם 