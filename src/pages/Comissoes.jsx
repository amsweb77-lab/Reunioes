import React, { useState } from 'react';
import { Plus, Users, Search, MoveRight } from 'lucide-react';
import './Comissoes.css';

export default function Comissoes() {
  const [comissoes] = useState([
    { id: 1, numero: 1, tema: 'Estatística e Finanças', membros: 5 },
    { id: 2, numero: 2, tema: 'Legislação e Justiça', membros: 3 },
    { id: 3, numero: 3, tema: 'Ação Social e Projetos', membros: 4 },
  ]);

  const [membros] = useState([
    { id: 1, nome: 'João Silva', papel: 'Relator', comissao: 1, confed: 'SBA' },
    { id: 2, nome: 'Maria Oliveira', papel: 'Sub-relatora', comissao: 1, confed: 'SUL' },
    { id: 3, nome: 'Carlos Santos', papel: 'Vogal', comissao: 1, confed: 'CNHP' },
  ]);

  return (
    <div className="comissoes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comissões de Trabalho</h1>
          <p className="page-subtitle">Organização e atribuição de participantes para as comissões</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary"><Plus size={18} /> Nova Comissão</button>
        </div>
      </div>

      <div className="comissoes-grid">
        {/* Lista de Comissões */}
        <div className="comissoes-list">
          {comissoes.map(c => (
            <div key={c.id} className={`card comissao-card ${c.id === 1 ? 'active' : ''}`}>
              <div className="c-card-header">
                <div className="c-num">Comissão {c.numero}</div>
                <div className="c-badge"><Users size={14} /> {c.membros} membros</div>
              </div>
              <h3 className="c-tema">{c.tema}</h3>
            </div>
          ))}
        </div>

        {/* Detalhes da Comissão Selecionada */}
        <div className="card comissao-detail">
          <div className="card-header border-bottom">
            <div>
              <h2 className="detail-title">Comissão 1: Estatística e Finanças</h2>
              <p className="text-muted text-sm mt-1">Gerencie os membros e seus papéis nesta comissão</p>
            </div>
          </div>
          
          <div className="card-body">
            <div className="add-membro-box">
              <div className="search-box flex-1">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Buscar participante confirmado..." className="input search-lg" />
              </div>
              <select className="input papel-select">
                <option value="vogal">Vogal</option>
                <option value="relator">Relator</option>
                <option value="subrelator">Sub-relator</option>
              </select>
              <button className="btn btn-primary">Atribuir</button>
            </div>

            <div className="membros-list mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>Confederação</th>
                    <th>Papel</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {membros.map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.nome}</strong></td>
                      <td>{m.confed}</td>
                      <td>
                        <span className={`role-badge ${m.papel.includes('Relator') ? 'primary' : ''}`}>
                          {m.papel}
                        </span>
                      </td>
                      <td>
                        <button className="btn-link text-danger">Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
