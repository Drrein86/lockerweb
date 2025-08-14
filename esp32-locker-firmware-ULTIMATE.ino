#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <Wire.h>
#include <PCF8574.h>

#define WIFI_STATUS_LED 18
#define WS_STATUS_LED 19
#define CELL_A1_STATUS_PIN 20   // משוב תא A1

volatile bool receivedCloseConfirmation = false;

// 🛜 הגדרות WiFi
const char* password = "0508882403";
String targetPrefix = "Elior 5g";

// 🌐 הגדרות API החדש - שרת ב-Railway (ULTIMATE VERSION)
const char* api_host = "lockerweb-production.up.railway.app";
const char* api_endpoint = "/api/ws";
const char* commands_endpoint = "/api/arduino/commands";

HTTPClient http;
WebServer server(80);
Preferences prefs;

String bestSSID = "";
String deviceId = "";
const int cellPin = RGB_BUILTIN;

// 🧠 מרחיב פינים I2C
PCF8574 expander(0x20, &Wire);
PCF8574 expander2(0x21, &Wire);

// ⏰ טיימרים מתקדמים
unsigned long lastPingTime = 0;
unsigned long lastRegisterTime = 0;
unsigned long lastCommandCheck = 0;
unsigned long lastHealthCheck = 0;
unsigned long lastStatusBroadcast = 0;

// 🎛️ הגדרות מתקדמות (ULTIMATE)
const unsigned long pingInterval = 30000;        // 30 שניות
const unsigned long registerInterval = 60000;    // דקה
const unsigned long commandCheckInterval = 3000;  // 3 שניות (מהיר יותר!)
const unsigned long healthCheckInterval = 120000; // 2 דקות
const unsigned long statusBroadcastInterval = 45000; // 45 שניות

// 📊 סטטיסטיקות מתקדמות (ULTIMATE)
struct Stats {
  unsigned long totalCommands = 0;
  unsigned long successfulUnlocks = 0;
  unsigned long failedUnlocks = 0;
  unsigned long totalPings = 0;
  unsigned long totalRegistrations = 0;
  unsigned long uptime = 0;
  unsigned long lastResetTime = 0;
} stats;

// 🔄 ניהול חיבורים מתקדם (ULTIMATE)
struct ConnectionStatus {
  bool isOnline = false;
  unsigned long lastApiCall = 0;
  int consecutiveFailures = 0;
  int httpResponseCode = 0;
  String lastError = "";
} connectionStatus;

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

// 📡 שליחת הודעה ל-API (ULTIMATE VERSION)
bool sendToAPI(DynamicJsonDocument& doc, bool isRetryable = true) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi לא מחובר - לא ניתן לשלוח הודעה");
    connectionStatus.lastError = "WiFi disconnected";
    return false;
  }

  String url = "https://" + String(api_host) + String(api_endpoint);
  
  // 🔄 מנגנון retry מתקדם (ULTIMATE)
  int maxRetries = isRetryable ? 3 : 1;
  
  for (int attempt = 1; attempt <= maxRetries; attempt++) {
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", String("ESP32-Locker/") + deviceId);
    http.setTimeout(10000); // 10 שניות timeout
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.printf("📤 ניסיון %d/%d שולח ל-API: %s\n", attempt, maxRetries, jsonString.c_str());
    
    int httpCode = http.POST(jsonString);
    connectionStatus.lastApiCall = millis();
    connectionStatus.httpResponseCode = httpCode;
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.printf("📥 תגובה מ-API (%d): %s\n", httpCode, response.c_str());
      
      if (httpCode == 200) {
        connectionStatus.isOnline = true;
        connectionStatus.consecutiveFailures = 0;
        connectionStatus.lastError = "";
        
        // עיבוד תגובה מתקדם
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
          
          if (responseType == "registerSuccess") {
            stats.totalRegistrations++;
            Serial.println("✅ רישום אושר על ידי השרת");
          }
          
          if (responseType == "pong") {
            stats.totalPings++;
            Serial.println("🏓 פונג התקבל מהשרת");
          }
        }
        
        http.end();
        return true;
      }
    }
    
    // כישלון - נסה שוב
    connectionStatus.consecutiveFailures++;
    connectionStatus.lastError = "HTTP " + String(httpCode);
    
    Serial.printf("❌ שגיאה בניסיון %d: HTTP %d\n", attempt, httpCode);
    http.end();
    
    if (attempt < maxRetries) {
      delay(1000 * attempt); // exponential backoff
    }
  }
  
  connectionStatus.isOnline = false;
  Serial.printf("❌ כל הניסיונות נכשלו אחרי %d ניסיונות\n", maxRetries);
  return false;
}

