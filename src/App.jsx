import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BaseCadastral from './pages/BaseCadastral';
import Eventos from './pages/Eventos';
import Participantes from './pages/Participantes';
import Checkin from './pages/Checkin';
import Documentos from './pages/Documentos';
import Comissoes from './pages/Comissoes';
import PainelGeral from './pages/PainelGeral';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="base-cadastral" element={<BaseCadastral />} />
          <Route path="participantes" element={<Participantes />} />
          <Route path="checkin" element={<Checkin />} />
          <Route path="documentos" element={<Documentos />} />
          <Route path="painel-geral" element={<PainelGeral />} />
          <Route path="comissoes" element={<Comissoes />} />
          <Route path="config" element={<div className="page-wrapper"><h2>Configurações (Em breve)</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
