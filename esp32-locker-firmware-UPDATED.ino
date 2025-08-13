#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
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

// 🌐 הגדרות WebSocket - שרת החומרה ב-Railway
const char* websocket_host = "lockerweb-production.up.railway.app";
const int websocket_port = 443;
const char* websocket_path = "/api/ws";  // ⭐ עדכון: נתיב חדש

WebSocketsClient webSocket;
WebServer server(80);
Preferences prefs;

String bestSSID = "";
String deviceId = "";
const int cellPin = RGB_BUILTIN;

// 🧠 מרחיב פינים I2C
PCF8574 expander(0x20, &Wire);
PCF8574 expander2(0x21, &Wire);

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
  Serial.println("📨 פקודה התקבלה: " + body);

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

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  Serial.printf("📥 התקבלה הודעת WebSocket: type=%d\n", type);

  switch (type) {
    case WStype_CONNECTED: {
      Serial.printf("✅ WebSocket התחבר לשרת החומרה: %s\n", websocket_host);
      digitalWrite(WS_STATUS_LED, LOW);

      // ⭐ עדכון: הודעת register משופרת
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

      String output;
      serializeJson(doc, output);
      webSocket.sendTXT(output);

      Serial.printf("[%lu] נשלח רישום לשרת\n", millis());
      Serial.printf("📤 נשלח רישום לRailway: %s\n", output.c_str());
      break;
    }

    case WStype_TEXT: {
      Serial.printf("[%lu] 📨 התקבל מRailway: %s\n", millis(), payload);

      DynamicJsonDocument doc(512);
      DeserializationError err = deserializeJson(doc, payload);
      if (err) {
        Serial.println("⚠️ שגיאה בפענוח JSON");
        return;
      }

      String msgType = doc["type"].as<String>();
      String targetId = doc.containsKey("id") ? doc["id"].as<String>() : "";

      // טיפול בהודעת unlock (מתוקן, לא בהערה)
      if (msgType == "unlock") {
        // אם יש ID - נבדוק התאמה, אם אין - נמשיך (אפשר לשנות לפי צורך)
        if (targetId != "" && targetId != deviceId) {
          Serial.printf("⚠️ התעלמות מהודעת unlock: ID לא תואם (%s != %s)\n", targetId.c_str(), deviceId.c_str());
          return;
        }

        // המרה למחרוזת במקרה שה-cell הוא מספר
        String cell = "";
        if (doc.containsKey("cell")) {
          if (doc["cell"].is<const char*>()) {
            cell = doc["cell"].as<const char*>();
          } else if (doc["cell"].is<int>()) {
            cell = String(doc["cell"].as<int>());
          } else {
            cell = doc["cell"].as<String>();
          }
        } else if (doc.containsKey("cellId")) {  // ⭐ תמיכה גם ב-cellId
          if (doc["cellId"].is<const char*>()) {
            cell = doc["cellId"].as<const char*>();
          } else if (doc["cellId"].is<int>()) {
            cell = String(doc["cellId"].as<int>());
          } else {
            cell = doc["cellId"].as<String>();
          }
        }

        if (cell != "") {
          bool success = unlockCell(cell);
          Serial.printf("[%lu] 🔓 %s תא %s עבור %s\n", millis(), success ? "נפתח" : "כישלון בפתיחה", cell.c_str(), targetId.c_str());
        } else {
          Serial.printf("[%lu] ⚠️ חסר cell/cellId בהודעת unlock\n", millis());
        }
      }

      else if (msgType == "openByClient") {
        String lockerId = doc["lockerId"].as<String>();
        String cellId = doc["cellId"].as<String>();
        String packageId = doc["packageId"].as<String>();
        String clientToken = doc["clientToken"].as<String>();

        if (lockerId != deviceId) {
          Serial.printf("⚠️ openByClient התעלמות: lockerId לא תואם (%s != %s)\n", lockerId.c_str(), deviceId.c_str());
          return;
        }

        if (cellId == "") {
          Serial.println("⚠️ openByClient התקבלה ללא cellId");
          return;
        }

        bool success = unlockCell(cellId);

        DynamicJsonDocument res(256);
        res["type"] = success ? "openSuccess" : "openFailed";
        res["lockerId"] = deviceId;
        res["cellId"] = cellId;
        res["packageId"] = packageId;
        res["clientToken"] = clientToken;
        res["status"] = success ? "opened" : "failed";

        String resStr;
        serializeJson(res, resStr);
        webSocket.sendTXT(resStr);

        Serial.printf("[%lu] 📤 נשלחה תשובת %s עבור פתיחה ע\"י לקוח: %s\n", millis(), success ? "הצלחה" : "כישלון", resStr.c_str());
      }

      else if (msgType == "pong") {
        if (targetId == deviceId) {
          Serial.printf("[%lu] 🟢 פונג אמיתי התקבל מהשרת עבור %s\n", millis(), targetId.c_str());
        } else {
          Serial.printf("[%lu] ⚠️ פונג התקבל אך ID לא תואם: %s\n", millis(), targetId.c_str());
        }
      }

      else if (msgType == "confirmClose") {
        String cellId = doc["cellId"].as<String>();  // ⭐ שינוי: מ-"cell" ל-"cellId"
        Serial.printf("📥 התקבלה הודעת confirmClose: id=%s, cellId=%s\n", targetId.c_str(), cellId.c_str());

        if (targetId == deviceId && cellId == "A1") {
          receivedCloseConfirmation = true;
          Serial.printf("[%lu] ✅ אישור סגירה התקבל והתקבל אישור עבור %s\n", millis(), cellId.c_str());
        } else {
          Serial.println("⚠️ התעלמות מהודעת confirmClose: ID או cellId לא תואמים");
        }
      }

      else if (msgType == "failedToUnlock" && targetId == deviceId) {
        String cell = doc["cell"].as<String>();
        String reason = doc["reason"].as<String>();
        Serial.printf("[%lu] ❌ כישלון בפתיחת תא %s. סיבה: %s\n", millis(), cell.c_str(), reason.c_str());
      }

      break;
    }

    case WStype_DISCONNECTED:
      Serial.println("❌ WebSocket נותק מRailway");
      digitalWrite(WS_STATUS_LED, HIGH);
      break;

    case WStype_ERROR:
      Serial.printf("❌ שגיאת WebSocket: %s\n", payload);
      digitalWrite(WS_STATUS_LED, HIGH);
      break;
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

  Serial.printf("🔗 מתחבר ל-%s\n", bestSSID.c_str());
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

    String failMsg;
    serializeJson(failDoc, failMsg);
    webSocket.sendTXT(failMsg);
    Serial.printf("📤 נשלחה הודעת כישלון לשרת: %s\n", failMsg.c_str());

    return false;
  }

  // התחלת לולאה: המתנה לסגירה + אישור מהשרת
  Serial.println("🕒 ממתין לסגירת תא A1 ואישור מהשרת...");
  receivedCloseConfirmation = false;

  while (true) {
    bool closed = isCellClosed(1);

    // ⭐ עדכון: שינוי מ-"cell" ל-"cellId"
    DynamicJsonDocument doc(256);
    doc["type"] = "cellClosed";
    doc["id"] = deviceId;
    doc["cellId"] = cell;  // שינוי כאן
    doc["status"] = closed ? "closed" : "open";

    String msg;
    serializeJson(doc, msg);
    webSocket.sendTXT(msg);
    Serial.printf("📤 נשלח סטטוס: %s\n", msg.c_str());

    if (closed /*&& receivedCloseConfirmation*/) {
      Serial.println("✅  A1 נסגר ואושר ע״י המשוב של מנעול תא");
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
  Wire.begin(4, 5);   // ערוץ ראשי

  Serial.println("🔍 סורק רכיבי I2C...");
  bool expanderFound = false;

  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("✅ נמצא רכיב I2C בכתובת: 0x%02X\n", address);
      if (address == 0x20) expanderFound = true; // לדוגמה
    }
  }

  if (!expanderFound) {
    Serial.println("❌ מרחיב PCF8574 בכתובת 0x20 לא נמצא. עצירה.");
    while (true);
  }

  // אתחול המרחיבים
  expander.begin();         // פלט 0x20 (לדוגמה)
  expander2.begin();        // פלט 0x21

  Serial.println("🟢 כל מרחיבי ה־PCF8574 הופעלו בהצלחה");

  Serial.println("📦 מיפוי מרחיבי PCF:");
  Serial.println("• 0x20 → פלט (expander)");
  Serial.println("• 0x21 → פלט (expander2)");
 
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

    // WebSocket
    webSocket.beginSSL(websocket_host, websocket_port, websocket_path);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);

    Serial.printf("🔄 מתחבר לשרת החומרה: WSS://%s:%d%s\n", 
                  websocket_host, websocket_port, websocket_path);
  }
}

