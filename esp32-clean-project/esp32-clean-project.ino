#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <Wire.h>
#include <PCF8574.h>

#define WIFI_STATUS_LED 18
#define WS_STATUS_LED 19
#define CELL_A1_STATUS_PIN 20

volatile bool receivedCloseConfirmation = false;

// WiFi settings
const char* password = "0545464421";
String targetPrefix = "Ido2";

// API settings
const char* api_host = "lockerweb-production.up.railway.app";
const char* api_endpoint = "/api/ws";
const char* commands_endpoint = "/api/arduino/commands";

HTTPClient http;
WebServer server(80);
Preferences prefs;

String bestSSID = "";
String deviceId = "";

// 4 PCF8574 expanders for 32 cells
PCF8574 expander1(0x20, &Wire);  // Cells A1-A8
PCF8574 expander2(0x21, &Wire);  // Cells A9-A16
PCF8574 expander3(0x22, &Wire);  // Cells A17-A24
PCF8574 expander4(0x23, &Wire);  // Cells A25-A32

// Timing
unsigned long lastPingTime = 0;
unsigned long lastRegisterTime = 0;
unsigned long lastCommandCheck = 0;

const unsigned long pingInterval = 30000;
const unsigned long registerInterval = 60000;
const unsigned long commandCheckInterval = 3000;

// Statistics
struct Stats {
  unsigned long totalCommands = 0;
  unsigned long successfulUnlocks = 0;
  unsigned long failedUnlocks = 0;
} stats;

struct ConnectionStatus {
  bool isOnline = false;
  unsigned long lastApiCall = 0;
  int consecutiveFailures = 0;
  String lastError = "";
} connectionStatus;

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

bool sendToAPI(DynamicJsonDocument& doc, bool isRetryable = true) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - cannot send message");
    connectionStatus.lastError = "WiFi disconnected";
    return false;
  }

  String url = "https://" + String(api_host) + String(api_endpoint);
  
  int maxRetries = isRetryable ? 3 : 1;
  
  for (int attempt = 1; attempt <= maxRetries; attempt++) {
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", String("ESP32-Locker/") + deviceId);
    http.setTimeout(10000);
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.printf("Sending to API (attempt %d/%d): %s\n", attempt, maxRetries, jsonString.c_str());
    
    int httpCode = http.POST(jsonString);
    connectionStatus.lastApiCall = millis();
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.printf("API Response (%d): %s\n", httpCode, response.c_str());
      
      if (httpCode == 200) {
        connectionStatus.isOnline = true;
        connectionStatus.consecutiveFailures = 0;
        connectionStatus.lastError = "";
        http.end();
        return true;
      }
    }
    
    connectionStatus.consecutiveFailures++;
    connectionStatus.lastError = "HTTP " + String(httpCode);
    
    Serial.printf("Error in attempt %d: HTTP %d\n", attempt, httpCode);
    http.end();
    
    if (attempt < maxRetries) {
      delay(1000 * attempt);
    }
  }
  
  connectionStatus.isOnline = false;
  Serial.printf("All attempts failed after %d tries\n", maxRetries);
  return false;
}

void registerWithServer() {
  Serial.println("Registering with server (32 cells)...");
  
  DynamicJsonDocument doc(2048);
  doc["type"] = "register";
  doc["id"] = deviceId;
  doc["ip"] = WiFi.localIP().toString();
  doc["status"] = "online";
  doc["firmware_version"] = "EXPANDED_v1.0";
  doc["total_cells"] = 32;
  doc["uptime"] = millis();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["chip_model"] = ESP.getChipModel();
  
  JsonObject hardware = doc.createNestedObject("hardware");
  hardware["wifi_rssi"] = WiFi.RSSI();
  hardware["wifi_ssid"] = WiFi.SSID();
  hardware["mac_address"] = WiFi.macAddress();
  hardware["expanders_count"] = 4;
  
  // Register all 32 cells
  JsonObject cells = doc.createNestedObject("cells");
  for (int i = 1; i <= 32; i++) {
    String cellName = "A" + String(i);
    JsonObject cell = cells.createNestedObject(cellName);
    cell["locked"] = true;
    cell["opened"] = false;
    cell["hasPackage"] = false;
    
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
    Serial.println("Registration successful for 32 cells");
    digitalWrite(WS_STATUS_LED, LOW);
  } else {
    Serial.println("Registration failed");
    digitalWrite(WS_STATUS_LED, HIGH);
  }
}

