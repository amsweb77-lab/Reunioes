import React, { useState } from 'react';
import { Search, Plus, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { confederacoesData, regioesData } from '../data/mockDatabase';
import './BaseCadastral.css';

export default function BaseCadastral() {
  const [activeTab, setActiveTab] = useState('confederacoes');

  const [confederacoes] = useState(confederacoesData);
  const [regioes] = useState(regioesData);

  return (
    <div className="base-cadastral">
      <div className="page-header">
        <div>
          <h1 className="page-title">Base Cadastral</h1>
          <p className="page-subtitle">Gerencie as regiões e confederações sinodais</p>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'confederacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('confederacoes')}
          >
            Confederações Sinodais
          </button>
          <button 
            className={`tab-btn ${activeTab === 'regioes' ? 'active' : ''}`}
            onClick={() => setActiveTab('regioes')}
          >
            Regiões
          </button>
        </div>

        <div className="card-body">
          <div className="toolbar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder={`Buscar ${activeTab}...`} className="input" />
            </div>
            <button className="btn btn-primary">
              <Plus size={18} />
              Nova {activeTab === 'confederacoes' ? 'Confederação' : 'Região'}
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              {activeTab === 'confederacoes' ? (
                <>
                  <thead>
                    <tr>
                      <th>Sigla</th>
                      <th>Nome da Confederação</th>
                      <th>Região</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confederacoes.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.sigla}</strong></td>
                        <td>{c.nome}</td>
                        <td>
                          <div className="region-badge">
                            <MapPin size={14} />
                            {c.regiao}
                          </div>
                        </td>
                        <td>
                          {c.ativa ? (
                            <span className="status-pill success"><CheckCircle size={14} /> Ativa</span>
                          ) : (
                            <span className="status-pill inactive"><XCircle size={14} /> Inativa</span>
                          )}
                        </td>
                        <td>
                          <button className="btn-link">Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th>Nome da Região</th>
                      <th>Qtd. Confederações</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regioes.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.nome}</strong></td>
                        <td>{r.confeds} confederações</td>
                        <td>
                          <button className="btn-link">Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
