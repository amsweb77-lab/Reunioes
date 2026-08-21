import React, { useState } from 'react';
import { Search, FileText, CheckCircle, Clock, AlertCircle, Upload, Minus, Plus } from 'lucide-react';
import { entregasData } from '../data/mockDatabase';
import './Documentos.css';

export default function Documentos() {
  const documentosTipos = [
    { id: 'rel_ativ', nome: 'Relatório de Atividades', type: 'boolean' },
    { id: 'rel_estat', nome: 'Relatório Estatístico', type: 'boolean' },
    { id: 'livro_ata', nome: 'Livro de Atas', type: 'boolean' },
    { id: 'consulta', nome: 'Consultas', type: 'number' },
    { id: 'proposta', nome: 'Propostas', type: 'number' },
    { id: 'hpp', nome: 'Indicação HPP', type: 'number' }
  ];

  const [entregas, setEntregas] = useState(entregasData);

  const toggleDocumento = (confedId, docId) => {
    setEntregas(entregas.map(e => {
      if (e.id === confedId) {
        return { ...e, docs: { ...e.docs, [docId]: !e.docs[docId] } };
      }
      return e;
    }));
  };

  const setQuantidade = (confedId, docId, delta) => {
    setEntregas(entregas.map(e => {
      if (e.id === confedId) {
        const newValue = Math.max(0, (e.docs[docId] || 0) + delta);
        return { ...e, docs: { ...e.docs, [docId]: newValue } };
      }
      return e;
    }));
  };

  const calcProgresso = (docId, type) => {
    const entregues = entregas.filter(e => {
      if (type === 'boolean') return e.docs[docId];
      if (type === 'number') return e.docs[docId] > 0;
      return false;
    }).length;
    return { entregues, total: entregas.length, percent: (entregues / entregas.length) * 100 };
  };

  return (
    <div className="documentos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos Recebidos</h1>
          <p className="page-subtitle">Controle de entrega de relatórios e documentação oficial</p>
        </div>
      </div>

      <div className="docs-overview">
        {documentosTipos.map(tipo => {
          const prog = calcProgresso(tipo.id, tipo.type);
          return (
            <div key={tipo.id} className="doc-stat-card card">
              <div className="d-stat-header">
                <FileText size={20} className="text-primary" />
                <span className="d-stat-title">{tipo.nome}</span>
              </div>
              <div className="d-stat-body">
                <div className="d-stat-numbers">
                  <span className="d-stat-value">{prog.entregues}</span>
                  <span className="d-stat-total">/ {prog.total}</span>
                </div>
                {prog.percent === 100 ? (
                  <span className="badge badge-success">Completo</span>
                ) : (
                  <span className="badge badge-primary">Pendente</span>
                )}
              </div>
              <div className="progress-bar mt-2">
                <div className={`progress-fill ${prog.percent === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${prog.percent}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header checkin-toolbar">
          <div className="search-box" style={{ width: '300px', flex: 'none' }}>
            <Search size={20} className="search-icon" />
            <input type="text" placeholder="Buscar confederação..." className="input search-lg" />
          </div>
          <button className="btn btn-primary"><Upload size={18} /> Upload em Lote</button>
        </div>
        
        <div className="table-container p-0">
          <table className="data-table docs-table">
            <thead>
              <tr>
                <th>Confederação</th>
                {documentosTipos.map(tipo => (
                  <th key={tipo.id} className="text-center">{tipo.nome}</th>
                ))}
                <th>Status Geral</th>
              </tr>
            </thead>
            <tbody>
              {entregas.map(e => {
                const totalEntregue = Object.values(e.docs).filter(val => {
                    if (typeof val === 'boolean') return val;
                    if (typeof val === 'number') return val > 0;
                    return false;
                }).length;
                const pct = (totalEntregue / documentosTipos.length) * 100;
                
                return (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.confederacao}</strong>
                      <div className="text-sm text-muted">{e.regiao}</div>
                    </td>
                    {documentosTipos.map(tipo => (
                      <td key={tipo.id} className="text-center">
                        {tipo.type === 'boolean' ? (
                          <>
                            <button 
                              className={`doc-toggle-btn ${e.docs[tipo.id] ? 'entregue' : ''}`}
                              onClick={() => toggleDocumento(e.id, tipo.id)}
                            >
                              {e.docs[tipo.id] ? <CheckCircle size={24} /> : <div className="empty-box"></div>}
                            </button>
                            {e.docs[tipo.id] && <div className="doc-time">Hoje, 14:30</div>}
                          </>
                        ) : (
                          <div className="quantity-control">
                            <button 
                              className="qty-btn" 
                              onClick={() => setQuantidade(e.id, tipo.id, -1)}
                              disabled={!e.docs[tipo.id]}
                            >
                              <Minus size={14} />
                            </button>
                            <span className={`qty-value ${e.docs[tipo.id] > 0 ? 'has-value' : ''}`}>
                              {e.docs[tipo.id] || 0}
                            </span>
                            <button 
                              className="qty-btn" 
                              onClick={() => setQuantidade(e.id, tipo.id, 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    ))}
                    <td>
                      {pct === 100 ? (
                        <span className="status-pill success"><CheckCircle size={14} /> OK</span>
                      ) : pct === 0 ? (
                        <span className="status-pill danger"><AlertCircle size={14} /> Pendente</span>
                      ) : (
                        <span className="status-pill warning"><Clock size={14} /> Parcial</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
