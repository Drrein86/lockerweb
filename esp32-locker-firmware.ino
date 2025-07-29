#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <HTTPClient.h>

// הגדרות WiFi
const char* ssid = "WIFI_NAME";       // החלף עם שם הרשת שלך
const char* password = "WIFI_PASSWORD"; // החלף עם הסיסמה שלך

// 🌐 הגדרות WebSocket - שרת החומרה ב-Railway
const char* websocket_host = "lockerweb-production.up.railway.app";
const int websocket_port = 443;
const char* websocket_path = "/";

// 🌐 הגדרות רישום במערכת הראשית - Vercel
const char* main_app_host = "lockerweb-alpha.vercel.app";
const char* register_endpoint = "/api/lockers/register";

// הגדרות EEPROM
#define EEPROM_SIZE 512
#define LOCKER_ID_ADDR 0
#define LOCKER_ID_LENGTH 10

// הגדרות לוקר
struct Cell {
  int lockPin;
  int sensorPin;
  bool isLocked;
  bool hasPackage;
};

Cell cells[5] = {
  {2, 12, false, false},  // תא 1
  {4, 13, false, false},  // תא 2
  {5, 14, false, false},  // תא 3
  {18, 25, false, false}, // תא 4
  {19, 26, false, false}  // תא 5
};

// פינים לחיישני דלת (Reed switches או מגנטיים)
const int SENSOR_PINS[] = {12, 13, 14, 25, 26}; // חיישנים עבור כל תא

// מצבי התאים
struct CellState {
  bool locked;
  bool opened;
  String packageId;
  unsigned long lastActivity;
};

CellState cellStates[5];

// שרת Web
WebServer server(80);

// WebSocket client
WebSocketsClient webSocket;
bool wsConnected = false;
unsigned long lastWsReconnectAttempt = 0;
const unsigned long WS_RECONNECT_INTERVAL = 5000; // 5 שניות

unsigned long lastMainAppRegister = 0;
const unsigned long MAIN_APP_REGISTER_INTERVAL = 300000; // 5 דקות

// LED סטטוס
const int STATUS_LED = 2;

char lockerId[LOCKER_ID_LENGTH + 1];  // +1 עבור תו סיום המחרוזת

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("🚀 מתחיל ESP32 Smart Locker...");
  
  // אתחול פינים
  initializePins();
  
  // התחברות לWiFi
  connectToWiFi();
  
  // התחברות לשרת WebSocket
  connectToWebSocket();
  
  // הגדרת נתיבי שרת
  setupServerRoutes();
  
  // התחלת השרת
  server.begin();
  Serial.println("✅ שרת HTTP פועל");
  Serial.print("🌐 כתובת IP: ");
  Serial.println(WiFi.localIP());
  
  // אתחול מצבי תאים
  initializeCellStates();
  
  // טעינת מזהה הלוקר
  loadLockerId();
  Serial.println("מזהה הלוקר: " + String(lockerId));
  
  // רישום באפליקציה הראשית
  delay(2000); // המתנה כדי לוודא שהכל מוכן
  registerInMainApp();
  
  Serial.println("✅ ESP32 Smart Locker מוכן לשימוש!");
}

void loop() {
  // בדיקת חיבור WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ חיבור WiFi נותק - מנסה להתחבר מחדש");
    connectToWiFi();
  }
  
  // טיפול בWebSocket
  webSocket.loop();
  
  // טיפול בבקשות HTTP
  server.handleClient();
  
  // רישום מחדש באפליקציה הראשית מדי 5 דקות
  if (millis() - lastMainAppRegister > MAIN_APP_REGISTER_INTERVAL) {
    registerInMainApp();
    lastMainAppRegister = millis();
  }
  
  // עדכון LED סטטוס
  updateStatusLED();
  
  delay(100);
}

void initializePins() {
  // הגדרת פיני ממסרים כיציאות
  for (int i = 0; i < 5; i++) {
    pinMode(cells[i].lockPin, OUTPUT);
    digitalWrite(cells[i].lockPin, LOW); // ממסרים כבויים (נעול)
  }
  
  // הגדרת פיני חיישנים כקלטים עם pull-up
  for (int i = 0; i < 5; i++) {
    pinMode(cells[i].sensorPin, INPUT_PULLUP);
  }
  
  // LED סטטוס
  pinMode(STATUS_LED, OUTPUT);
  
  Serial.println("📌 פינים אותחלו");
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("🔌 מתחבר לWiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi מחובר!");
    Serial.print("📍 כתובת IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ שגיאה בחיבור WiFi!");
  }
}

void connectToWebSocket() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  Serial.println("🔌 מתחבר לשרת WebSocket...");
  
  webSocket.begin(websocket_host, websocket_port, websocket_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  lastWsReconnectAttempt = millis();
}