void loop() {
  server.handleClient(); // ⭐ חשוב! מטפל בבקשות HTTP
  webSocket.loop();

  // התחברות מחדש ל־WebSocket אם נותק
  if (!webSocket.isConnected()) {
    static unsigned long lastReconnectAttemptWS = 0;
    const unsigned long reconnectIntervalWS = 10000; // כל 10 שניות ניסיון

    unsigned long now = millis();
    if (now - lastReconnectAttemptWS > reconnectIntervalWS) {
      Serial.println("🔁 מנסה להתחבר מחדש ל־WebSocket...");
      webSocket.beginSSL(websocket_host, websocket_port, websocket_path);
      lastReconnectAttemptWS = now;
    }
  }

  // פינג כל 25 שניות
  static unsigned long lastPingTime = 0;
  const unsigned long pingInterval = 10000;

  if (webSocket.isConnected()) {
    unsigned long now = millis();
    if (now - lastPingTime > pingInterval) {
      DynamicJsonDocument pingDoc(128);
      pingDoc["type"] = "ping";
      pingDoc["id"] = deviceId;

      String pingJson;
      serializeJson(pingDoc, pingJson);
      webSocket.sendTXT(pingJson);

      lastPingTime = now;
      Serial.printf("[%lu] 📤 נשלח פינג לRailway: %s\n", millis(), pingJson.c_str());
    }
  }

  // ניטור WebSocket וניהול הנורה
  static bool lastWebSocketState = false;
  bool currentWebSocketState = webSocket.isConnected();

  if (currentWebSocketState != lastWebSocketState) {
    if (currentWebSocketState) {
      Serial.println("🟢 WebSocket התחבר מחדש לRailway!");
      digitalWrite(WS_STATUS_LED, LOW);
    } else {
      Serial.println("🔴 WebSocket נותק מRailway!");
      digitalWrite(WS_STATUS_LED, HIGH);
    }
    lastWebSocketState = currentWebSocketState;
  }

  // ניטור מצב WiFi
  static bool lastWiFiConnected = false;
  bool currentWiFiConnected = (WiFi.status() == WL_CONNECTED);

  if (currentWiFiConnected != lastWiFiConnected) {
    if (currentWiFiConnected) {
      Serial.println("📶 WiFi התחבר");
      digitalWrite(WIFI_STATUS_LED, LOW);
      
    } else {
      Serial.println("📴 WiFi התנתק");
      digitalWrite(WIFI_STATUS_LED, HIGH);
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
