#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";

const int pinoRele = 26; // Seu módulo relé
const int pinoSensor = 34; // Sensor de umidade

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void notifyClients(String msg) {
  ws.textAll(msg);
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_DATA) {
    AwsFrameInfo *info = (AwsFrameInfo*)arg;
    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
      data[len] = 0;
      String message = (char*)data;
      
      JsonDocument doc;
      deserializeJson(doc, message);
      
      // Se o front-end mandar ligar/desligar a bomba
      if (doc["acao"] == "toggleBomba") {
        bool estado = doc["estado"];
        digitalWrite(pinoRele, estado ? HIGH : LOW); // Ajuste HIGH/LOW conforme o seu módulo relé
        
        // Avisa todos os clientes que o estado mudou
        String resposta;
        doc.clear();
        doc["bomba"] = estado;
        serializeJson(doc, resposta);
        notifyClients(resposta);
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(pinoRele, OUTPUT);
  digitalWrite(pinoRele, LOW);
  
  if(!LittleFS.begin(true)){
    Serial.println("Erro ao montar LittleFS");
    return;
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando ao WiFi...");
  }
  Serial.println(WiFi.localIP());

  ws.onEvent(onEvent);
  server.addHandler(&ws);

  // Serve os arquivos do React direto da memória flash
  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

  server.begin();
}

void loop() {
  ws.cleanupClients();
  
  static unsigned long lastTime = 0;
  if (millis() - lastTime > 5000) {
    int valorAnalogico = analogRead(pinoSensor);
    // Converte o valor analógico para porcentagem (calibre esses números de acordo com seu solo)
    int umidade = map(valorAnalogico, 4095, 0, 0, 100); 
    
    JsonDocument doc;
    doc["umidade"] = umidade;
    String json;
    serializeJson(doc, json);
    notifyClients(json);
    
    lastTime = millis();
  }
}