#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

const char* ssid = "Ftc-SL1";
const char* password = "fatecatb";

const int pinoRele = 2; // Seu módulo relé
bool bombaLigada = false;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void notifyClients(String msg) {
  ws.textAll(msg);
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    JsonDocument doc;
    doc["bomba"] = bombaLigada;
    String resposta;
    serializeJson(doc, resposta);
    client->text(resposta);
  } else if (type == WS_EVT_DATA) {
    AwsFrameInfo *info = (AwsFrameInfo*)arg;
    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
      JsonDocument doc;
      DeserializationError erro = deserializeJson(doc, data, len);
      if (erro) {
        return;
      }
      
      // Se o front-end mandar ligar/desligar a bomba
      if (doc["acao"] == "toggleBomba" && doc["estado"].is<bool>()) {
        bool estado = doc["estado"];
        bombaLigada = estado;
        digitalWrite(pinoRele, bombaLigada ? HIGH : LOW); // Ajuste HIGH/LOW conforme o seu módulo relé
        
        // Avisa todos os clientes que o estado mudou
        String resposta;
        doc.clear();
        doc["bomba"] = bombaLigada;
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
}