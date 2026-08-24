import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { delegadosData, confederacoesData } from '../data/mockDatabase';

export default function Participantes() {
  const [participantes, setParticipantes] = useState([]);
  const [confederacoes, setConfederacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const { data: delData, error: e1 } = await supabase.from('delegados').select('*').order('nome');
        const { data: confData, error: e2 } = await supabase.from('confederacoes').select('*');

        if (!e1 && !e2 && delData && delData.length > 0) {
          setParticipantes(delData);
          setConfederacoes(confData || []);
        } else {
          setParticipantes(delegadosData);
          setConfederacoes(confederacoesData);
        }
      } catch (err) {
        setParticipantes(delegadosData);
        setConfederacoes(confederacoesData);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredParticipantes = participantes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.confederacao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConfederacaoNome = (sigla) => {
    if (!sigla || sigla === '-') return '-';
    const conf = confederacoes.find(c => c.sigla === sigla);
    return conf ? `${conf.nome} (${sigla})` : sigla;
  };

  return (
    <div className="participantes-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Participantes (Delegados)</h1>
          <p className="page-subtitle">Gerencie os delegados, diretoria e visitantes</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="search-box" style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar participante..." 
                className="input" 
                style={{ width: '100%', paddingLeft: '2.25rem' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline">
                <Filter size={18} /> Filtros
              </button>
              <button className="btn btn-primary">
                <Plus size={18} /> Novo Participante
              </button>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="p-8 text-center text-muted">Carregando delegados...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cargo</th>
                    <th>Tipo</th>
                    <th>Confederação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipantes.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                            <User size={16} />
                          </div>
                          <strong>{p.nome}</strong>
                        </div>
                      </td>
                      <td>{p.cargo}</td>
                      <td>
                        <span className={`badge ${p.tipo === 'CNHP' ? 'badge-primary' : (p.tipo === 'SINODAL' ? 'badge-success' : '')}`}>
                          {p.tipo}
                        </span>
                      </td>
                      <td>{getConfederacaoNome(p.confederacao)}</td>
                      <td>
                        <button className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '500', cursor: 'pointer' }}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
