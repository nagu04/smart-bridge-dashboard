#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <HTTPClient.h>
#include "HX711.h"

// ========================================================
// 📶 WI-FI & NETWORK CONFIGURATION
// ========================================================
const char* ssid     = "jeronemoo";
const char* password = "negisraa";

const char* laptopIP = "172.20.10.12";
const int remotePort = 9999;
const char* dashboardConfigUrl = "http://192.168.1.14:8080/smart-bridge-dashboard/src/api/esp32_config.php";

WiFiUDP udp;

// ========================================================
// 📍 PIN CONFIGURATION
// ========================================================
const int MPU_SCL_PIN = 2;
const int MPU_SDA_PIN = 15;

const int STRAIN_SCK_PIN = 22;
const int STRAIN_DT_PIN = 21;
const int WEIGHT_DT_PIN = 33;
const int WEIGHT_SCK_PIN = 25;

const int SERVO_PIN = 13;

// ========================================================
// ⚙️ CALIBRATION & THRESHOLDS
// ========================================================
const float WEIGHT_CAL_FACTOR = -98248.0;
const float STRAIN_CAL_FACTOR = 24000.0;
const float VEHICLE_DETECT_THRESHOLD = 1.0;

float maxWeightBarKg = 35.0;
float maxStrainBridgeKg = 40.0;
unsigned long lastConfigFetch = 0;
const unsigned long CONFIG_FETCH_INTERVAL = 30000; // Fetch every 30 seconds

HX711 strainScale;
HX711 weightScale;
Adafruit_MPU6050 mpu;
Servo gateServo;

// Fetch configuration from dashboard
void fetchDashboardConfig() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  http.begin(dashboardConfigUrl);
  http.setConnectTimeout(5000);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("Config response: " + payload);
    
    // Parse JSON (simple parsing without library)
    int idx1 = payload.indexOf("max_weight_bar_kg\":");
    if (idx1 > 0) {
      String valStr = payload.substring(idx1 + 18);
      float val = valStr.toFloat();
      if (val > 0) {
        maxWeightBarKg = val;
        Serial.print("[CONFIG] Max Weight Bar: ");
        Serial.println(maxWeightBarKg);
      }
    }
    
    idx1 = payload.indexOf("max_strain_bridge_kg\":");
    if (idx1 > 0) {
      String valStr = payload.substring(idx1 + 21);
      float val = valStr.toFloat();
      if (val > 0) {
        maxStrainBridgeKg = val;
        Serial.print("[CONFIG] Max Strain Bridge: ");
        Serial.println(maxStrainBridgeKg);
      }
    }
    
    lastConfigFetch = millis();
  } else {
    Serial.print("Config fetch failed, code: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

void setup() {
  Serial.begin(115200);
  
  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[SUCCESS] Wi-Fi Connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[ERROR] Wi-Fi Connection Failed");
  }

  udp.begin(0);

  // Initialize I2C for MPU6050
  Wire.begin(MPU_SDA_PIN, MPU_SCL_PIN);

  // Setup Servo
  ESP32PWM::allocateTimer(0);
  gateServo.setPeriodHertz(50);
  gateServo.attach(SERVO_PIN, 500, 2400);
  gateServo.write(0);

  // Initialize Scales
  weightScale.begin(WEIGHT_DT_PIN, WEIGHT_SCK_PIN);
  weightScale.set_scale(WEIGHT_CAL_FACTOR);
  weightScale.tare();

  strainScale.begin(STRAIN_DT_PIN, STRAIN_SCK_PIN);
  strainScale.set_scale(STRAIN_CAL_FACTOR);
  strainScale.tare();

  // Initialize MPU6050
  if (!mpu.begin()) {
    Serial.println("MPU6050 init failed");
    while (true) { delay(1000); }
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("[SUCCESS] Smart Gate System Fully Operational.");
  
  // Fetch config immediately
  fetchDashboardConfig();
}

void loop() {
  // Periodically fetch updated config from dashboard
  if (millis() - lastConfigFetch > CONFIG_FETCH_INTERVAL) {
    fetchDashboardConfig();
  }

  // Read Sensors
  float activeWeightKg = 0.0;
  float activeStressKg = 0.0;

  if (weightScale.is_ready()) {
    activeWeightKg = weightScale.get_units(3);
    if (activeWeightKg < 0.20) activeWeightKg = 0.0;
  }

  if (strainScale.is_ready()) {
    activeStressKg = strainScale.get_units(3);
    if (activeStressKg < 0.1) activeStressKg = 0.0;
  }

  float structuralCapacityUsed = (activeStressKg / maxStrainBridgeKg) * 100.0;
  if (structuralCapacityUsed < 0.0) structuralCapacityUsed = 0.0;

  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);
  float tiltAngleX = atan2(accel.acceleration.x, accel.acceleration.z) * 180.0 / PI;
  float vibrationValue = accel.acceleration.z;

  // Gate Control using DASHBOARD-SET thresholds
  if (activeWeightKg >= VEHICLE_DETECT_THRESHOLD && activeWeightKg <= maxWeightBarKg) {
    gateServo.write(90); // OPEN
  } else {
    gateServo.write(0);  // CLOSED
  }

  // Send Telemetry
  String telemetryCSV = String(activeWeightKg, 2) + "," + 
                        String(structuralCapacityUsed, 1) + "," + 
                        String(tiltAngleX, 1) + "," + 
                        String(vibrationValue, 2);

  Serial.println(telemetryCSV);

  if (WiFi.status() == WL_CONNECTED) {
    udp.beginPacket(laptopIP, remotePort);
    udp.print(telemetryCSV);
    udp.endPacket();
  }

  delay(500);
}