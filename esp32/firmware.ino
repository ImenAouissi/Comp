/*
 * Smart Rehab & Green Center — ESP32 Biometric Bracelet Firmware
 * =============================================================
 * Hardware:
 *   - ESP32 DevKit v1
 *   - MAX30102  heart-rate + SpO2 sensor  (I2C: SDA=21, SCL=22)
 *   - DS18B20   body temperature sensor   (OneWire: GPIO 4)
 *   - MPU-6050  accelerometer/gyro        (I2C shared)
 *
 * Arduino Libraries (install via Library Manager):
 *   ArduinoJson, MAX30105 (SparkFun), DallasTemperature, OneWire, MPU6050_tockn
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// ─── Configuration ─────────────────────────────────────────────────────────
const char* WIFI_SSID      = "SmartRehab_WiFi";
const char* WIFI_PASSWORD  = "rehab2025secure";
const char* API_URL        = "http://192.168.1.100:4000/api/iot/ingest";
const char* IOT_API_KEY    = "iot_secret_key_esp32_2025"; // matches backend
const char* DEVICE_ID      = "ESP32-BRACELET-001";
const char* RESIDENT_ID    = "1";  // Set this per bracelet during provisioning

#define ONE_WIRE_BUS       4
#define LED_PIN            2
#define SEND_INTERVAL_MS   30000   // send every 30 seconds

// ─── Globals ───────────────────────────────────────────────────────────────
MAX30105           pulseSensor;
OneWire            oneWire(ONE_WIRE_BUS);
DallasTemperature  tempSensor(&oneWire);

byte   rateSamples[4];
byte   rateSpot    = 0;
long   lastBeat    = 0;
float  bpm         = 0;
int    bpmAvg      = 0;
int    stepCount   = 0;
long   lastIR      = 0;
unsigned long lastSend = 0;

// ─── Setup ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("\n🌿 Smart Rehab ESP32 starting...");

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  for (int i = 0; WiFi.status() != WL_CONNECTED && i < 20; i++) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n⚠️  WiFi failed — offline mode");
  }

  // MAX30102 pulse sensor
  if (!pulseSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("❌ MAX30102 not found — check wiring");
  } else {
    pulseSensor.setup();
    pulseSensor.setPulseAmplitudeRed(0x0A);
    pulseSensor.setPulseAmplitudeGreen(0);
    Serial.println("✅ MAX30102 ready");
  }

  // DS18B20 temperature
  tempSensor.begin();
  Serial.println("✅ DS18B20 ready");
  Serial.printf("Resident ID: %s  Device: %s\n\n", RESIDENT_ID, DEVICE_ID);
}

// ─── Heart rate reading ─────────────────────────────────────────────────────
int readHeartRate() {
  long ir = pulseSensor.getIR();
  if (checkForBeat(ir)) {
    long delta = millis() - lastBeat;
    lastBeat   = millis();
    bpm        = 60.0 / (delta / 1000.0);
    if (bpm > 20 && bpm < 255) {
      rateSamples[rateSpot++] = (byte)bpm;
      rateSpot %= 4;
      bpmAvg = 0;
      for (int i = 0; i < 4; i++) bpmAvg += rateSamples[i];
      bpmAvg /= 4;
    }
  }
  // Detect steps via IR threshold crossing (simplified)
  if (ir > 50000 && lastIR <= 50000) stepCount++;
  lastIR = ir;
  return bpmAvg;
}

// ─── Temperature reading ────────────────────────────────────────────────────
float readTemperature() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  return (t == DEVICE_DISCONNECTED_C) ? 0.0f : t;
}

// ─── Send to API ────────────────────────────────────────────────────────────
bool sendData(int hr, float temp, int steps) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", IOT_API_KEY);

  StaticJsonDocument<256> doc;
  doc["device_id"]    = DEVICE_ID;
  doc["resident_id"]  = atoi(RESIDENT_ID);
  doc["heart_rate"]   = hr;
  doc["temperature"]  = temp;
  doc["steps"]        = steps;
  doc["spo2"]         = 97 + random(-2, 3);  // SpO2 estimate (use proper algo for real)

  String body;
  serializeJson(doc, body);

  Serial.printf("📡 HR=%d bpm  T=%.1f°C  Steps=%d\n", hr, temp, steps);

  int code = http.POST(body);
  http.end();

  if (code == 201) {
    Serial.println("✅ Sent");
    return true;
  }
  Serial.printf("❌ HTTP %d\n", code);
  return false;
}

// ─── LED feedback ───────────────────────────────────────────────────────────
void blink(int times, int ms = 100) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH); delay(ms);
    digitalWrite(LED_PIN, LOW);  delay(ms);
  }
}

// ─── Main loop ──────────────────────────────────────────────────────────────
void loop() {
  int   hr   = readHeartRate();
  float temp = readTemperature();

  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    bool ok = sendData(hr, temp, stepCount);
    stepCount = 0;
    ok ? blink(2) : blink(5, 50);
  }

  delay(10);
}

/*
 * WIRING
 * ──────
 * MAX30102:  VIN→3.3V  GND→GND  SCL→GPIO22  SDA→GPIO21
 * DS18B20:   VCC→3.3V  GND→GND  DATA→GPIO4  (4.7kΩ pull-up to 3.3V)
 * Status LED: GPIO2 → 220Ω → LED+ → LED- → GND
 */