void sendPing() {
  DynamicJsonDocument doc(256);
  doc["type"] = "ping";
  doc["id"] = deviceId;
  doc["timestamp"] = millis();
  doc["uptime"] = millis();
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["total_cells"] = 32;
  
  if (sendToAPI(doc)) {
    Serial.println("Ping sent successfully");
  }
}

void checkPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  String url = "https://" + String(api_host) + String(commands_endpoint) + "?deviceId=" + deviceId;
  
  http.begin(url);
  http.addHeader("User-Agent", String("ESP32-Locker/") + deviceId);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    
    if (response.indexOf("\"commands\":[]") == -1) {
      Serial.printf("Checking commands: %s\n", response.c_str());
    }
    
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("commands")) {
      JsonArray commands = doc["commands"];
      
      for (JsonObject command : commands) {
        String type = command["type"].as<String>();
        String cell = command["cell"].as<String>();
        String requestId = command["requestId"].as<String>();
        
        Serial.printf("Executing command: %s cell %s (ID: %s)\n", type.c_str(), cell.c_str(), requestId.c_str());
        
        stats.totalCommands++;
        
        if (type == "unlock") {
          bool success = unlockCell(cell);
          
          if (success) {
            stats.successfulUnlocks++;
          } else {
            stats.failedUnlocks++;
          }
          
          if (requestId != "") {
            DynamicJsonDocument responseDoc(256);
            responseDoc["type"] = "unlockResponse";
            responseDoc["requestId"] = requestId;
            responseDoc["lockerId"] = deviceId;
            responseDoc["cellId"] = cell;
            responseDoc["success"] = success;
            responseDoc["timestamp"] = millis();
            
            sendToAPI(responseDoc, false);
          }
          
          Serial.printf("Unlock command %s: %s\n", success ? "successful" : "failed", cell.c_str());
        }
      }
    }
  } else if (httpCode != 304 && httpCode != 0) {
    Serial.printf("Error checking commands: %d\n", httpCode);
  }
  
  http.end();
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
  Serial.println("Local command received: " + body);

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
    response["message"] = success ? "Cell opened successfully" : "Error opening cell";
    response["deviceId"] = deviceId;
    response["cell"] = cell;
    response["timestamp"] = millis();

    String jsonString;
    serializeJson(response, jsonString);
    server.send(200, "application/json", jsonString);
  }
  else if (action == "status") {
    DynamicJsonDocument response(1024);
    response["deviceId"] = deviceId;
    response["uptime"] = millis();
    response["wifi_rssi"] = WiFi.RSSI();
    response["free_heap"] = ESP.getFreeHeap();
    response["total_cells"] = 32;
    response["stats"]["total_commands"] = stats.totalCommands;
    response["stats"]["successful_unlocks"] = stats.successfulUnlocks;
    response["stats"]["failed_unlocks"] = stats.failedUnlocks;

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
    Serial.printf("Writing to expander 1 (0x20) pin %d value %d\n", pinNumber, value);
    expander1.write(pinNumber, value);
  } else if (pinNumber < 16) {
    Serial.printf("Writing to expander 2 (0x21) pin %d value %d\n", pinNumber - 8, value);
    expander2.write(pinNumber - 8, value);
  } else if (pinNumber < 24) {
    Serial.printf("Writing to expander 3 (0x22) pin %d value %d\n", pinNumber - 16, value);
    expander3.write(pinNumber - 16, value);
  } else if (pinNumber < 32) {
    Serial.printf("Writing to expander 4 (0x23) pin %d value %d\n", pinNumber - 24, value);
    expander4.write(pinNumber - 24, value);
  } else {
    Serial.printf("Invalid pin number: %d (valid: 0-31)\n", pinNumber);
  }
}

