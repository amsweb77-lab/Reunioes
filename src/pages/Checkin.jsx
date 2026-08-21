import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Users, AlertTriangle } from 'lucide-react';
import { delegadosData } from '../data/mockDatabase';
import './Checkin.css';

export default function Checkin() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [participantes, setParticipantes] = useState(delegadosData);

  const stats = {
    esperados: participantes.length,
    confirmados: participantes.filter(p => p.confirmou).length,
    presentes: participantes.filter(p => p.presente).length,
    quorum: Math.ceil(participantes.filter(p => p.tipo !== 'VISITANTE').length * (2/3))
  };

  const togglePresenca = (id) => {
    setParticipantes(participantes.map(p => 
      p.id === id ? { ...p, presente: !p.presente } : p
    ));
  };

  const filteredParticipantes = participantes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.confederacao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="checkin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Check-in de Presença</h1>
          <p className="page-subtitle">Controle de acesso e quórum para: Reunião CE - 2026</p>
        </div>
      </div>

      <div className="quorum-panel">
        <div className="quorum-stat">
          <div className="q-label">Ativos Esperados</div>
          <div className="q-value">{stats.esperados}</div>
        </div>
        <div className="quorum-divider"></div>
        <div className="quorum-stat">
          <div className="q-label">Confirmados</div>
          <div className="q-value text-primary">{stats.confirmados}</div>
        </div>
        <div className="quorum-divider"></div>
        <div className="quorum-stat">
          <div className="q-label">Presentes no Check-in</div>
          <div className="q-value text-success">{stats.presentes}</div>
        </div>
        <div className="quorum-divider"></div>
        <div className="quorum-stat quorum-status">
          <div className="q-label">Status do Quórum ({stats.quorum} necessários)</div>
          {stats.presentes >= stats.quorum ? (
            <div className="q-badge success"><CheckCircle size={18} /> Quórum Atingido</div>
          ) : (
            <div className="q-badge warning"><AlertTriangle size={18} /> Quórum Pendente</div>
          )}
          <div className="progress-bar mt-2">
            <div 
              className={`progress-fill ${stats.presentes >= stats.quorum ? 'bg-success' : 'bg-warning'}`} 
              style={{ width: `${Math.min((stats.presentes / stats.quorum) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="card checkin-card">
        <div className="card-header checkin-toolbar">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou sigla (ex: SBA)..." 
              className="input search-lg" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="filter-group">
            <select className="input">
              <option value="">Todas as Regiões</option>
              <option value="Norte I">Norte I</option>
              <option value="Nordeste">Nordeste</option>
              <option value="Sul">Sul</option>
            </select>
          </div>
        </div>
        
        <div className="card-body p-0">
          <div className="checkin-list">
            {filteredParticipantes.map(p => (
              <div key={p.id} className={`checkin-row ${p.presente ? 'is-present' : ''}`} onClick={() => togglePresenca(p.id)}>
                <div className="c-info">
                  <div className="c-avatar">
                    {p.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="c-name">{p.nome}</div>
                    <div className="c-meta">
                      <span className="c-badge">{p.confederacao}</span> • {p.cargo} • {p.regiao}
                    </div>
                  </div>
                </div>
                <div className="c-status">
                  {!p.confirmou && !p.presente && <span className="status-badge error">Não Confirmado</span>}
                  {p.confirmou && !p.presente && <span className="status-badge warning">Ausente</span>}
                  
                  <button className={`btn-checkin ${p.presente ? 'active' : ''}`}>
                    {p.presente ? <CheckCircle size={24} /> : <div className="empty-circle"></div>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