// 📝 רישום במערכת (ULTIMATE VERSION)
void registerWithServer() {
  Serial.println("📝 רושם במערכת...");
  
  DynamicJsonDocument doc(1024); // buffer גדול יותר
  doc["type"] = "register";
  doc["id"] = deviceId;
  doc["ip"] = WiFi.localIP().toString();
  doc["status"] = "online";
  doc["firmware_version"] = "ULTIMATE_v1.0";
  doc["uptime"] = millis();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["chip_model"] = ESP.getChipModel();
  
  // 📊 סטטיסטיקות מתקדמות (ULTIMATE)
  JsonObject statsObj = doc.createNestedObject("stats");
  statsObj["total_commands"] = stats.totalCommands;
  statsObj["successful_unlocks"] = stats.successfulUnlocks;
  statsObj["failed_unlocks"] = stats.failedUnlocks;
  statsObj["consecutive_failures"] = connectionStatus.consecutiveFailures;
  
  // 🔋 מידע חומרה (ULTIMATE)
  JsonObject hardware = doc.createNestedObject("hardware");
  hardware["wifi_rssi"] = WiFi.RSSI();
  hardware["wifi_ssid"] = WiFi.SSID();
  hardware["mac_address"] = WiFi.macAddress();
  
  // 📱 תאים מפורטים (ULTIMATE)
  JsonObject cells = doc.createNestedObject("cells");
  for (int i = 1; i <= 16; i++) {
    String cellName = "A" + String(i);
    JsonObject cell = cells.createNestedObject(cellName);
    cell["locked"] = true;
    cell["opened"] = false;
    cell["hasPackage"] = false;
    
    // תא A1 עם משוב אמיתי
    if (i == 1) {
      bool isOpen = !isCellClosed(1);
      cell["opened"] = isOpen;
      cell["locked"] = !isOpen;
      cell["has_sensor"] = true;
    } else {
      cell["has_sensor"] = false;
    }
  }
  
  if (sendToAPI(doc)) {
    Serial.println("✅ רישום הצליח");
    digitalWrite(WS_STATUS_LED, LOW);
  } else {
    Serial.println("❌ רישום נכשל");
    digitalWrite(WS_STATUS_LED, HIGH);
  }
}

// 🏓 שליחת פינג מתקדם (ULTIMATE)
void sendPing() {
  DynamicJsonDocument doc(256);
  doc["type"] = "ping";
  doc["id"] = deviceId;
  doc["timestamp"] = millis();
  doc["uptime"] = millis();
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  
  if (sendToAPI(doc)) {
    Serial.println("🏓 פינג נשלח בהצלחה");
  }
}

