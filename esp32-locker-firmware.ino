#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketClient.h>
#include <ArduinoJson.h>

// הגדרות WiFi
const char* ssid = "WIFI_NAME";       // החלף עם שם הרשת שלך
const char* password = "WIFI_PASSWORD"; // החלף עם הסיסמה שלך

// הגדרות WebSocket
const char* wsHost = "your-server.com";  // החלף עם כתובת השרת שלך
const int wsPort = 8080;
const char* wsPath = "/ws";

// הגדרות לוקר
const String LOCKER_ID = "LOC001";

// פינים לממסרים (נעילה/פתיחה)
const int RELAY_PINS[] = {2, 4, 5, 18, 19}; // פינים עבור תאים A1, A2, A3, B1, B2
const String CELL_IDS[] = {"A1", "A2", "A3", "B1", "B2"};
const int NUM_CELLS = 5;

// פינים לחיישני דלת (Reed switches או מגנטיים)
const int SENSOR_PINS[] = {12, 13, 14, 25, 26}; // חיישנים עבור כל תא

// מצבי התאים
struct CellState {
  bool locked;
  bool opened;
  String packageId;
  unsigned long lastActivity;
};

CellState cellStates[NUM_CELLS];

// שרת Web
WebServer server(80);

// WebSocket client
WebSocketClient webSocket;
WiFiClient client;
bool wsConnected = false;
unsigned long lastWsReconnectAttempt = 0;
const unsigned long WS_RECONNECT_INTERVAL = 5000; // 5 שניות

// LED סטטוס
const int STATUS_LED = 2;

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
  
  Serial.println("✅ ESP32 Smart Locker מוכן לשימוש!");
}

void loop() {
  // בדיקת חיבור WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ חיבור WiFi נותק - מנסה להתחבר מחדש");
    connectToWiFi();
  }
  
  // בדיקת חיבור WebSocket
  if (!wsConnected && millis() - lastWsReconnectAttempt > WS_RECONNECT_INTERVAL) {
    Serial.println("🔄 מנסה להתחבר מחדש ל-WebSocket");
    connectToWebSocket();
  }
  
  // טיפול בהודעות WebSocket
  if (wsConnected && webSocket.available()) {
    String msg = webSocket.readString();
    handleWebSocketMessage(msg);
  }
  
  // טיפול בבקשות HTTP
  server.handleClient();
  
  // עדכון LED סטטוס
  updateStatusLED();
  
  delay(100);
}

void initializePins() {
  // הגדרת פיני ממסרים כיציאות
  for (int i = 0; i < NUM_CELLS; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], LOW); // ממסרים כבויים (נעול)
  }
  
  // הגדרת פיני חיישנים כקלטים עם pull-up
  for (int i = 0; i < NUM_CELLS; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
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
  
  if (client.connect(wsHost, wsPort)) {
    Serial.println("✅ מחובר לשרת");
    
    if (webSocket.handshake(client)) {
      Serial.println("✅ WebSocket handshake הושלם");
      wsConnected = true;
      
      // שליחת הודעת register
      DynamicJsonDocument doc(256);
      doc["type"] = "register";
      doc["id"] = LOCKER_ID;
      doc["ip"] = WiFi.localIP().toString();
      doc["status"] = "online";
      
      String jsonString;
      serializeJson(doc, jsonString);
      webSocket.send(jsonString);
      
      Serial.println("📡 נשלחה הודעת register");
    } else {
      Serial.println("❌ שגיאה ב-WebSocket handshake");
      wsConnected = false;
    }
  } else {
    Serial.println("❌ לא ניתן להתחבר לשרת");
    wsConnected = false;
  }
  
  lastWsReconnectAttempt = millis();
}

