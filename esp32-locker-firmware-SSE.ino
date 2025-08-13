#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <Wire.h>
#include <PCF8574.h>

#define WIFI_STATUS_LED 18
#define WS_STATUS_LED 19
#define CELL_A1_STATUS_PIN 20   // משוב תא A1 - מחובר ל-GPIO2

volatile bool receivedCloseConfirmation = false;

// 🛜 הגדרות WiFi
const char* password = "0508882403";
String targetPrefix = "Elior 5g";

// 🌐 הגדרות API - שרת החומרה ב-Railway
const char* api_host = "lockerweb-production.up.railway.app";
const char* api_endpoint = "/api/ws";

HTTPClient http;
WebServer server(80);
Preferences prefs;

String bestSSID = "";
String deviceId = "";
const int cellPin = RGB_BUILTIN;

// 🧠 מרחיב פינים I2C
PCF8574 expander(0x20, &Wire);
PCF8574 expander2(0x21, &Wire);

// ⏰ טיימרים
unsigned long lastPingTime = 0;
unsigned long lastRegisterTime = 0;
unsigned long lastCommandCheck = 0;
const unsigned long pingInterval = 30000;    // 30 שניות
const unsigned long registerInterval = 60000; // דקה
const unsigned long commandCheckInterval = 5000; // 5 שניות

// יצירת מזהה קבוע
String generateFixedDeviceId() {
  if (prefs.begin("locker", true)) {
    String savedId = prefs.getString("deviceId", "");
    prefs.end();
    if (savedId != "") return savedId;
  }

  uint64_t chipId = ESP.getEfuseMac();
  int uniqueNumber = chipId % 1000;
  char idBuffer[10];
  sprintf(idBuffer, "LOC%03d", uniqueNumber);
  String newId = String(idBuffer);

  if (prefs.begin("locker", false)) {
    prefs.putString("deviceId", newId);
    prefs.end();
  }
  return newId;
}

// שליחת הודעה ל-API
bool sendToAPI(DynamicJsonDocument& doc) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi לא מחובר - לא ניתן לשלוח הודעה");
    return false;
  }

  String url = "https://" + String(api_host) + String(api_endpoint);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.printf("📤 שולח ל-API: %s\n", jsonString.c_str());
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("📥 תגובה מ-API (%d): %s\n", httpCode, response.c_str());
    
    // עיבוד תגובה
    DynamicJsonDocument responseDoc(512);
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      String responseType = responseDoc["type"].as<String>();
      
      if (responseType == "confirmClose") {
        String cellId = responseDoc["cellId"].as<String>();
        if (cellId == "A1") {
          receivedCloseConfirmation = true;
          Serial.println("✅ אישור סגירה התקבל מ-API");
        }
      }
    }
    
    http.end();
    return (httpCode == 200);
  } else {
    Serial.printf("❌ שגיאה בשליחה ל-API: %d\n", httpCode);
    http.end();
    return false;
  }
}

// רישום במערכת
void registerWithServer() {
  Serial.println("📝 רושם במערכת...");
  
  DynamicJsonDocument doc(512);
  doc["type"] = "register";
  doc["id"] = deviceId;
  doc["ip"] = WiFi.localIP().toString();
  doc["status"] = "online";
  
  JsonObject cells = doc.createNestedObject("cells");
  JsonObject cellA1 = cells.createNestedObject("A1");
  cellA1["locked"] = true;
  cellA1["opened"] = false;
  cellA1["hasPackage"] = false;
  
  if (sendToAPI(doc)) {
    Serial.println("✅ רישום הצליח");
    digitalWrite(WS_STATUS_LED, LOW);
  } else {
    Serial.println("❌ רישום נכשל");
    digitalWrite(WS_STATUS_LED, HIGH);
  }
}

// שליחת פינג
void sendPing() {
  DynamicJsonDocument doc(128);
  doc["type"] = "ping";
  doc["id"] = deviceId;
  
  if (sendToAPI(doc)) {
    Serial.println("🏓 פינג נשלח בהצלחה");
  }
}

// בדיקת פקודות ממתינות
void checkPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  String url = "https://" + String(api_host) + "/api/arduino/commands?deviceId=" + deviceId;
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.printf("📥 בדיקת פקודות: %s\n", response.c_str());
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("commands")) {
      JsonArray commands = doc["commands"];
      
      for (JsonObject command : commands) {
        String type = command["type"].as<String>();
        String cell = command["cell"].as<String>();
        
        Serial.printf("📨 מבצע פקודה: %s תא %s\n", type.c_str(), cell.c_str());
        
        if (type == "unlock") {
          bool success = unlockCell(cell);
          Serial.printf("✅ פקודת פתיחה %s: %s\n", success ? "הצליחה" : "נכשלה", cell.c_str());
        }
      }
    }
  } else if (httpCode != 304) { // 304 = Not Modified (אין פקודות חדשות)
    Serial.printf("⚠️ שגיאה בבדיקת פקודות: %d\n", httpCode);
  }
  
  http.end();
}