// 🔍 בדיקת פקודות ממתינות (ULTIMATE VERSION)
void checkPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  String url = "https://" + String(api_host) + String(commands_endpoint) + "?deviceId=" + deviceId;
  
  http.begin(url);
  http.addHeader("User-Agent", String("ESP32-Locker/") + deviceId);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    
    // רק הדפס אם יש פקודות
    if (response.indexOf("\"commands\":[]") == -1) {
      Serial.printf("📥 בדיקת פקודות: %s\n", response.c_str());
    }
    
    DynamicJsonDocument doc(2048); // buffer גדול למספר פקודות
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("commands")) {
      JsonArray commands = doc["commands"];
      
      for (JsonObject command : commands) {
        String type = command["type"].as<String>();
        String cell = command["cell"].as<String>();
        String requestId = command["requestId"].as<String>();
        
        Serial.printf("📨 מבצע פקודה: %s תא %s (ID: %s)\n", type.c_str(), cell.c_str(), requestId.c_str());
        
        stats.totalCommands++;
        
        if (type == "unlock") {
          bool success = unlockCell(cell);
          
          if (success) {
            stats.successfulUnlocks++;
          } else {
            stats.failedUnlocks++;
          }
          
          // 📤 שליחת תגובה עם requestId (ULTIMATE)
          if (requestId != "") {
            DynamicJsonDocument responseDoc(256);
            responseDoc["type"] = "unlockResponse";
            responseDoc["requestId"] = requestId;
            responseDoc["lockerId"] = deviceId;
            responseDoc["cellId"] = cell;
            responseDoc["success"] = success;
            responseDoc["timestamp"] = millis();
            
            sendToAPI(responseDoc, false); // ללא retry לתגובות
          }
          
          Serial.printf("✅ פקודת פתיחה %s: %s\n", success ? "הצליחה" : "נכשלה", cell.c_str());
        }
      }
    }
  } else if (httpCode != 304 && httpCode != 0) { // 304 = Not Modified, 0 = timeout
    Serial.printf("⚠️ שגיאה בבדיקת פקודות: %d\n", httpCode);
  }
  
  http.end();
}

// 🏥 בדיקת בריאות מתקדמת (ULTIMATE)
void performHealthCheck() {
  Serial.println("🏥 מבצע בדיקת בריאות מתקדמת...");
  
  DynamicJsonDocument healthDoc(512);
  healthDoc["type"] = "healthCheck";
  healthDoc["id"] = deviceId;
  healthDoc["timestamp"] = millis();
  
  // בדיקת רכיבים
  JsonObject health = healthDoc.createNestedObject("health");
  health["wifi_connected"] = WiFi.status() == WL_CONNECTED;
  health["wifi_rssi"] = WiFi.RSSI();
  health["free_heap"] = ESP.getFreeHeap();
  health["uptime"] = millis();
  health["consecutive_failures"] = connectionStatus.consecutiveFailures;
  health["last_successful_api_call"] = connectionStatus.lastApiCall;
  
  // בדיקת I2C
  bool i2c_ok = true;
  Wire.beginTransmission(0x20);
  if (Wire.endTransmission() != 0) i2c_ok = false;
  health["i2c_expander_ok"] = i2c_ok;
  
  // בדיקת תא A1
  health["cell_a1_sensor"] = digitalRead(CELL_A1_STATUS_PIN);
  
  sendToAPI(healthDoc);
}

// 📊 שידור סטטוס מתקדם (ULTIMATE)
void broadcastStatus() {
  DynamicJsonDocument statusDoc(512);
  statusDoc["type"] = "statusUpdate";
  statusDoc["id"] = deviceId;
  statusDoc["timestamp"] = millis();
  statusDoc["uptime"] = millis();
  
  // סטטיסטיקות
  JsonObject statsObj = statusDoc.createNestedObject("stats");
  statsObj["total_commands"] = stats.totalCommands;
  statsObj["successful_unlocks"] = stats.successfulUnlocks;
  statsObj["failed_unlocks"] = stats.failedUnlocks;
  statsObj["success_rate"] = stats.totalCommands > 0 ? 
    (float)stats.successfulUnlocks / stats.totalCommands * 100 : 100.0;
  
  // מצב נוכחי
  JsonObject status = statusDoc.createNestedObject("status");
  status["online"] = connectionStatus.isOnline;
  status["wifi_rssi"] = WiFi.RSSI();
  status["free_heap"] = ESP.getFreeHeap();
  status["consecutive_failures"] = connectionStatus.consecutiveFailures;
  
  sendToAPI(statusDoc);
}

