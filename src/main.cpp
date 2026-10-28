#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

const char* ssid = "Ftc-SL1";
const char* password = "fatecatb";

const int pinoRele = 2;
const uint8_t PINO_SENSOR_UMIDADE = 4;
const uint8_t RELE_LIGADO = LOW;
const uint8_t RELE_DESLIGADO = HIGH;
const uint8_t SENSOR_UMIDO_LEVEL = LOW;
const unsigned long INTERVALO_LEITURA_SENSOR = 500;

bool bombaLigada = false;
bool soloUmido = false;
bool modoAutomatico = true;
unsigned long ultimaLeituraSensor = 0;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void aplicarEstadoBomba(bool estado) {
  bombaLigada = estado;
  digitalWrite(pinoRele, bombaLigada ? RELE_LIGADO : RELE_DESLIGADO);
}

void notificarEstado() {
  JsonDocument doc;
  doc["bomba"] = bombaLigada;
  doc["umido"] = soloUmido;
  doc["automatico"] = modoAutomatico;

  String resposta;
  serializeJson(doc, resposta);
  ws.textAll(resposta);
}

void atualizarControleAutomatico() {
  if (modoAutomatico) {
    aplicarEstadoBomba(!soloUmido);
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    JsonDocument doc;
    doc["bomba"] = bombaLigada;
    doc["umido"] = soloUmido;
    doc["automatico"] = modoAutomatico;
    String resposta;
    serializeJson(doc, resposta);
    client->text(resposta);
    return;
  }

  if (type != WS_EVT_DATA) {
    return;
  }

  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (!(info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT)) {
    return;
  }

  JsonDocument doc;
  DeserializationError erro = deserializeJson(doc, data, len);
  if (erro) {
    return;
  }

  if (doc["acao"] == "toggleBomba" && doc["estado"].is<bool>() && !modoAutomatico) {
    aplicarEstadoBomba(doc["estado"].as<bool>());
    notificarEstado();
  } else if (doc["acao"] == "setMode" && doc["automatico"].is<bool>()) {
    modoAutomatico = doc["automatico"].as<bool>();
    atualizarControleAutomatico();
    notificarEstado();
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(pinoRele, OUTPUT);
  digitalWrite(pinoRele, RELE_DESLIGADO);
  pinMode(PINO_SENSOR_UMIDADE, INPUT_PULLUP);

  if (!LittleFS.begin(true)) {
    Serial.println("Falha ao inicializar LittleFS");
  }

  soloUmido = digitalRead(PINO_SENSOR_UMIDADE) == SENSOR_UMIDO_LEVEL;
  atualizarControleAutomatico();

  WiFi.begin(ssid, password);
  Serial.println("Conectando ao WiFi...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());

  ws.onEvent(onEvent);
  server.addHandler(&ws);
  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");
  server.begin();
}

void loop() {
  ws.cleanupClients();

  const unsigned long agora = millis();
  if (agora - ultimaLeituraSensor >= INTERVALO_LEITURA_SENSOR) {
    ultimaLeituraSensor = agora;

    const bool novaLeituraUmida = digitalRead(PINO_SENSOR_UMIDADE) == SENSOR_UMIDO_LEVEL;
    if (novaLeituraUmida != soloUmido) {
      soloUmido = novaLeituraUmida;
      atualizarControleAutomatico();
      notificarEstado();
    }
  }

}