// 📡 רישום באפליקציה הראשית
void registerInMainApp() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String("https://") + main_app_host + register_endpoint;
  
  Serial.println("📡 נרשם באפליקציה הראשית: " + url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // יצירת JSON לרישום
  DynamicJsonDocument doc(1024);
  doc["id"] = lockerId;
  doc["ip"] = WiFi.localIP().toString();
  doc["deviceId"] = lockerId;
  doc["status"] = "ONLINE";
  
  // הוספת נתוני תאים
  JsonObject cells = doc.createNestedObject("cells");
  cells["A1"]["size"] = "SMALL";
  cells["A1"]["locked"] = true;
  cells["A2"]["size"] = "MEDIUM"; 
  cells["A2"]["locked"] = true;
  cells["A3"]["size"] = "LARGE";
  cells["A3"]["locked"] = true;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ תגובה מהאפליקציה: " + response);
  } else {
    Serial.println("❌ שגיאה ברישום באפליקציה: " + String(httpResponseCode));
  }
  
  http.end();
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("❌ WebSocket מנותק");
      wsConnected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("✅ WebSocket מחובר");
      wsConnected = true;
      
      // שליחת הודעת register
      DynamicJsonDocument doc(256);
      doc["type"] = "register";
      doc["id"] = lockerId;
      doc["ip"] = WiFi.localIP().toString();
      doc["status"] = "online";
      
      String jsonString;
      serializeJson(doc, jsonString);
      webSocket.sendTXT(jsonString);
      Serial.println("📡 נשלחה הודעת register");
      break;
      
    case WStype_TEXT:
      handleWebSocketMessage(String((char*)payload));
      break;
      
    default:
      break;
  }
}

void handleWebSocketMessage(String message) {
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("❌ שגיאה בפענוח JSON");
    return;
  }
  
  String type = doc["type"];
  String requestId = doc["requestId"]; // שמירת מזהה הבקשה
  
  if (type == "unlock") {
    // תמיכה בשני פורמטים: 'cellId' ו-'cell'
    String cellId = doc["cellId"];
    if (cellId == "" || cellId == "null") {
      cellId = doc["cell"];
    }
    
    if (cellId != "" && cellId != "null") {
      Serial.println("🔓 מקבל פקודת פתיחה לתא: " + cellId);
      bool success = unlockCell(cellId);
      
      // שליחת תגובה חזרה לשרת
      DynamicJsonDocument response(256);
      response["type"] = "unlockResponse";
      response["cellId"] = cellId;
      response["success"] = success;
      response["lockerId"] = lockerId;
      if (requestId != "" && requestId != "null") {
        response["requestId"] = requestId; // החזרת מזהה הבקשה
      }
      
      String responseString;
      serializeJson(response, responseString);
      webSocket.sendTXT(responseString);
      Serial.println("📤 נשלחה תגובה: " + responseString);
    } else {
      Serial.println("❌ לא נמצא מזהה תא בהודעת פתיחה");
    }
  } 
  else if (type == "lock") {
    String cellId = doc["cellId"];
    if (cellId == "" || cellId == "null") {
      cellId = doc["cell"];
    }
    String packageId = doc["packageId"];
    
    if (cellId != "" && cellId != "null") {
      Serial.println("🔒 מקבל פקודת נעילה לתא: " + cellId);
      bool success = lockCell(cellId, packageId);
      
      // שליחת תגובה חזרה לשרת
      DynamicJsonDocument response(256);
      response["type"] = "lockResponse";
      response["cellId"] = cellId;
      response["success"] = success;
      response["lockerId"] = lockerId;
      if (requestId != "" && requestId != "null") {
        response["requestId"] = requestId; // החזרת מזהה הבקשה
      }
      
      String responseString;
      serializeJson(response, responseString);
      webSocket.sendTXT(responseString);
      Serial.println("📤 נשלחה תגובה: " + responseString);
    } else {
      Serial.println("❌ לא נמצא מזהה תא בהודעת נעילה");
    }
  }
  else if (type == "identified" || type == "registerSuccess") {
    Serial.println("✅ לוקר זוהה בשרת: " + String((char*)doc["message"]));
  }
  else {
    Serial.println("❓ הודעה לא מזוהה: " + type);
  }
}

void setupServerRoutes() {
  // נתיב ראשי - מידע על המערכת
  server.on("/", HTTP_GET, []() {
    String html = buildStatusHTML();
    server.send(200, "text/html; charset=utf-8", html);
  });
  
  // נתיב לקבלת פקודות
  server.on("/locker", HTTP_POST, handleLockerCommand);
  
  // נתיב סטטוס JSON
  server.on("/status", HTTP_GET, []() {
    String json = buildStatusJSON();
    server.send(200, "application/json; charset=utf-8", json);
  });
  
  // טיפול ב-CORS
  server.enableCORS(true);
}

