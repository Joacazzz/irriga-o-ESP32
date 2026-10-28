import { useEffect, useRef, useState } from 'react';
import './App.css';

export default function App() {
  const socketRef = useRef(null);
  const [conectado, setConectado] = useState(false);
  const [bombaLigada, setBombaLigada] = useState(false);
  const [soloUmido, setSoloUmido] = useState(null);
  const [modoAutomatico, setModoAutomatico] = useState(true);

  useEffect(() => {
    let socket;
    let reconectar;
    let desmontado = false;

    const conectar = () => {
      const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocolo}//${window.location.host}/ws`);
      socketRef.current = socket;

      socket.addEventListener('open', () => setConectado(true));
      socket.addEventListener('message', (event) => {
        try {
          const dados = JSON.parse(event.data);
          if (typeof dados.bomba === 'boolean') setBombaLigada(dados.bomba);
          if (typeof dados.umido === 'boolean') setSoloUmido(dados.umido);
          if (typeof dados.automatico === 'boolean') setModoAutomatico(dados.automatico);
        } catch (erro) {
          console.error('Resposta inválida do ESP32:', erro);
        }
      });
      socket.addEventListener('close', () => {
        setConectado(false);
        if (!desmontado) {
          reconectar = window.setTimeout(conectar, 2000);
        }
      });
      socket.addEventListener('error', () => socket.close());
    };

    conectar();

    return () => {
      desmontado = true;
      window.clearTimeout(reconectar);
      socket?.close();
    };
  }, []);

  const enviarComando = (comando) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(comando));
    }
  };

  const alternarBomba = () => {
    enviarComando({ acao: 'toggleBomba', estado: !bombaLigada });
  };

  const alternarModo = () => {
    enviarComando({ acao: 'setMode', automatico: !modoAutomatico });
  };

  const sensorDisponivel = soloUmido !== null;

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">SG</div>
        <div className="brand-copy">
          <p className="eyebrow">IRRIGAÇÃO INTELIGENTE</p>
          <h1>Smart Garden</h1>
        </div>
        <div className={`connection ${conectado ? 'is-connected' : ''}`} role="status">
          <span className="connection-dot" />
          {conectado ? 'ESP32 conectado' : 'Conectando ao ESP32'}
        </div>
      </header>

      <section className="intro">
        <p className="eyebrow">PAINEL DE CONTROLE</p>
        <h2>Cuidado na medida certa.</h2>
        <p>Acompanhe o solo e controle a irrigação em tempo real.</p>
      </section>

      <section className="status-grid" aria-label="Status do sistema">
        <article className="status-card">
          <div className="card-heading">
            <span className="card-icon soil-icon" aria-hidden="true">◉</span>
            <span>Umidade do solo</span>
          </div>
          <p className={`primary-reading ${sensorDisponivel ? (soloUmido ? 'reading-wet' : 'reading-dry') : ''}`}>
            {sensorDisponivel ? (soloUmido ? 'Úmido' : 'Seco') : 'Aguardando'}
          </p>
          <p className="card-caption">
            {sensorDisponivel
              ? (soloUmido ? 'Solo dentro do limiar configurado' : 'Solo precisa de irrigação')
              : 'Sem leitura do sensor'}
          </p>
          <div className={`state-pill ${sensorDisponivel && soloUmido ? 'pill-wet' : ''}`}>
            <span className="state-dot" />
            {sensorDisponivel ? (soloUmido ? 'Umidade detectada' : 'Solo seco') : 'Sensor D4'}
          </div>
          <p className="technical-note">Sensor digital · pino D4 (GPIO4)</p>
        </article>

        <article className="status-card pump-card">
          <div className="card-heading">
            <span className="card-icon pump-icon" aria-hidden="true">↗</span>
            <span>Bomba d’água</span>
          </div>
          <p className={`primary-reading ${bombaLigada ? 'reading-pump-on' : ''}`}>
            {bombaLigada ? 'Ligada' : 'Desligada'}
          </p>
          <p className="card-caption">
            {modoAutomatico ? 'Controlada pelo sensor de umidade' : 'Controle manual ativado'}
          </p>
          <button
            className={`pump-button ${bombaLigada ? 'button-stop' : ''}`}
            type="button"
            onClick={alternarBomba}
            disabled={!conectado || modoAutomatico}
          >
            {bombaLigada ? 'Desligar bomba' : 'Ligar bomba'}
          </button>
          {modoAutomatico && <p className="button-hint">Mude para manual para controlar a bomba.</p>}
        </article>
      </section>

      <section className="control-card" aria-labelledby="control-title">
        <div className="control-copy">
          <p className="eyebrow">MODO DE OPERAÇÃO</p>
          <h2 id="control-title">{modoAutomatico ? 'Automático' : 'Manual'}</h2>
          <p>
            {modoAutomatico
              ? 'A bomba liga quando o sensor detecta solo seco e desliga quando detecta umidade.'
              : 'A bomba permanece sob seu controle pelo botão acima.'}
          </p>
        </div>
        <button
          className="mode-button"
          type="button"
          onClick={alternarModo}
          disabled={!conectado}
          aria-pressed={modoAutomatico}
        >
          {modoAutomatico ? 'Ativar modo manual' : 'Ativar modo automático'}
        </button>
      </section>

      <footer className="dashboard-footer">
        <span>Leitura digital: LOW = úmido · HIGH = seco</span>
        <span>Limiar ajustado no potenciômetro do sensor</span>
      </footer>
    </main>
  );
}