// טיפול בהודעות HTTP מקומיות (ULTIMATE VERSION)
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
    stats.totalCommands++;
    if (success) stats.successfulUnlocks++;
    else stats.failedUnlocks++;

    DynamicJsonDocument response(512);
    response["success"] = success;
    response["message"] = success ? "תא נפתח בהצלחה" : "שגיאה בפתיחת תא";
    response["deviceId"] = deviceId;
    response["cell"] = cell;
    response["timestamp"] = millis();
    response["stats"] = stats.totalCommands;

    String jsonString;
    serializeJson(response, jsonString);
    server.send(200, "application/json", jsonString);
  }
  else if (action == "ping") {
    DynamicJsonDocument response(256);
    response["pong"] = true;
    response["deviceId"] = deviceId;
    response["status"] = "online";
    response["uptime"] = millis();
    response["wifi_rssi"] = WiFi.RSSI();

    String jsonString;
    serializeJson(response, jsonString);
    server.send(200, "application/json", jsonString);
  }
  else if (action == "status") {
    // 📊 endpoint חדש לסטטוס מפורט (ULTIMATE)
    DynamicJsonDocument response(1024);
    response["deviceId"] = deviceId;
    response["uptime"] = millis();
    response["wifi_rssi"] = WiFi.RSSI();
    response["free_heap"] = ESP.getFreeHeap();
    response["stats"]["total_commands"] = stats.totalCommands;
    response["stats"]["successful_unlocks"] = stats.successfulUnlocks;
    response["stats"]["failed_unlocks"] = stats.failedUnlocks;
    response["connection"]["is_online"] = connectionStatus.isOnline;
    response["connection"]["consecutive_failures"] = connectionStatus.consecutiveFailures;
    response["connection"]["last_error"] = connectionStatus.lastError;

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

// התחברות WiFi (ULTIMATE VERSION)
void connectToWiFi() {
  Serial.println("🔍 סורק רשתות WiFi...");
  int n = WiFi.scanNetworks();
  int bestRSSI = -999;
  
  Serial.printf("נמצאו %d רשתות:\n", n);
  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);
    String encryption = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "פתוח" : "מוצפן";
    
    Serial.printf("[%d] '%s' | RSSI: %d | %s\n", i + 1, ssid.c_str(), rssi, encryption.c_str());
    
    if (ssid.startsWith(targetPrefix) && rssi > bestRSSI) {
      bestSSID = ssid;
      bestRSSI = rssi;
    }
  }

  if (bestSSID == "") {
    Serial.println("❌ לא נמצאה רשת מתאימה");
    writePin(0, HIGH);
    return;
  }

  Serial.printf("🔗 מתחבר ל-%s (RSSI: %d) עם סיסמה: %s\n", bestSSID.c_str(), bestRSSI, password);
  Serial.printf("📱 MAC Address: %s\n", WiFi.macAddress().c_str());

  WiFi.begin(bestSSID.c_str(), password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) { // יותר ניסיונות
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi מחובר! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("🌐 Gateway: %s | DNS: %s\n", WiFi.gatewayIP().toString().c_str(), WiFi.dnsIP().toString().c_str());
    digitalWrite(WIFI_STATUS_LED, LOW);
  } else {
    Serial.println("\n❌ WiFi נכשל");
    digitalWrite(WIFI_STATUS_LED, HIGH);
  }
}

bool isCellClosed(int cellNumber) {
  if (cellNumber != 1) {
    // Serial.printf("⚠️ משוב זמין רק עבור A1, התבקש תא A%d\n", cellNumber);
    return true; // אין משוב לשאר התאים, נניח שסגור
  }

  int value = digitalRead(CELL_A1_STATUS_PIN);
  // Serial.printf("👁 A1(GPIO %d) = %d → %s\n", CELL_A1_STATUS_PIN, value, value == LOW ? "🔒 סגור" : "🔓 פתוח");
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
    failDoc["timestamp"] = millis();

    sendToAPI(failDoc);
    Serial.println("📤 נשלחה הודעת כישלון לשרת");

    return false;
  }

  // התחלת לולאה: המתנה לסגירה + אישור מהשרת
  Serial.println("🕒 ממתין לסגירת תא A1...");
  receivedCloseConfirmation = false;

  unsigned long startWaitTime = millis();
  const unsigned long maxWaitTime = 300000; // 5 דקות מקסימום

  while (millis() - startWaitTime < maxWaitTime) {
    bool closed = isCellClosed(1);

    DynamicJsonDocument doc(256);
    doc["type"] = "cellClosed";
    doc["id"] = deviceId;
    doc["cellId"] = cell;
    doc["status"] = closed ? "closed" : "open";
    doc["timestamp"] = millis();

    sendToAPI(doc);
    
    if (closed) {
      Serial.printf("✅ A1 נסגר אחרי %.1f שניות\n", (millis() - startWaitTime) / 1000.0);
      break;
    }

    delay(500);
  }

  return true;
}