void handleWebSocketMessage(String message) {
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("❌ שגיאה בפענוח JSON");
    return;
  }
  
  String type = doc["type"];
  
  if (type == "unlock") {
    String cellId = doc["cellId"];
    unlockCell(cellId);
  } 
  else if (type == "lock") {
    String cellId = doc["cellId"];
    String packageId = doc["packageId"];
    lockCell(cellId, packageId);
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
        bool isClosed = digitalRead(SENSOR_PINS[cellIndex]) == HIGH;
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
    response["lockerId"] = LOCKER_ID;
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
  digitalWrite(RELAY_PINS[cellIndex], HIGH);
  Serial.println("🔓 פותח תא " + cellId);
  
  delay(3000); // פתיחה למשך 3 שניות
  
  digitalWrite(RELAY_PINS[cellIndex], LOW);
  
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
  for (int i = 0; i < NUM_CELLS; i++) {
    if (CELL_IDS[i] == cellId) {
      return i;
    }
  }
  return -1;
}

void checkDoorSensors() {
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck < 500) return; // בדיקה כל 500ms
  lastCheck = millis();
  
  for (int i = 0; i < NUM_CELLS; i++) {
    bool currentState = digitalRead(SENSOR_PINS[i]) == HIGH; // HIGH = סגור
    
    // זיהוי שינוי מצב
    if (cellStates[i].opened && currentState) {
      Serial.println("🚪 תא " + CELL_IDS[i] + " נסגר");
      cellStates[i].opened = false;
      cellStates[i].lastActivity = millis();
    }
    else if (!cellStates[i].opened && !currentState) {
      Serial.println("🚪 תא " + CELL_IDS[i] + " נפתח");
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
  for (int i = 0; i < NUM_CELLS; i++) {
    cellStates[i].locked = true;
    cellStates[i].opened = false;
    cellStates[i].packageId = "";
    cellStates[i].lastActivity = millis();
  }
  
  Serial.println("🔄 מצבי תאים אותחלו");
}

String buildStatusJSON() {
  DynamicJsonDocument doc(2048);
  
  doc["lockerId"] = LOCKER_ID;
  doc["status"] = "active";
  doc["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["uptime"] = millis();
  doc["timestamp"] = millis();
  
  JsonObject cells = doc.createNestedObject("cells");
  
  for (int i = 0; i < NUM_CELLS; i++) {
    JsonObject cell = cells.createNestedObject(CELL_IDS[i]);
    cell["locked"] = cellStates[i].locked;
    cell["opened"] = cellStates[i].opened;
    cell["packageId"] = cellStates[i].packageId;
    cell["lastActivity"] = cellStates[i].lastActivity;
    cell["sensorState"] = digitalRead(SENSOR_PINS[i]);
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
  html += "<h2>מזהה לוקר: " + LOCKER_ID + "</h2>";
  html += "<p>WiFi: " + String(WiFi.status() == WL_CONNECTED ? "מחובר ✅" : "לא מחובר ❌") + "</p>";
  html += "<p>כתובת IP: " + WiFi.localIP().toString() + "</p>";
  html += "<p>זמן פעילות: " + String(millis()/1000) + " שניות</p>";
  
  html += "<h3>סטטוס תאים:</h3><table border='1'>";
  html += "<tr><th>תא</th><th>נעול</th><th>פתוח</th><th>חבילה</th><th>חיישן</th></tr>";
  
  for (int i = 0; i < NUM_CELLS; i++) {
    html += "<tr>";
    html += "<td>" + CELL_IDS[i] + "</td>";
    html += "<td>" + String(cellStates[i].locked ? "כן" : "לא") + "</td>";
    html += "<td>" + String(cellStates[i].opened ? "כן" : "לא") + "</td>";
    html += "<td>" + cellStates[i].packageId + "</td>";
    html += "<td>" + String(digitalRead(SENSOR_PINS[i])) + "</td>";
    html += "</tr>";
  }
  
  html += "</table>";
  html += "<br><a href='/status'>JSON Status</a>";
  html += "</body></html>";
  
  return html;
} 