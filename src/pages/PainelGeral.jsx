import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { confederacoesData, delegadosData, entregasData } from '../data/mockDatabase';
import { supabase } from '../lib/supabase';
import './PainelGeral.css';

export default function PainelGeral() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRegiao, setFiltroRegiao] = useState('');
  const [filtroCSHP, setFiltroCSHP] = useState('');
  const [filtroRepresentante, setFiltroRepresentante] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [ordemCSHP, setOrdemCSHP] = useState('');
  const [ordemRepresentante, setOrdemRepresentante] = useState('');

  const [tableData, setTableData] = useState([]);
  const [diretoriaData, setDiretoriaData] = useState([]);
  const [secretariosData, setSecretariosData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: confeds, error: e1 } = await supabase.from('confederacoes').select('*');
        const { data: delegados, error: e2 } = await supabase.from('delegados').select('*');
        const { data: entregas, error: e3 } = await supabase.from('entregas').select('*');

        if (!e1 && !e2 && !e3 && confeds && confeds.length > 0) {
          console.log('✅ Dados carregados com sucesso do Supabase!', confeds.length);
          const newTableData = confeds.sort((a, b) => a.id - b.id).map((conf, index) => {
            const delegado = delegados.find(d => d.tipo === 'SINODAL' && d.confederacao === conf.sigla);
            const entrega = entregas.find(e => e.confederacao_sigla === conf.sigla);
            return {
              ...conf,
              numero: index + 1,
              delegado: delegado ? { ...delegado } : null,
              docs: entrega ? { ...entrega } : { rel_ativ: 'red', rel_estat: 'red', livro_ata: 'red', consulta: 0, proposta: 0, hpp: 0 }
            };
          });
          setTableData(newTableData);
          setDiretoriaData(delegados.filter(d => d.tipo === 'CNHP' && !d.cargo.startsWith('Sec.')));
          setSecretariosData(delegados.filter(d => d.tipo === 'CNHP' && d.cargo.startsWith('Sec.')));
        } else {
          console.error('⚠️ Falha ao carregar do Supabase. Erros:', {e1, e2, e3});
          loadLocalData();
        }
      } catch (error) {
        console.error('❌ Erro crítico ao conectar ao Supabase:', error);
        loadLocalData();
      }
      setLoading(false);
    }

    function loadLocalData() {
      const saved1 = localStorage.getItem('painelTableData');
      if (saved1) setTableData(JSON.parse(saved1));
      else {
        const mockTable = confederacoesData.map((conf, index) => {
          const delegado = delegadosData.find(d => d.tipo === 'SINODAL' && d.confederacao === conf.sigla);
          const entrega = entregasData.find(e => e.confederacao === conf.sigla);
          return {
            ...conf, numero: index + 1,
            delegado: delegado ? { ...delegado } : null,
            docs: entrega ? { ...entrega.docs } : { rel_ativ: false, rel_estat: false, livro_ata: false, consulta: 0, proposta: 0, hpp: 0 }
          };
        });
        setTableData(mockTable);
      }
      
      const saved2 = localStorage.getItem('painelDiretoriaData');
      if (saved2) setDiretoriaData(JSON.parse(saved2));
      else setDiretoriaData(delegadosData.filter(d => d.tipo === 'CNHP' && !d.cargo.startsWith('Sec.')));

      const saved3 = localStorage.getItem('painelSecretariosData');
      if (saved3) setSecretariosData(JSON.parse(saved3));
      else setSecretariosData(delegadosData.filter(d => d.tipo === 'CNHP' && d.cargo.startsWith('Sec.')));
    }

    loadData();
  }, []);

  useEffect(() => {
    if (tableData.length > 0) localStorage.setItem('painelTableData', JSON.stringify(tableData));
  }, [tableData]);

  useEffect(() => {
    if (diretoriaData.length > 0) localStorage.setItem('painelDiretoriaData', JSON.stringify(diretoriaData));
  }, [diretoriaData]);

  useEffect(() => {
    if (secretariosData.length > 0) localStorage.setItem('painelSecretariosData', JSON.stringify(secretariosData));
  }, [secretariosData]);

  const handleDelegadoChange = async (id, field, value) => {
    let rowIdForDb = null;
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        const currentDelegado = row.delegado || { nome: '', cargo: '', confirmou: false, presente: false };
        if (currentDelegado.id) rowIdForDb = currentDelegado.id;
        return { ...row, delegado: { ...currentDelegado, [field]: value } };
      }
      return row;
    }));
    if (rowIdForDb) {
      await supabase.from('delegados').update({ [field]: value }).eq('id', rowIdForDb);
    }
  };

  const handleDocChange = async (id, field, value) => {
    let rowIdForDb = null;
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        if (row.docs && row.docs.id) rowIdForDb = row.docs.id;
        return { ...row, docs: { ...row.docs, [field]: value } };
      }
      return row;
    }));
    if (rowIdForDb) {
      await supabase.from('entregas').update({ [field]: value }).eq('id', rowIdForDb);
    }
  };

  const handleNumberChange = (id, field, value) => {
    // Permite que o campo fique vazio (string vazia) ou converte para número >= 0
    const numValue = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    handleDocChange(id, field, numValue);
  };

  const handleExtraChange = async (setter, id, field, value) => {
    setter(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
    await supabase.from('delegados').update({ [field]: value }).eq('id', id);
  };

  const handleExtraRelAtivCycle = async (setter, id) => {
    let nextVal = null;
    setter(prev => prev.map(row => {
      if (row.id === id) {
        const current = row.rel_ativ_status || 'red';
        const next = current === 'red' ? 'green' : (current === 'green' ? 'orange' : (current === 'orange' ? 'white' : 'red'));
        nextVal = next;
        return { ...row, rel_ativ_status: next };
      }
      return row;
    }));
    if (nextVal) {
      await supabase.from('delegados').update({ rel_ativ_status: nextVal }).eq('id', id);
    }
  };

  const handleMainDocCycle = async (id, field) => {
    let nextValue = false;
    let rowIdForDb = null;
    
    setTableData(prev => prev.map(row => {
      if (row.id === id) {
        let current = row.docs[field];
        if (!current || current === 'red') nextValue = 'green';
        else if (current === true || current === 'green') nextValue = 'orange';
        else if (current === 'orange') nextValue = 'white';
        else nextValue = 'red';
        
        if (row.docs && row.docs.id) rowIdForDb = row.docs.id;
        return { ...row, docs: { ...row.docs, [field]: nextValue } };
      }
      return row;
    }));
    
    if (rowIdForDb) {
      await supabase.from('entregas').update({ [field]: nextValue }).eq('id', rowIdForDb);
    }
  };

  const filteredData = tableData.filter(d => {
    // Só mostra as confederações ativas
    if (!d.ativa) return false;

    const nomeDel = d.delegado?.nome || '';
    const matchGlobal = d.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        d.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.regiao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        nomeDel.toLowerCase().includes(searchTerm.toLowerCase());
                        
    const matchRegiao = filtroRegiao ? d.regiao === filtroRegiao : true;
    
    const dCshp = `${d.nome} (${d.sigla})`;
    const matchCSHP = filtroCSHP ? dCshp === filtroCSHP : true;
    
    const dRepresentante = d.delegado?.nome || '';
    const matchRepresentante = filtroRepresentante ? dRepresentante === filtroRepresentante : true;
    
    const dCargo = d.delegado?.cargo || '';
    const matchCargo = filtroCargo ? dCargo === filtroCargo : true;
    
    return matchGlobal && matchRegiao && matchCSHP && matchRepresentante && matchCargo;
  });

  if (ordemCSHP) {
    filteredData.sort((a, b) => {
      const vA = `${a.nome} (${a.sigla})`.toLowerCase();
      const vB = `${b.nome} (${b.sigla})`.toLowerCase();
      if (vA < vB) return ordemCSHP === 'asc' ? -1 : 1;
      if (vA > vB) return ordemCSHP === 'asc' ? 1 : -1;
      return 0;
    });
  } else if (ordemRepresentante) {
    filteredData.sort((a, b) => {
      const vA = (a.delegado?.nome || '').toLowerCase();
      const vB = (b.delegado?.nome || '').toLowerCase();
      if (vA < vB) return ordemRepresentante === 'asc' ? -1 : 1;
      if (vA > vB) return ordemRepresentante === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const regioesUnicas = Array.from(new Set(tableData.map(d => d.regiao))).sort();
  const cshpsUnicas = Array.from(new Set(tableData.map(d => `${d.nome} (${d.sigla})`))).sort();
  const representantesUnicos = Array.from(new Set(tableData.map(d => d.delegado?.nome || '').filter(n => n))).sort();

  const getDocCellClass = (isDelivered, docType) => {
    if (isDelivered === 'white') return 'cell-white text-center font-bold';
    if (isDelivered === 'orange') return 'cell-reenvio text-center font-bold';
    
    if (isDelivered === true || isDelivered === 'green') {
      if (docType === 'rel_ativ') return 'cell-delivered-ativ text-center font-bold';
      if (docType === 'rel_estat') return 'cell-delivered-estat text-center font-bold';
      if (docType === 'livro_ata') return 'cell-delivered-ata text-center font-bold';
      return 'cell-green text-center font-bold';
    }
    return 'cell-red text-center';
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando dados da nuvem...</div>;
  }

  return (
    <div className="painel-geral-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel Geral</h1>
        </div>
      </div>

      <div className="card">
        <div className="card-header checkin-toolbar">
          <div className="search-box" style={{ width: '400px', flex: 'none' }}>
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="input search-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container p-0 table-scroll">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th className="sticky-col header-cell">Nº</th>
                <th className="sticky-col header-cell">
                  <div>REGIÃO</div>
                  <select 
                    value={filtroRegiao} 
                    onChange={e => setFiltroRegiao(e.target.value)}
                    style={{ width: '100%', fontSize: '9px', fontWeight: 'normal', padding: '1px', marginTop: '2px', border: '1px solid #aaa' }}
                  >
                    <option value="">Todas</option>
                    {regioesUnicas.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </th>
                <th className="sticky-col header-cell">
                  <div>Confederação Sinodal (CSHP)</div>
                  <select 
                    value={filtroCSHP || (ordemCSHP ? `SORT_${ordemCSHP.toUpperCase()}` : '')} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'SORT_ASC') { setOrdemCSHP('asc'); setOrdemRepresentante(''); setFiltroCSHP(''); }
                      else if (val === 'SORT_DESC') { setOrdemCSHP('desc'); setOrdemRepresentante(''); setFiltroCSHP(''); }
                      else if (val === '') { setOrdemCSHP(''); setFiltroCSHP(''); }
                      else { setFiltroCSHP(val); }
                    }}
                    style={{ width: '100%', fontSize: '9px', fontWeight: 'normal', padding: '1px', marginTop: '2px', border: '1px solid #aaa' }}
                  >
                    <option value="">Nenhuma ordenação</option>
                    <optgroup label="Ordenar">
                      <option value="SORT_ASC">⬆ Crescente (A-Z)</option>
                      <option value="SORT_DESC">⬇ Decrescente (Z-A)</option>
                    </optgroup>
                  </select>
                </th>
                <th className="header-cell">
                  <div>REPRESENTANTE</div>
                  <select 
                    value={filtroRepresentante || (ordemRepresentante ? `SORT_${ordemRepresentante.toUpperCase()}` : '')} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'SORT_ASC') { setOrdemRepresentante('asc'); setOrdemCSHP(''); setFiltroRepresentante(''); }
                      else if (val === 'SORT_DESC') { setOrdemRepresentante('desc'); setOrdemCSHP(''); setFiltroRepresentante(''); }
                      else if (val === '') { setOrdemRepresentante(''); setFiltroRepresentante(''); }
                      else { setFiltroRepresentante(val); }
                    }}
                    style={{ width: '100%', fontSize: '9px', fontWeight: 'normal', padding: '1px', marginTop: '2px', border: '1px solid #aaa' }}
                  >
                    <option value="">Nenhuma ordenação</option>
                    <optgroup label="Ordenar">
                      <option value="SORT_ASC">⬆ Crescente (A-Z)</option>
                      <option value="SORT_DESC">⬇ Decrescente (Z-A)</option>
                    </optgroup>
                  </select>
                </th>
                <th className="header-cell">
                  <div>CARGO</div>
                  <select 
                    value={filtroCargo} 
                    onChange={e => setFiltroCargo(e.target.value)}
                    style={{ width: '100%', fontSize: '9px', fontWeight: 'normal', padding: '1px', marginTop: '2px', border: '1px solid #aaa' }}
                  >
                    <option value="">Todos</option>
                    <option value="Presidente">Presidente</option>
                    <option value="vice-Presidente">vice-Presidente</option>
                    <option value="Sec. Executivo">Sec. Executivo</option>
                    <option value="1º Secretário">1º Secretário</option>
                    <option value="2º Secretário">2º Secretário</option>
                    <option value="Tesoureiro">Tesoureiro</option>
                  </select>
                </th>
                <th className="header-cell text-center">INSCRITO</th>
                <th className="header-cell text-center">PRESENÇA</th>
                <th className="header-cell text-center">RELATÓRIO DE<br/>ATIVIDADES</th>
                <th className="header-cell text-center">RELATÓRIO DE<br/>ESTATÍSTICA</th>
                <th className="header-cell text-center">LIVRO DE ATAS</th>
                <th className="header-cell text-center">CONSULTAS</th>
                <th className="header-cell text-center">PROPOSTAS</th>
                <th className="header-cell text-center">HPP</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(row => {
                const cshpFormat = `${row.nome} (${row.sigla})`;
                // Presenca logic (could be checkbox or text)
                const presencaText = row.delegado && row.delegado.presente ? 'Sim' : '';
                
                return (
                  <tr key={row.id} className={!row.ativa ? 'inactive-row' : ''}>
                    <td className="sticky-col text-center bg-gray-light border-r">{row.numero}</td>
                    <td className="sticky-col border-r">{row.regiao}</td>
                    <td className="sticky-col border-r">{cshpFormat}</td>
                    
                    <td className="border-r" style={{ padding: 0 }}>
                      <input 
                        type="text" 
                        className="input-qty" 
                        style={{ textAlign: 'left', padding: '0 8px', width: '100%' }}
                        value={row.delegado ? row.delegado.nome : ''} 
                        onChange={(e) => handleDelegadoChange(row.id, 'nome', e.target.value)}
                        disabled={!row.ativa}
                        placeholder={row.ativa ? "Nome do representante" : ""}
                      />
                    </td>
                    <td className="border-r" style={{ padding: 0 }}>
                      <select 
                        className="input-qty"
                        style={{ textAlign: 'left', padding: '0 8px', fontWeight: 'normal', width: '100%', appearance: 'auto' }}
                        value={row.delegado ? row.delegado.cargo : ''}
                        onChange={(e) => handleDelegadoChange(row.id, 'cargo', e.target.value)}
                        disabled={!row.ativa}
                      >
                        <option value="">Selecione...</option>
                        <option value="Presidente">Presidente</option>
                        <option value="vice-Presidente">vice-Presidente</option>
                        <option value="Sec. Executivo">Sec. Executivo</option>
                        <option value="1º Secretário">1º Secretário</option>
                        <option value="2º Secretário">2º Secretário</option>
                        <option value="Tesoureiro">Tesoureiro</option>
                      </select>
                    </td>
                    
                    <td className="text-center border-r font-bold">
                      {row.delegado ? (
                        <select 
                          className={`select-status ${row.delegado.confirmou ? 'text-green-dark' : 'text-danger'}`}
                          value={row.delegado.confirmou ? 'Sim' : 'Não'}
                          onChange={(e) => handleDelegadoChange(row.id, 'confirmou', e.target.value === 'Sim')}
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      ) : ''}
                    </td>

                    <td className="text-center border-r font-bold">
                      {row.delegado ? (
                        <select 
                          className={`select-status ${row.delegado.presente ? 'text-green-dark' : 'text-danger'}`}
                          value={row.delegado.presente ? 'Sim' : 'Não'}
                          onChange={(e) => handleDelegadoChange(row.id, 'presente', e.target.value === 'Sim')}
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      ) : ''}
                    </td>

                    <td 
                      className={!row.ativa ? 'border-r' : getDocCellClass(row.docs.rel_ativ, 'rel_ativ')}
                      onClick={() => row.ativa && handleMainDocCycle(row.id, 'rel_ativ')}
                      style={{ cursor: row.ativa ? 'pointer' : 'default' }}
                      title={row.ativa ? "Clique para alternar: Não entregue -> Entregue -> Reenvio -> Não precisa" : ""}
                    >
                      {row.ativa && (row.docs.rel_ativ === true || row.docs.rel_ativ === 'green') ? '1' : ''}
                    </td>
                    <td 
                      className={!row.ativa ? 'border-r' : getDocCellClass(row.docs.rel_estat, 'rel_estat')}
                      onClick={() => row.ativa && handleMainDocCycle(row.id, 'rel_estat')}
                      style={{ cursor: row.ativa ? 'pointer' : 'default' }}
                      title={row.ativa ? "Clique para alternar: Não entregue -> Entregue -> Reenvio -> Não precisa" : ""}
                    >
                      {row.ativa && (row.docs.rel_estat === true || row.docs.rel_estat === 'green') ? '1' : ''}
                    </td>
                    <td 
                      className={!row.ativa ? 'border-r' : getDocCellClass(row.docs.livro_ata, 'livro_ata')}
                      onClick={() => row.ativa && handleMainDocCycle(row.id, 'livro_ata')}
                      style={{ cursor: row.ativa ? 'pointer' : 'default' }}
                      title={row.ativa ? "Clique para alternar: Não entregue -> Entregue -> Reenvio -> Não precisa" : ""}
                    >
                      {row.ativa && (row.docs.livro_ata === true || row.docs.livro_ata === 'green') ? '1' : ''}
                    </td>
                    <td className="text-center border-r cell-blueish" style={{ padding: 0 }}>
                      {row.ativa ? (
                        <input 
                          type="number"
                          min="0"
                          className="input-qty"
                          value={row.docs.consulta || ''}
                          onChange={(e) => handleNumberChange(row.id, 'consulta', e.target.value)}
                        />
                      ) : ''}
                    </td>
                    <td className="text-center border-r cell-blueish" style={{ padding: 0 }}>
                      {row.ativa ? (
                        <input 
                          type="number"
                          min="0"
                          className="input-qty"
                          value={row.docs.proposta || ''}
                          onChange={(e) => handleNumberChange(row.id, 'proposta', e.target.value)}
                        />
                      ) : ''}
                    </td>
                    <td className="text-center border-r cell-blueish" style={{ padding: 0 }}>
                      {row.ativa ? (
                        <input 
                          type="number"
                          min="0"
                          className="input-qty"
                          value={row.docs.hpp || ''}
                          onChange={(e) => handleNumberChange(row.id, 'hpp', e.target.value)}
                        />
                      ) : ''}
                    </td>
                  </tr>
                );
              })}

              {/* SECTION: DIRETORIA */}
              {diretoriaData.length > 0 && (
                <>
                  <tr>
                    <td colSpan="3" className="sticky-col bg-gray-light border-r"></td>
                    <td colSpan="10" className="header-cell text-center font-bold">DIRETORIA</td>
                  </tr>
                  {diretoriaData.map((row, index) => (
                    <tr key={row.id}>
                      <td className="sticky-col text-center border-r">{index + 1}</td>
                      <td className="sticky-col border-r"></td>
                      <td className="sticky-col border-r"></td>
                      <td className="border-r">{row.nome}</td>
                      <td className="border-r">{row.cargo}</td>
                      <td className="text-center border-r font-bold">
                        <select 
                          className={`select-status ${row.confirmou ? 'text-green-dark' : 'text-danger'}`}
                          value={row.confirmou ? 'Sim' : 'Não'}
                          onChange={(e) => handleExtraChange(setDiretoriaData, row.id, 'confirmou', e.target.value === 'Sim')}
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </td>
                      <td className="text-center border-r font-bold">
                        <select 
                          className={`select-status ${row.presente ? 'text-green-dark' : 'text-danger'}`}
                          value={row.presente ? 'Sim' : 'Não'}
                          onChange={(e) => handleExtraChange(setDiretoriaData, row.id, 'presente', e.target.value === 'Sim')}
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </td>
                      <td 
                        className={`text-center border-r cell-${row.rel_ativ_status || 'red'} font-bold cursor-pointer`}
                        onClick={() => handleExtraRelAtivCycle(setDiretoriaData, row.id)}
                        title="Clique para alternar: Não entregue -> Entregue -> Reenvio -> Não precisa"
                      >
                        {row.rel_ativ_status === 'green' ? '1' : ''}
                      </td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                    </tr>
                  ))}
                </>
              )}

              {/* SECTION: SECRETÁRIOS DE ATIVIDADES */}
              {secretariosData.length > 0 && (
                <>
                  <tr>
                    <td colSpan="3" className="sticky-col bg-gray-light border-r"></td>
                    <td colSpan="10" className="header-cell text-center font-bold">SECRETÁRIOS DE ATIVIDADES</td>
                  </tr>
                  {secretariosData.map((row, index) => (
                    <tr key={row.id}>
                      <td className="sticky-col text-center border-r">{index + 1}</td>
                      <td className="sticky-col border-r"></td>
                      <td className="sticky-col border-r"></td>
                      <td className="border-r">{row.nome}</td>
                      <td className="border-r">{row.cargo}</td>
                      <td className="text-center border-r font-bold">
                        <select 
                          className={`select-status ${row.confirmou ? 'text-green-dark' : 'text-danger'}`}
                          value={row.confirmou ? 'Sim' : 'Não'}
                          onChange={(e) => handleExtraChange(setSecretariosData, row.id, 'confirmou', e.target.value === 'Sim')}
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </td>
                      <td className="text-center border-r font-bold">
                        <select 
                          className={`select-status ${row.presente ? 'text-green-dark' : 'text-danger'}`}
                          value={row.presente ? 'Sim' : 'Não'}
                          onChange={(e) => handleExtraChange(setSecretariosData, row.id, 'presente', e.target.value === 'Sim')}
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </td>
                      <td 
                        className={`text-center border-r cell-${row.rel_ativ_status || 'red'} font-bold cursor-pointer`}
                        onClick={() => handleExtraRelAtivCycle(setSecretariosData, row.id)}
                        title="Clique para alternar: Não entregue -> Entregue -> Reenvio -> Não precisa"
                      >
                        {row.rel_ativ_status === 'green' ? '1' : ''}
                      </td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                      <td className="border-r"></td>
                    </tr>
                  ))}
                </>
              )}

              {/* SECTION: RELATORES */}
              <tr className="section-header-row" style={{ backgroundColor: '#e0e0e0', borderTop: '2px solid #ccc', borderBottom: '2px solid #ccc' }}>
                <td colSpan={13} className="font-bold text-center" style={{ padding: '8px', fontSize: '13px', textTransform: 'uppercase' }}>
                  RELATORES XVI CONGRESSO
                </td>
              </tr>
              {[
                { n: 1, nome: 'Abilio dos Santos Filho', cargo: 'Diplomacia' },
                { n: 2, nome: 'Weslley Souza do Nascimento', cargo: 'Estatística' },
                { n: 3, nome: 'Josafá', cargo: 'Estatística' },
                { n: 4, nome: 'Magno Fonseca de Holanda', cargo: 'Tesouraria' }
              ].map((rel, i) => (
                <tr key={`relator-${i}`} className="spreadsheet-row hoverable">
                  <td className="border-r" style={{ backgroundColor: i % 2 === 0 ? '#e6f4ea' : 'transparent' }}></td>
                  <td className="border-r" style={{ backgroundColor: i % 2 === 0 ? '#e6f4ea' : 'transparent' }}></td>
                  <td className="text-right border-r font-bold" style={{ backgroundColor: i % 2 === 0 ? '#e6f4ea' : 'transparent', paddingRight: '8px' }}>
                    {rel.n}
                  </td>
                  <td className="border-r px-2">{rel.nome}</td>
                  <td className="border-r px-2">{rel.cargo}</td>
                  <td className="text-center border-r px-2">sim</td>
                  <td className="border-r" style={{ backgroundColor: i % 2 === 0 ? '#e6f4ea' : 'transparent' }}></td>
                  <td className="border-r"></td>
                  <td className="border-r"></td>
                  <td className="border-r"></td>
                  <td className="border-r"></td>
                  <td className="border-r"></td>
                  <td className="border-r"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