void handleLockerCommand() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    Serial.println("📨 פקודה התקבלה: " + body);
    
    // פענוח JSON
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, body);
    
    String action = doc["action"];
    String cellId = doc["cellId"];
    String packageId = doc["packageId"];
    
    bool success = false;
    String message = "";
    
    if (action == "unlock") {
      success = unlockCell(cellId);
      message = success ? "תא נפתח בהצלחה" : "שגיאה בפתיחת תא";
    } 
    else if (action == "lock") {
      success = lockCell(cellId, packageId);
      message = success ? "תא ננעל בהצלחה" : "שגיאה בנעילת תא";
    }
    else if (action == "checkCell") {
      int cellIndex = getCellIndex(cellId);
      if (cellIndex >= 0) {
        bool isClosed = digitalRead(cells[cellIndex].sensorPin) == HIGH;
        success = true;
        
        // יצירת תגובה מיוחדת לבדיקת סגירה
        DynamicJsonDocument response(512);
        response["success"] = true;
        response["cellId"] = cellId;
        response["cellClosed"] = isClosed;
        response["locked"] = cellStates[cellIndex].locked;
        response["timestamp"] = millis();
        
        String jsonString;
        serializeJson(response, jsonString);
        server.send(200, "application/json; charset=utf-8", jsonString);
        return;
      } else {
        success = false;
        message = "תא לא נמצא";
      }
    }
    else if (action == "ping") {
      success = true;
      message = "ESP32 פעיל ומחובר";
    }
    else {
      message = "פעולה לא מוכרת";
    }
    
    // שליחת תגובה
    DynamicJsonDocument response(512);
    response["success"] = success;
    response["message"] = message;
    response["lockerId"] = lockerId;
    response["cellId"] = cellId;
    response["timestamp"] = millis();
    
    String jsonString;
    serializeJson(response, jsonString);
    
    server.send(200, "application/json; charset=utf-8", jsonString);
    
    Serial.println("📤 תגובה נשלחה: " + message);
  } else {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"חסר גוף בקשה\"}");
  }
}

bool unlockCell(String cellId) {
  int cellIndex = getCellIndex(cellId);
  if (cellIndex < 0) {
    Serial.println("❌ תא לא נמצא: " + cellId);
    return false;
  }
  
  // הפעלת ממסר לפתיחה (3 שניות)
  digitalWrite(cells[cellIndex].lockPin, HIGH);
  Serial.println("🔓 פותח תא " + cellId);
  
  delay(3000); // פתיחה למשך 3 שניות
  
  digitalWrite(cells[cellIndex].lockPin, LOW);
  
  // עדכון מצב
  cellStates[cellIndex].locked = false;
  cellStates[cellIndex].opened = true;
  cellStates[cellIndex].lastActivity = millis();
  
  Serial.println("✅ תא " + cellId + " נפתח בהצלחה");
  return true;
}

bool lockCell(String cellId, String packageId) {
  int cellIndex = getCellIndex(cellId);
  if (cellIndex < 0) {
    Serial.println("❌ תא לא נמצא: " + cellId);
    return false;
  }
  
  // עדכון מצב לנעול
  cellStates[cellIndex].locked = true;
  cellStates[cellIndex].opened = false;
  cellStates[cellIndex].packageId = packageId;
  cellStates[cellIndex].lastActivity = millis();
  
  Serial.println("🔒 תא " + cellId + " ננעל עם חבילה " + packageId);
  return true;
}

int getCellIndex(String cellId) {
  for (int i = 0; i < 5; i++) {
    if (String(i + 1) == cellId) {
      return i;
    }
  }
  return -1;
}

void checkDoorSensors() {
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck < 500) return; // בדיקה כל 500ms
  lastCheck = millis();
  
  for (int i = 0; i < 5; i++) {
    bool currentState = digitalRead(cells[i].sensorPin) == HIGH; // HIGH = סגור
    
    // זיהוי שינוי מצב
    if (cellStates[i].opened && currentState) {
      Serial.println("🚪 תא " + String(i + 1) + " נסגר");
      cellStates[i].opened = false;
      cellStates[i].lastActivity = millis();
    }
    else if (!cellStates[i].opened && !currentState) {
      Serial.println("🚪 תא " + String(i + 1) + " נפתח");
      cellStates[i].opened = true;
      cellStates[i].lastActivity = millis();
    }
  }
}

void updateStatusLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  if (WiFi.status() == WL_CONNECTED) {
    // WiFi מחובר - LED קבוע
    digitalWrite(STATUS_LED, HIGH);
  } else {
    // WiFi לא מחובר - LED מהבהב
    if (millis() - lastBlink > 500) {
      ledState = !ledState;
      digitalWrite(STATUS_LED, ledState);
      lastBlink = millis();
    }
  }
}

