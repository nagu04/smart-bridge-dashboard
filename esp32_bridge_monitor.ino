#include <WiFi.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <Wire.h>
#include <MPU6050.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://192.168.1.100:8000/src/api/update.php";
const char* apiKey = "your_api_key_here";

const int LOADCELL_DOUT_PIN = 32;
const int LOADCELL_SCK_PIN = 33;
const int LOAD_CELL_COUNT = 5;
const int SENSOR_INTERVAL_MS = 1000;

HX711 loadCell;
MPU6050 imu(Wire);

unsigned long lastSend = 0;
unsigned long lastWifiCheck = 0;

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("Connecting to %s", ssid);
  WiFi.begin(ssid, password);
  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    Serial.print('.');
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect Wi-Fi, retrying later");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Wire.begin();

  loadCell.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  loadCell.set_scale(2280.f);
  loadCell.tare();

  imu.begin();
  imu.calcGyroOffsets(true);

  connectWifi();
}

String buildJsonPayload(float weight, float stress, float tilt, float vibration, const String& gateStatus, const String& systemStatus) {
  String payload = "{";
  payload += "\"api_key\":\"" + String(apiKey) + "\",";
  payload += "\"weight\":" + String(weight, 2) + ",";
  payload += "\"stress\":" + String(stress, 2) + ",";
  payload += "\"tilt\":" + String(tilt, 2) + ",";
  payload += "\"vibration\":" + String(vibration, 2) + ",";
  payload += "\"gate_status\":\"" + gateStatus + "\",";
  payload += "\"system_status\":\"" + systemStatus + "\",";
  payload += "\"timestamp\":" + String(time(nullptr));
  payload += "}";
  return payload;
}

bool sendSensorReading(float weight, float stress, float tilt, float vibration, const String& gateStatus, const String& systemStatus) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Wi-Fi not connected, skipping send");
      return false;
    }
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-KEY", apiKey);

  String payload = buildJsonPayload(weight, stress, tilt, vibration, gateStatus, systemStatus);
  int responseCode = http.POST(payload);

  if (responseCode == HTTP_CODE_OK) {
    String response = http.getString();
    Serial.printf("Sent data, response=%d, body=%s\n", responseCode, response.c_str());
    http.end();
    return true;
  }

  Serial.printf("HTTP failed, code=%d\n", responseCode);
  http.end();
  return false;
}

void loop() {
  unsigned long now = millis();
  if (now - lastWifiCheck > 10000) {
    connectWifi();
    lastWifiCheck = now;
  }

  if (now - lastSend < SENSOR_INTERVAL_MS) {
    return;
  }
  lastSend = now;

  float weight = loadCell.is_ready() ? loadCell.get_units(LOAD_CELL_COUNT) : 0.0;
  float stress = abs(imu.getAngleX()) + abs(imu.getAngleY());
  float vibration = imu.getAccelX() * imu.getAccelX() + imu.getAccelY() * imu.getAccelY() + imu.getAccelZ() * imu.getAccelZ();
  vibration = sqrt(vibration);
  float tilt = imu.getAngleX();

  String gateStatus = (weight > 20.0) ? "CLOSED" : "OPEN";
  String systemStatus = (WiFi.status() == WL_CONNECTED) ? "ONLINE" : "RECONNECTING";

  bool ok = sendSensorReading(weight, stress, tilt, vibration, gateStatus, systemStatus);
  if (!ok) {
    Serial.println("Retrying after delay...");
    delay(500);
    connectWifi();
  }
}