// טיפול בהודעות HTTP מקומיות
void handleLocker() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }

  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"Missing body\"}");
    return;
  }

  String body = server.arg("plain");
  Serial.println("📨 פקודה מקומית התקבלה: " + body);

  DynamicJsonDocument doc(512);
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    server.send(400, "application/json", "{\"error\":\"Bad JSON\"}");
    return;
  }

  String action = doc["action"];
  String cell = doc["cell"];

  if (action == "unlock") {
    if (cell == "") {
      server.send(400, "application/json", "{\"error\":\"Missing cellId\"}");
      return;
    }

    bool success = unlockCell(cell);

    DynamicJsonDocument response(512);
    response["success"] = success;
    response["message"] = success ? "תא נפתח בהצלחה" : "שגיאה בפתיחת תא";
    response["deviceId"] = deviceId;
    response["cell"] = cell;

    String jsonString;
    serializeJson(response, jsonString);
    server.send(200, "application/json", jsonString);
  }
  else if (action == "ping") {
    DynamicJsonDocument response(256);
    response["pong"] = true;
    response["deviceId"] = deviceId;
    response["status"] = "online";

    String jsonString;
    serializeJson(response, jsonString);
    server.send(200, "application/json", jsonString);
  }
  else {
    server.send(400, "application/json", "{\"error\":\"Unknown action\"}");
  }
}

void writePin(int pinNumber, int value) {
  if (pinNumber < 8) {
    Serial.printf("🖊 כתיבה ל־expander (0x20) פין %d ערך %d\n", pinNumber, value);
    expander.write(pinNumber, value);
  } else {
    Serial.printf("🖊 כתיבה ל־expander2 (0x21) פין %d ערך %d\n", pinNumber - 8, value);
    expander2.write(pinNumber - 8, value);
  }
}

// התחברות WiFi
void connectToWiFi() {
  Serial.println("🔍 סורק רשתות WiFi...");
  int n = WiFi.scanNetworks();
  int bestRSSI = -999;
  
  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    Serial.printf("[%d] '%s' | RSSI: %d\n", i + 1, ssid.c_str(), WiFi.RSSI(i));
    if (ssid.startsWith(targetPrefix) && WiFi.RSSI(i) > bestRSSI) {
      bestSSID = ssid;
      bestRSSI = WiFi.RSSI(i);
    }
  }

  if (bestSSID == "") {
    Serial.println("❌ לא נמצאה רשת מתאימה");
    writePin(0, HIGH);
    return;
  }

  Serial.printf("🔗 מתחבר ל-%s עם סיסמה: %s\n", bestSSID.c_str(), password);
  Serial.println(WiFi.macAddress());

  WiFi.begin(bestSSID.c_str(), password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi מחובר! IP: %s\n", WiFi.localIP().toString().c_str());
    digitalWrite(WIFI_STATUS_LED, LOW);
  } else {
    Serial.println("\n❌ WiFi נכשל");
    digitalWrite(WIFI_STATUS_LED, HIGH);
  }
}

bool isCellClosed(int cellNumber) {
  if (cellNumber != 1) {
    Serial.printf("⚠️ משוב זמין רק עבור A1, התבקש תא A%d\n", cellNumber);
    return true; // אין משוב לשאר התאים, נניח שסגור
  }

  int value = digitalRead(CELL_A1_STATUS_PIN);
  Serial.printf("👁 A1(GPIO %d) = %d → %s\n", CELL_A1_STATUS_PIN, value, value == LOW ? "🔒 סגור" : "🔓 פתוח");
  return value == LOW; // 0V = סגור
}