void debugPrintAllCellsStatus() {
  int v = digitalRead(CELL_A1_STATUS_PIN);
  Serial.printf("🔍 A1: %s | Free Heap: %d | Uptime: %.1f min\n", 
    (v == LOW) ? "🔒 סגור" : "🔓 פתוח", 
    ESP.getFreeHeap(), 
    millis() / 60000.0);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("🚀 ESP32 ULTIMATE Locker System Starting...");
  Serial.printf("💾 Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("🔧 Chip Model: %s\n", ESP.getChipModel());

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
    while (true) {
      digitalWrite(WS_STATUS_LED, HIGH);
      delay(500);
      digitalWrite(WS_STATUS_LED, LOW);
      delay(500);
    }
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
    // הגדרת HTTP Server
    server.on("/locker", handleLocker);
    server.on("/status", HTTP_GET, []() {
      DynamicJsonDocument doc(1024);
      doc["device_id"] = deviceId;
      doc["uptime"] = millis();
      doc["wifi_rssi"] = WiFi.RSSI();
      doc["free_heap"] = ESP.getFreeHeap();
      doc["total_commands"] = stats.totalCommands;
      doc["successful_unlocks"] = stats.successfulUnlocks;
      doc["failed_unlocks"] = stats.failedUnlocks;
      
      String response;
      serializeJson(doc, response);
      server.send(200, "application/json", response);
    });
    
    server.begin();
    Serial.println("🟢 HTTP server פעיל על פורט 80");
    Serial.printf("🌐 נגיש בכתובת: http://%s/status\n", WiFi.localIP().toString().c_str());

    // רישום ראשוני
    registerWithServer();
    
    // אתחול זמנים
    stats.lastResetTime = millis();
  }
  
  Serial.println("🎯 ULTIMATE Locker System מוכן!");
}

void loop() {
  server.handleClient();

  // רק אם WiFi מחובר
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    stats.uptime = now;
    
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
    
    // בדיקת פקודות ממתינות (מהיר!)
    if (now - lastCommandCheck > commandCheckInterval) {
      checkPendingCommands();
      lastCommandCheck = now;
    }
    
    // בדיקת בריאות
    if (now - lastHealthCheck > healthCheckInterval) {
      performHealthCheck();
      lastHealthCheck = now;
    }
    
    // שידור סטטוס
    if (now - lastStatusBroadcast > statusBroadcastInterval) {
      broadcastStatus();
      lastStatusBroadcast = now;
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
      connectionStatus.isOnline = false;
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
  
  // 💡 נורית סטטוס מתקדמת
  static unsigned long lastLedUpdate = 0;
  if (millis() - lastLedUpdate > 1000) {
    if (connectionStatus.isOnline && WiFi.status() == WL_CONNECTED) {
      digitalWrite(WS_STATUS_LED, LOW); // ירוק קבוע
    } else if (WiFi.status() == WL_CONNECTED) {
      // מחובר לWiFi אבל לא לAPI - מהבהב
      digitalWrite(WS_STATUS_LED, !digitalRead(WS_STATUS_LED));
    } else {
      digitalWrite(WS_STATUS_LED, HIGH); // אדום קבוע
    }
    lastLedUpdate = millis();
  }
  
  // 🧹 ניקוי זיכרון תקופתי
  static unsigned long lastMemoryCleanup = 0;
  if (millis() - lastMemoryCleanup > 300000) { // כל 5 דקות
    Serial.printf("🧹 ניקוי זיכרון - Free Heap: %d bytes\n", ESP.getFreeHeap());
    lastMemoryCleanup = millis();
  }
}