void initializeCellStates() {
  for (int i = 0; i < 5; i++) {
    cellStates[i].locked = true;
    cellStates[i].opened = false;
    cellStates[i].packageId = "";
    cellStates[i].lastActivity = millis();
  }
  
  Serial.println("🔄 מצבי תאים אותחלו");
}

String buildStatusJSON() {
  DynamicJsonDocument doc(2048);
  
  doc["lockerId"] = lockerId;
  doc["status"] = "active";
  doc["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["uptime"] = millis();
  doc["timestamp"] = millis();
  
  JsonObject cells = doc.createNestedObject("cells");
  
  for (int i = 0; i < 5; i++) {
    JsonObject cell = cells.createNestedObject(String(i + 1));
    cell["locked"] = cellStates[i].locked;
    cell["opened"] = cellStates[i].opened;
    cell["packageId"] = cellStates[i].packageId;
    cell["lastActivity"] = cellStates[i].lastActivity;
    cell["sensorState"] = digitalRead(cells[i].sensorPin);
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  return jsonString;
}

String buildStatusHTML() {
  String html = "<!DOCTYPE html><html>";
  html += "<head><meta charset='utf-8'><title>ESP32 Smart Locker</title>";
  html += "<style>body{font-family:Arial;margin:20px;direction:rtl;}</style></head>";
  html += "<body><h1>🔒 ESP32 Smart Locker</h1>";
  html += "<h2>מזהה לוקר: " + String(lockerId) + "</h2>";
  html += "<p>WiFi: " + String(WiFi.status() == WL_CONNECTED ? "מחובר ✅" : "לא מחובר ❌") + "</p>";
  html += "<p>כתובת IP: " + WiFi.localIP().toString() + "</p>";
  html += "<p>זמן פעילות: " + String(millis()/1000) + " שניות</p>";
  
  html += "<h3>סטטוס תאים:</h3><table border='1'>";
  html += "<tr><th>תא</th><th>נעול</th><th>פתוח</th><th>חבילה</th><th>חיישן</th></tr>";
  
  for (int i = 0; i < 5; i++) {
    html += "<tr>";
    html += "<td>" + String(i + 1) + "</td>";
    html += "<td>" + String(cellStates[i].locked ? "כן" : "לא") + "</td>";
    html += "<td>" + String(cellStates[i].opened ? "כן" : "לא") + "</td>";
    html += "<td>" + cellStates[i].packageId + "</td>";
    html += "<td>" + String(digitalRead(cells[i].sensorPin)) + "</td>";
    html += "</tr>";
  }
  
  html += "</table>";
  html += "<br><a href='/status'>JSON Status</a>";
  html += "</body></html>";
  
  return html;
}

// פונקציה לטעינת מזהה הלוקר מה-EEPROM
void loadLockerId() {
  EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < LOCKER_ID_LENGTH; i++) {
    lockerId[i] = EEPROM.read(LOCKER_ID_ADDR + i);
  }
  lockerId[LOCKER_ID_LENGTH] = '\0';  // הוספת תו סיום
  EEPROM.end();
  
  // אם המזהה ריק או לא תקין, ניצור מזהה ברירת מחדל מה-MAC address
  if (strlen(lockerId) < 3 || !isValidLockerId(lockerId)) {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    snprintf(lockerId, LOCKER_ID_LENGTH + 1, "LOC%02X%02X%02X", mac[3], mac[4], mac[5]);
    saveLockerId();
  }
}

// פונקציה לשמירת מזהה הלוקר ב-EEPROM
void saveLockerId() {
  EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < LOCKER_ID_LENGTH; i++) {
    EEPROM.write(LOCKER_ID_ADDR + i, lockerId[i]);
  }
  EEPROM.commit();
  EEPROM.end();
}

// בדיקת תקינות מזהה הלוקר
bool isValidLockerId(const char* id) {
  if (strlen(id) < 3) return false;
  if (strncmp(id, "LOC", 3) != 0) return false;
  for (int i = 3; i < strlen(id); i++) {
    if (!isalnum(id[i])) return false;
  }
  return true;
}

// פונקציה לעדכון מזהה הלוקר דרך סריאל
void handleSerialCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd.startsWith("setid ")) {
      String newId = cmd.substring(6);
      if (newId.length() <= LOCKER_ID_LENGTH && isValidLockerId(newId.c_str())) {
        strncpy(lockerId, newId.c_str(), LOCKER_ID_LENGTH);
        saveLockerId();
        Serial.println("מזהה הלוקר עודכן ל: " + String(lockerId));
        
        // התחברות מחדש לשרת עם המזהה החדש
        webSocket.disconnect();
        connectToWebSocket();
      } else {
        Serial.println("שגיאה: מזהה לא תקין. השתמש בפורמט LOCxxxxx");
      }
    }
  }
} 