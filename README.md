# 🌱 Smart Garden (Irrigação Automática com ESP32)

Um sistema de irrigação com esteroides. Em vez de simplesmente usar um timer analógico de tomada, este projeto utiliza um ESP32 rodando um servidor web assíncrono em C++, que hospeda uma interface moderna feita em React (Vite) diretamente em sua memória flash. A comunicação acontece em tempo real via WebSockets, porque dar *refresh* na página para saber se a sua planta sobreviveu à seca é inaceitável.

## 🚀 Funcionalidades

- **Dashboard em Tempo Real:** Monitoramento do estado seco/úmido do solo e da bomba, atualizado pelo WebSocket.
- **Irrigação Automática:** O sensor digital no D4 (GPIO4) liga a bomba quando indica solo seco e a desliga quando indica umidade. O limiar é ajustado no potenciômetro do módulo.
- **Controle Manual:** Alterne o painel para o modo manual e controle a bomba pelo navegador.
- **Armazenamento de Histórico (Sem fritar o chip):** Log de eventos salvo de forma leve (CSV/JSON), poupando os ciclos de escrita da memória flash e abandonando ideias megalomaníacas de rodar bancos de dados relacionais no microcontrolador.
- **Single Page Application Embarcada:** O build de produção do React vive compactado dentro do ESP32 usando LittleFS. Zero dependência de nuvens de terceiros.

## 🛠️ Tecnologias Utilizadas

**Back-end (O Peão da Obra)**
- ESP32 + C++
- [PlatformIO](https://platformio.org/)
- `ESPAsyncWebServer`, `AsyncTCP` e `ArduinoJson`
- LittleFS (Filesystem)

**Front-end (A Maquiagem)**
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- CSS (Pronto para migração pro Tailwind)

## ⚙️ Como compilar e rodar essa maravilha

### 1. Preparando a Interface (Front-end)
Navegue até a pasta do front-end e instale as dependências (prepare a paciência, é o Node.js baixando meia internet):
```bash
cd frontend
npm install
