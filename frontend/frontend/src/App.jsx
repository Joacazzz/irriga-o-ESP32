import { useState, useEffect } from 'react';

export default function App() {
  // Estado para controlar a aba atual
  const [telaAtual, setTelaAtual] = useState('dashboard');

  // Estados do sistema
  const [umidade, setUmidade] = useState(74);
  const [bombaLigada, setBombaLigada] = useState(false);
  const [limiteUmidade, setLimiteUmidade] = useState(60);
  
  // Mock de histórico (já que o seu ESP32 imaginário ainda não guarda logs)
  const [historico] = useState([
    { data: '09/10/2026', hora: '14:32', evento: 'Bomba Ligada (Automático)', umidade: '59%' },
    { data: '09/10/2026', hora: '14:45', evento: 'Bomba Desligada (Automático)', umidade: '80%' },
    { data: '08/10/2026', hora: '09:15', evento: 'Bomba Ligada (Manual)', umidade: '45%' },
    { data: '08/10/2026', hora: '09:20', evento: 'Bomba Desligada (Manual)', umidade: '85%' },
  ]);

  useEffect(() => {
    /* 
    Lógica do WebSocket comentada para o futuro
    */
  }, []);

  const toggleBomba = () => {
    const novoEstado = !bombaLigada;
    setBombaLigada(novoEstado);
    console.log(`Comando manual: Bomba = ${novoEstado ? 'LIGADA' : 'DESLIGADA'}`);
  };

  const alterarLimite = (e) => {
    setLimiteUmidade(e.target.value);
  };

  // --- COMPONENTE DO DASHBOARD ---
  const renderDashboard = () => (
    <div style={{ backgroundColor: '#1F2937', padding: '3rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', width: '350px', textAlign: 'center' }}>
      <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#9CA3AF' }}>Umidade do Solo</p>
      <p style={{ fontSize: '4rem', fontFamily: 'monospace', color: '#60A5FA', margin: '0 0 2rem 0' }}>{umidade}%</p>
      
      <button 
        onClick={toggleBomba}
        style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', backgroundColor: bombaLigada ? '#EF4444' : '#10B981', color: 'white', fontSize: '1.1rem', marginBottom: '2rem' }}
      >
        {bombaLigada ? 'Desligar Bomba (Manual)' : 'Ligar Bomba (Manual)'}
      </button>

      <div style={{ borderTop: '1px solid #374151', paddingTop: '1.5rem', textAlign: 'left' }}>
        <p style={{ fontSize: '1rem', color: '#D1D5DB', marginBottom: '1rem' }}>
          Ligar automaticamente abaixo de: <span style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: '1.2rem' }}>{limiteUmidade}%</span>
        </p>
        <input type="range" min="0" max="100" value={limiteUmidade} onChange={alterarLimite} style={{ width: '100%', cursor: 'pointer', accentColor: '#FCD34D' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );

  // --- COMPONENTE DO HISTÓRICO ---
  const renderHistorico = () => (
    <div style={{ backgroundColor: '#1F2937', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', width: '450px', maxWidth: '90vw' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#E5E7EB', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>Últimos Eventos</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
        {historico.map((log, index) => (
          <div key={index} style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#9CA3AF' }}>
              <span>{log.data} - {log.hora}</span>
              <span style={{ color: '#60A5FA', fontWeight: 'bold' }}>{log.umidade}</span>
            </div>
            <div style={{ color: log.evento.includes('Ligada') ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
              {log.evento}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', backgroundColor: '#111827', color: 'white', fontFamily: 'sans-serif', margin: '-8px', paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Smart Garden</h1>
      
      {/* Menu de Navegação */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', backgroundColor: '#1F2937', padding: '0.5rem', borderRadius: '0.5rem' }}>
        <button 
          onClick={() => setTelaAtual('dashboard')}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: telaAtual === 'dashboard' ? '#3B82F6' : 'transparent', color: telaAtual === 'dashboard' ? 'white' : '#9CA3AF', transition: 'all 0.2s' }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setTelaAtual('historico')}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: telaAtual === 'historico' ? '#3B82F6' : 'transparent', color: telaAtual === 'historico' ? 'white' : '#9CA3AF', transition: 'all 0.2s' }}
        >
          Histórico
        </button>
      </div>

      {/* Renderização Condicional: Mostra a tela baseada no botão clicado */}
      {telaAtual === 'dashboard' ? renderDashboard() : renderHistorico()}
      
    </div>
  );
}