#include <Arduino.h>
#include <LittleFS.h>
#include <sqlite3.h>

sqlite3 *db;

// Callback obrigatório do C para imprimir o retorno dos SELECTs
static int callback(void *data, int argc, char **argv, char **azColName) {
  for (int i = 0; i < argc; i++) {
    Serial.printf("%s = %s\n", azColName[i], argv[i] ? argv[i] : "NULL");
  }
  Serial.println("---");
  return 0;
}

// Função auxiliar para executar comandos SQL sem sujar todo o código
void executarSQL(const char* sql) {
  char *zErrMsg = 0;
  Serial.printf("Executando: %s\n", sql);
  
  int rc = sqlite3_exec(db, sql, callback, NULL, &zErrMsg);
  if (rc != SQLITE_OK) {
    Serial.printf("Erro SQL: %s\n", zErrMsg);
    sqlite3_free(zErrMsg);
  } else {
    Serial.println("Comando executado com sucesso.");
  }
}

void setup() {
  Serial.begin(115200);

  // 1. Inicia o LittleFS (onde o banco vai morar junto com seu front-end React)
  if (!LittleFS.begin(true)) {
    Serial.println("Erro ao montar LittleFS");
    return;
  }

  // 2. Inicializa a engine do SQLite
  sqlite3_initialize();
  
  // 3. Abre ou cria o banco de dados. O ESP32 usa a notação /littlefs/
  int rc = sqlite3_open("/littlefs/historico.db", &db);
  if (rc) {
    Serial.printf("Falha ao abrir o banco de dados: %s\n", sqlite3_errmsg(db));
    return;
  }

  // 4. Cria a tabela de logs (se não existir)
  const char *sqlCreateTable = 
    "CREATE TABLE IF NOT EXISTS logs ("
    "id INTEGER PRIMARY KEY AUTOINCREMENT, "
    "data_hora TEXT, "
    "evento TEXT, "
    "umidade INTEGER);";
  executarSQL(sqlCreateTable);

  // 5. Insere um registro de teste (Finja que a bomba ligou)
  const char *sqlInsert = "INSERT INTO logs (data_hora, evento, umidade) VALUES ('2026-10-09 20:44:00', 'Bomba Ligada (Auto)', 59);";
  executarSQL(sqlInsert);

  // 6. Lê os dados para provar que está lá
  Serial.println("Lendo o histórico:");
  executarSQL("SELECT * FROM logs LIMIT 5;");
}

void loop() {
  // A lógica do seu sensor de umidade continua aqui
}