bool unlockCell(String cell) {
  int pin = -1;
  int cellNumber = -1;

  if (cell.startsWith("A")) {
    cellNumber = cell.substring(1).toInt();
    if (cellNumber >= 1 && cellNumber <= 16) {
      pin = cellNumber - 1;
    }
  }

  if (pin == -1) {
    Serial.printf("⚠️ מזהה תא לא תקין: %s\n", cell.c_str());
    return false;
  }

  // פתיחת התא
  writePin(pin, LOW);
  delay(1500);
  writePin(pin, HIGH);
  Serial.printf("✅ תא %s נפתח (פין %d)\n", cell.c_str(), pin);

  // רק ל־A1 יש משוב
  if (cell != "A1") return true;

  delay(1500); // המתנה קצרה

  // בדיקה: האם התא באמת נפתח
  bool opened = !isCellClosed(1); // true = פתוח
  if (!opened) {
    Serial.println("❌ התא לא נפתח בכלל. שליחת הודעת כישלון...");

    DynamicJsonDocument failDoc(256);
    failDoc["type"] = "failedToUnlock";
    failDoc["id"] = deviceId;
    failDoc["cell"] = cell;
    failDoc["reason"] = "did_not_open";

    sendToAPI(failDoc);
    Serial.println("📤 נשלחה הודעת כישלון לשרת");

    return false;
  }

  // התחלת לולאה: המתנה לסגירה + אישור מהשרת
  Serial.println("🕒 ממתין לסגירת תא A1 ואישור מהשרת...");
  receivedCloseConfirmation = false;

  while (true) {
    bool closed = isCellClosed(1);

    DynamicJsonDocument doc(256);
    doc["type"] = "cellClosed";
    doc["id"] = deviceId;
    doc["cellId"] = cell;
    doc["status"] = closed ? "closed" : "open";

    sendToAPI(doc);
    Serial.printf("📤 נשלח סטטוס סגירה: %s\n", closed ? "סגור" : "פתוח");

    if (closed) {
      Serial.println("✅ A1 נסגר ואושר ע״י המשוב של מנעול תא");
      break;
    }

    delay(500);
  }

  return true;
}

void debugPrintAllCellsStatus() {
  int v = digitalRead(CELL_A1_STATUS_PIN);
  Serial.printf("A1: %s\n", (v == LOW) ? "🔒 סגור" : "🔓 פתוח");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  // הגדרת נוריות סטטוס
  pinMode(WIFI_STATUS_LED, OUTPUT);
  pinMode(WS_STATUS_LED, OUTPUT);
  pinMode(CELL_A1_STATUS_PIN, INPUT_PULLUP);
  digitalWrite(WIFI_STATUS_LED, HIGH);
  digitalWrite(WS_STATUS_LED, HIGH);

  // הגדרת ערוצי I2C
  Wire.begin(4, 5);

  Serial.println("🔍 סורק רכיבי I2C...");
  bool expanderFound = false;

  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("✅ נמצא רכיב I2C בכתובת: 0x%02X\n", address);
      if (address == 0x20) expanderFound = true;
    }
  }

  if (!expanderFound) {
    Serial.println("❌ מרחיב PCF8574 בכתובת 0x20 לא נמצא. עצירה.");
    while (true);
  }

  // אתחול המרחיבים
  expander.begin();
  expander2.begin();

  Serial.println("🟢 כל מרחיבי ה־PCF8574 הופעלו בהצלחה");

  // אתחול כל הפינים כפלט HIGH (כיבוי מנעולים)
  for (int i = 0; i < 8; i++) {
    expander.write(i, HIGH);
    expander2.write(i, HIGH);
  }

  // נורית מצב תא
  pinMode(cellPin, OUTPUT);
  digitalWrite(cellPin, LOW);

  // מזהה קבוע
  deviceId = generateFixedDeviceId();
  Serial.printf("📛 מזהה ESP32: %s\n", deviceId.c_str());

  // WiFi
  connectToWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    // הגדרת HTTP
    server.on("/locker", handleLocker);
    server.begin();
    Serial.println("🟢 HTTP server פעיל על פורט 80");

    // רישום ראשוני
    registerWithServer();
  }
}

void loop() {
  server.handleClient();

  // רק אם WiFi מחובר
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    
    // פינג תקופתי
    if (now - lastPingTime > pingInterval) {
      sendPing();
      lastPingTime = now;
    }
    
    // רישום מחדש תקופתי
    if (now - lastRegisterTime > registerInterval) {
      registerWithServer();
      lastRegisterTime = now;
    }
    
    // בדיקת פקודות ממתינות
    if (now - lastCommandCheck > commandCheckInterval) {
      checkPendingCommands();
      lastCommandCheck = now;
    }
  }

  // ניטור מצב WiFi
  static bool lastWiFiConnected = false;
  bool currentWiFiConnected = (WiFi.status() == WL_CONNECTED);

  if (currentWiFiConnected != lastWiFiConnected) {
    if (currentWiFiConnected) {
      Serial.println("📶 WiFi התחבר");
      digitalWrite(WIFI_STATUS_LED, LOW);
      registerWithServer(); // רישום מחדש אחרי חיבור
    } else {
      Serial.println("📴 WiFi התנתק");
      digitalWrite(WIFI_STATUS_LED, HIGH);
      digitalWrite(WS_STATUS_LED, HIGH);
    }
    lastWiFiConnected = currentWiFiConnected;
  }

  // ניסיון חיבור מחדש ל-WiFi כל 15 שניות
  static unsigned long lastReconnectAttempt = 0;
  const unsigned long reconnectInterval = 15000;

  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > reconnectInterval) {
      Serial.println("🔁 מנסה להתחבר מחדש ל-WiFi...");
      WiFi.begin(bestSSID.c_str(), password);
      lastReconnectAttempt = now;
    }
  }
}
