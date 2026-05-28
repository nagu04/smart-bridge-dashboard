#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ESP32Servo.h>
#include "HX711.h"

const int STRESS_DT_PIN = 16;
const int STRESS_SCK_PIN = 4;
const int WEIGHT_DT_PIN = 17;
const int WEIGHT_SCK_PIN = 5;
const int SERVO_PIN = 18;

const float STRESS_CAL_FACTOR = 24000.0;
const float MAX_STRESS_KG = 150.0;
const float WEIGHT_CAL_FACTOR = 103.2;
const float WEIGHT_THRESHOLD_KG = 19.0;

HX711 stressScale;
HX711 weightScale;
Adafruit_MPU6050 mpu;
Servo gateServo;

void setup() {
  Serial.begin(115200);
  while (!Serial) { delay(10); }

  ESP32PWM::allocateTimer(0);
  gateServo.setPeriodHertz(50);
  gateServo.attach(SERVO_PIN, 500, 2400);
  gateServo.write(0);

  stressScale.begin(STRESS_DT_PIN, STRESS_SCK_PIN);
  stressScale.set_scale(STRESS_CAL_FACTOR);
  stressScale.tare();

  weightScale.begin(WEIGHT_DT_PIN, WEIGHT_SCK_PIN);
  weightScale.set_scale(WEIGHT_CAL_FACTOR);
  weightScale.tare();

  if (!mpu.begin()) {
    Serial.println("MPU6050 init failed");
    while (true) {
      delay(1000);
    }
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void loop() {
  float activeWeightKg = 0.0;
  float activeStressKg = 0.0;

  if (weightScale.is_ready()) {
    activeWeightKg = weightScale.get_units(3);
    if (activeWeightKg < 0.05) activeWeightKg = 0.0;
  }

  if (stressScale.is_ready()) {
    activeStressKg = stressScale.get_units(3);
    if (activeStressKg < 0.1) activeStressKg = 0.0;
  }

  float structuralCapacityUsed = (activeStressKg / MAX_STRESS_KG) * 100.0;

  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);
  float tiltAngleX = atan2(accel.acceleration.x, accel.acceleration.z) * 180.0 / PI;

  if (activeWeightKg < WEIGHT_THRESHOLD_KG) {
    gateServo.write(90);
  } else {
    gateServo.write(0);
  }

  float vibrationValue = accel.acceleration.z;

  Serial.print(activeWeightKg, 2);
  Serial.print(",");
  Serial.print(structuralCapacityUsed, 1);
  Serial.print(",");
  Serial.print(tiltAngleX, 1);
  Serial.print(",");
  Serial.println(vibrationValue, 2);

  delay(500);
}