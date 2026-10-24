import { useEffect, useRef, useState } from 'react';

export default function App() {
  const socketRef = useRef(null);
  const [conectado, setConectado] = useState(false);
  const [bombaLigada, setBombaLigada] = useState(false);

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
          if (typeof dados.bomba === 'boolean') {
            setBombaLigada(dados.bomba);
          }
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

  const toggleBomba = () => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(JSON.stringify({
      acao: 'toggleBomba',
      estado: !bombaLigada,
    }));
  };

  return (
    <main style={{ minHeight: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem', backgroundColor: '#111827', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Smart Garden</h1>

      <section style={{ width: 'min(100%, 350px)', boxSizing: 'border-box', padding: '2.5rem', borderRadius: '1rem', backgroundColor: '#1F2937', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
        <p style={{ color: '#9CA3AF' }}>Conexão com o ESP32</p>
        <p role="status" style={{ color: conectado ? '#10B981' : '#FBBF24', fontWeight: 'bold' }}>
          {conectado ? 'Conectado' : 'Conectando...'}
        </p>

        <p style={{ marginTop: '2rem', color: '#D1D5DB' }}>Bomba</p>
        <p style={{ fontSize: '2rem', fontFamily: 'monospace', color: bombaLigada ? '#10B981' : '#9CA3AF' }}>
          {bombaLigada ? 'LIGADA' : 'DESLIGADA'}
        </p>

        <button
          type="button"
          onClick={toggleBomba}
          disabled={!conectado}
          style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: conectado ? 'pointer' : 'not-allowed', border: 'none', backgroundColor: bombaLigada ? '#EF4444' : '#10B981', color: 'white', fontSize: '1.1rem', opacity: conectado ? 1 : 0.5 }}
        >
          {bombaLigada ? 'Desligar bomba' : 'Ligar bomba'}
        </button>

        <p style={{ marginTop: '1.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
          Sensor de umidade não conectado
        </p>
      </section>
    </main>
  );
}