void connectToWiFi() {
  Serial.println("Scanning WiFi networks...");
  int n = WiFi.scanNetworks();
  int bestRSSI = -999;
  
  Serial.printf("Found %d networks:\n", n);
  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);
    String encryption = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Open" : "Encrypted";
    
    Serial.printf("[%d] '%s' | RSSI: %d | %s\n", i + 1, ssid.c_str(), rssi, encryption.c_str());
    
    if (ssid.startsWith(targetPrefix) && rssi > bestRSSI) {
      bestSSID = ssid;
      bestRSSI = rssi;
    }
  }

  if (bestSSID == "") {
    Serial.println("No suitable network found");
    writePin(0, HIGH);
    return;
  }

  Serial.printf("Connecting to %s (RSSI: %d)\n", bestSSID.c_str(), bestRSSI);
  Serial.printf("MAC Address: %s\n", WiFi.macAddress().c_str());

  WiFi.begin(bestSSID.c_str(), password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    digitalWrite(WIFI_STATUS_LED, LOW);
  } else {
    Serial.println("\nWiFi failed");
    digitalWrite(WIFI_STATUS_LED, HIGH);
  }
}

bool isCellClosed(int cellNumber) {
  if (cellNumber != 1) {
    return true; // No feedback for other cells, assume closed
  }

  int value = digitalRead(CELL_A1_STATUS_PIN);
  return value == LOW; // 0V = closed
}

bool unlockCell(String cell) {
  int pin = -1;
  int cellNumber = -1;

  if (cell.startsWith("A")) {
    cellNumber = cell.substring(1).toInt();
    if (cellNumber >= 1 && cellNumber <= 32) {
      pin = cellNumber - 1;
    }
  }

  if (pin == -1) {
    Serial.printf("Invalid cell ID: %s (valid: A1-A32)\n", cell.c_str());
    return false;
  }

  // Open the cell
  writePin(pin, LOW);
  delay(1500);
  writePin(pin, HIGH);
  Serial.printf("Cell %s opened (pin %d)\n", cell.c_str(), pin);

  // Only A1 has feedback
  if (cell != "A1") return true;

  delay(1500);

  // Check if cell actually opened
  bool opened = !isCellClosed(1);
  if (!opened) {
    Serial.println("Cell did not open. Sending failure message...");

    DynamicJsonDocument failDoc(256);
    failDoc["type"] = "failedToUnlock";
    failDoc["id"] = deviceId;
    failDoc["cell"] = cell;
    failDoc["reason"] = "did_not_open";
    failDoc["timestamp"] = millis();

    sendToAPI(failDoc);
    Serial.println("Failure message sent to server");
    return false;
  }

  // Wait for cell closure
  Serial.println("Waiting for A1 cell closure...");
  receivedCloseConfirmation = false;

  unsigned long startWaitTime = millis();
  const unsigned long maxWaitTime = 300000; // 5 minutes max

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
      Serial.printf("A1 closed after %.1f seconds\n", (millis() - startWaitTime) / 1000.0);
      break;
    }

    delay(500);
  }

  return true;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("ESP32 EXPANDED Locker System Starting (32 cells)...");
  Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("Chip Model: %s\n", ESP.getChipModel());

  // Setup status LEDs
  pinMode(WIFI_STATUS_LED, OUTPUT);
  pinMode(WS_STATUS_LED, OUTPUT);
  pinMode(CELL_A1_STATUS_PIN, INPUT_PULLUP);
  digitalWrite(WIFI_STATUS_LED, HIGH);
  digitalWrite(WS_STATUS_LED, HIGH);

  // Setup I2C for ESP32-C6
  // ESP32-C6 default I2C pins: SDA=6, SCL=7
  Wire.begin(6, 7);

  Serial.println("Scanning ALL I2C devices first...");
  int totalDevices = 0;
  
  // First scan all I2C addresses to see what's connected
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Found I2C device at address: 0x%02X", address);
      if (address >= 0x20 && address <= 0x27) {
        Serial.print(" (Possible PCF8574!)");
      }
      Serial.println();
      totalDevices++;
    }
  }
  
  if (totalDevices == 0) {
    Serial.println("❌ NO I2C devices found at all!");
    Serial.println("Check connections:");
    Serial.println("- SDA → GPIO 6 (ESP32-C6)");
    Serial.println("- SCL → GPIO 7 (ESP32-C6)");
    Serial.println("- VCC → 3.3V or 5V");
    Serial.println("- GND → GND");
    Serial.println("- Pull-up resistors (4.7kΩ) on SDA/SCL");
  } else {
    Serial.printf("Found %d I2C device(s) total\n", totalDevices);
  }
  
  Serial.println("\nNow checking specific PCF8574 addresses...");
  int expandersFound = 0;

  for (byte address = 0x20; address <= 0x23; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("✅ Found PCF8574 expander at address: 0x%02X\n", address);
      expandersFound++;
    } else {
      Serial.printf("❌ PCF8574 expander at address 0x%02X not found\n", address);
    }
  }

  if (expandersFound == 0) {
    Serial.println("No PCF8574 expanders found. Stopping.");
    while (true) {
      digitalWrite(WS_STATUS_LED, HIGH);
      delay(500);
      digitalWrite(WS_STATUS_LED, LOW);
      delay(500);
    }
  }

  Serial.printf("Found %d PCF8574 expanders out of 4\n", expandersFound);

  // Initialize expanders
  expander1.begin();
  expander2.begin();
  expander3.begin();
  expander4.begin();

  Serial.println("All expanders initialized successfully");

  // Initialize all pins as HIGH output (lock off) - now 32 pins
  for (int i = 0; i < 8; i++) {
    expander1.write(i, HIGH);
    expander2.write(i, HIGH);
    expander3.write(i, HIGH);
    expander4.write(i, HIGH);
  }

  Serial.println("All 32 cells initialized to locked state");

  // Generate device ID
  deviceId = generateFixedDeviceId();
  Serial.printf("ESP32 ID: %s (32 cells)\n", deviceId.c_str());

  // Connect to WiFi
  connectToWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    // Setup HTTP Server
    server.on("/locker", handleLocker);
    server.on("/status", HTTP_GET, []() {
      DynamicJsonDocument doc(1024);
      doc["device_id"] = deviceId;
      doc["uptime"] = millis();
      doc["wifi_rssi"] = WiFi.RSSI();
      doc["free_heap"] = ESP.getFreeHeap();
      doc["total_cells"] = 32;
      doc["total_commands"] = stats.totalCommands;
      doc["successful_unlocks"] = stats.successfulUnlocks;
      doc["failed_unlocks"] = stats.failedUnlocks;
      
      String response;
      serializeJson(doc, response);
      server.send(200, "application/json", response);
    });
    
    server.begin();
    Serial.println("HTTP server active on port 80");
    Serial.printf("Accessible at: http://%s/status\n", WiFi.localIP().toString().c_str());

    // Initial registration
    registerWithServer();
  }
  
  Serial.println("EXPANDED Locker System ready with 32 cells!");
}

void loop() {
  server.handleClient();

  // Only if WiFi is connected
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    
    // Periodic ping
    if (now - lastPingTime > pingInterval) {
      sendPing();
      lastPingTime = now;
    }
    
    // Periodic registration
    if (now - lastRegisterTime > registerInterval) {
      registerWithServer();
      lastRegisterTime = now;
    }
    
    // Check pending commands
    if (now - lastCommandCheck > commandCheckInterval) {
      checkPendingCommands();
      lastCommandCheck = now;
    }
  }

  // WiFi status monitoring
  static bool lastWiFiConnected = false;
  bool currentWiFiConnected = (WiFi.status() == WL_CONNECTED);

  if (currentWiFiConnected != lastWiFiConnected) {
    if (currentWiFiConnected) {
      Serial.println("WiFi connected");
      digitalWrite(WIFI_STATUS_LED, LOW);
      registerWithServer();
    } else {
      Serial.println("WiFi disconnected");
      digitalWrite(WIFI_STATUS_LED, HIGH);
      digitalWrite(WS_STATUS_LED, HIGH);
      connectionStatus.isOnline = false;
    }
    lastWiFiConnected = currentWiFiConnected;
  }

  // WiFi reconnection attempts every 15 seconds
  static unsigned long lastReconnectAttempt = 0;
  const unsigned long reconnectInterval = 15000;

  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > reconnectInterval) {
      Serial.println("Trying to reconnect to WiFi...");
      WiFi.begin(bestSSID.c_str(), password);
      lastReconnectAttempt = now;
    }
  }
  
  // Status LED management
  static unsigned long lastLedUpdate = 0;
  if (millis() - lastLedUpdate > 1000) {
    if (connectionStatus.isOnline && WiFi.status() == WL_CONNECTED) {
      digitalWrite(WS_STATUS_LED, LOW); // Solid green
    } else if (WiFi.status() == WL_CONNECTED) {
      // Connected to WiFi but not to API - blinking
      digitalWrite(WS_STATUS_LED, !digitalRead(WS_STATUS_LED));
    } else {
      digitalWrite(WS_STATUS_LED, HIGH); // Solid red
    }
    lastLedUpdate = millis();
  }
}
