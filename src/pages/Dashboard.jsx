import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, FileText, CheckCircle, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { confederacoesData, delegadosData, entregasData, regioesData } from '../data/mockDatabase';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: confeds, error: e1 } = await supabase.from('confederacoes').select('*');
        const { data: delegados, error: e2 } = await supabase.from('delegados').select('*');
        const { data: entregas, error: e3 } = await supabase.from('entregas').select('*');
        const { data: regioesDb, error: e4 } = await supabase.from('regioes').select('*');

        if (!e1 && !e2 && !e3 && confeds && confeds.length > 0) {
          setDbData({ confeds, delegados, entregas, regioesDb: regioesDb || [] });
          setLoading(false);
          return;
        }
      } catch (err) {
        // Silently catch supabase errors
      }

      // FALLBACK LOCAL: Traduz os dados do localStorage/mock para o novo formato relacional
      const storedTable = JSON.parse(localStorage.getItem('painelTableData'));
      const storedDiretoria = JSON.parse(localStorage.getItem('painelDiretoriaData'));
      const storedSecretarios = JSON.parse(localStorage.getItem('painelSecretariosData'));

      let fbConfeds = confederacoesData;
      let fbDelegados = delegadosData;
      let fbEntregas = entregasData.map(e => ({ ...e, confederacao_sigla: e.confederacao }));

      if (storedTable) {
        fbConfeds = storedTable.map(c => ({
          id: c.id, regiao: c.regiao, nome: c.nome, sigla: c.sigla, ativa: c.ativa
        }));
        
        const tableDelegados = storedTable.filter(c => c.delegado).map(c => c.delegado);
        fbDelegados = [
          ...tableDelegados,
          ...(storedDiretoria || delegadosData.filter(d => d.tipo === 'CNHP' && !d.cargo.startsWith('Sec.'))),
          ...(storedSecretarios || delegadosData.filter(d => d.tipo === 'CNHP' && d.cargo.startsWith('Sec.')))
        ];
        
        fbEntregas = storedTable.map(c => ({
          id: c.id,
          confederacao_sigla: c.sigla,
          rel_ativ: c.docs.rel_ativ,
          rel_estat: c.docs.rel_estat,
          livro_ata: c.docs.livro_ata,
          consulta: c.docs.consulta,
          proposta: c.docs.proposta,
          hpp: c.docs.hpp
        }));
      }

      setDbData({ confeds: fbConfeds, delegados: fbDelegados, entregas: fbEntregas, regioesDb: regioesData });
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando dados...</div>;
  }

  if (!dbData) {
    return <div className="p-8 text-center text-danger font-bold">Erro ao carregar dados.</div>;
  }

  const { confeds, delegados, entregas, regioesDb } = dbData;

  // --- PANORAMA GERAL ---
  const confedAtivas = confeds.filter(c => c.ativa).length; 
  const totalDiretoria = delegados.filter(d => d.tipo === 'CNHP' && !d.cargo.startsWith('Sec.')).length;
  const totalSecretarios = 0; // Forçado a 0 pois não participam desta reunião
  
  const totalMembrosCE = confedAtivas + totalDiretoria + totalSecretarios;
  const quorum = Math.round(totalMembrosCE / 2) + 1;
  
  const confedsConfirmados = delegados.filter(d => d.tipo === 'SINODAL' && d.confirmou).length;
  const diretoriaConfirmados = delegados.filter(d => d.tipo === 'CNHP' && !d.cargo.startsWith('Sec.') && d.confirmou).length;
  const secretariosConfirmados = 0; // Forçado a 0 pois não participam desta reunião

  const totalPresencasConfirmadas = confedsConfirmados + diretoriaConfirmados + secretariosConfirmados;

  // --- CONTROLE DE PRESENÇA ---
  const presentesDiretoria = delegados.filter(d => d.tipo === 'CNHP' && !d.cargo.startsWith('Sec.') && d.presente).length;
  const presentesSecretarios = 0; // Forçado a 0 pois não participam desta reunião
  const presentesSinodais = delegados.filter(d => d.tipo === 'SINODAL' && d.presente).length;
  const totalPresentes = presentesDiretoria + presentesSecretarios + presentesSinodais;

  // --- PRESENÇA POR REGIÃO ---
  const regioesNomes = regioesDb.length > 0 ? regioesDb.map(r => r.nome) : ['Centro-Oeste', 'Nordeste', 'Norte I', 'Norte II', 'Sudeste I', 'Sudeste II', 'Sul'];
  const presencaPorRegiao = regioesNomes.map(regiao => {
    const totalRegiao = confeds.filter(c => c.ativa && c.regiao === regiao).length;
    const inscritosRegiao = delegados.filter(d => d.tipo === 'SINODAL' && d.regiao === regiao && d.confirmou).length;
    const presentesRegiao = delegados.filter(d => d.tipo === 'SINODAL' && d.regiao === regiao && d.presente).length;
      
    return {
      name: regiao,
      Inscritos: inscritosRegiao,
      Presentes: presentesRegiao,
      Total: totalRegiao
    };
  });

  // --- DOCUMENTOS RECEBIDOS ---
  const countDocs = (field) => {
    let entregue = 0, reenvio = 0, naoEntregue = 0, naoPrecisa = 0;
    entregas.forEach(e => {
      const confed = confeds.find(c => c.sigla === e.confederacao_sigla && c.ativa);
      if (confed) {
        if (e[field] === true || e[field] === 'green') entregue++;
        else if (e[field] === 'orange') reenvio++;
        else if (e[field] === 'white') naoPrecisa++;
        else naoEntregue++; // red, false, null, undefined
      }
    });
    return { entregue, reenvio, naoEntregue, naoPrecisa, total: confedAtivas };
  };

  const ativ = countDocs('rel_ativ');
  const estat = countDocs('rel_estat');
  const atas = countDocs('livro_ata');
  
  const consultas = entregas.reduce((acc, curr) => acc + (curr.consulta || 0), 0);
  const propostas = entregas.reduce((acc, curr) => acc + (curr.proposta || 0), 0);
  const indHpp = entregas.reduce((acc, curr) => acc + (curr.hpp || 0), 0);

  const docChartData = [
    { name: 'Atividades', value: ativ.entregue },
    { name: 'Estatística', value: estat.entregue },
    { name: 'Livro de Atas', value: atas.entregue },
    { name: 'Consultas', value: consultas },
    { name: 'Propostas', value: propostas },
    { name: 'HPP', value: indHpp }
  ];

  const COLORS = ['#0b57d0', '#f6b26b', '#6aa84f', '#e06666', '#8e7cc3', '#3d85c6'];

  const Badge = ({ val, type }) => {
    if (val === 0 && type !== 'total') return <span style={{ color: '#dadce0' }}>-</span>;
    
    let bg = '#f1f3f4', color = '#5f6368', fw = '500';
    if (type === 'green') { bg = '#e6f4ea'; color = '#137333'; fw = 'bold'; }
    else if (type === 'red') { bg = '#fce8e6'; color = '#c5221f'; fw = 'bold'; }
    else if (type === 'orange') { bg = '#fef7e0'; color = '#b06000'; fw = 'bold'; }
    else if (type === 'white') { bg = '#f1f3f4'; color = '#5f6368'; fw = 'bold'; }
    else if (type === 'total') { bg = '#e8eaed'; color = '#202124'; fw = 'bold'; }
    
    return (
      <span style={{ backgroundColor: bg, padding: '4px 10px', borderRadius: '12px', color: color, fontWeight: fw }}>
        {val}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Analítico</h1>
          <p className="page-subtitle">Acompanhamento em tempo real do Quórum e Entregas</p>
        </div>
      </div>

            <div className="dashboard-stack" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* PANORAMA */}
        <div className="card">
            <div className="card-header bg-gray-light font-bold">PANORAMA</div>
            <div className="overflow-x-auto" style={{ padding: '0.5rem' }}>
              <table className="w-full" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0', color: '#5f6368', textAlign: 'center', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Categoria</th>
                    <th style={{ padding: '12px 8px', fontWeight: '600' }}>Total</th>
                    <th style={{ padding: '12px 8px', fontWeight: '600' }}>Inscritos</th>
                    <th style={{ padding: '12px 8px', fontWeight: '600' }}>Presentes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043' }}>Confederações Sinodais</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#f1f3f4', padding: '4px 10px', borderRadius: '12px', color: '#5f6368', fontWeight: '500' }}>{confedAtivas}</span></td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#e8f0fe', padding: '4px 10px', borderRadius: '12px', color: '#1967d2', fontWeight: 'bold' }}>{confedsConfirmados}</span></td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#e6f4ea', padding: '4px 10px', borderRadius: '12px', color: '#137333', fontWeight: 'bold' }}>{presentesSinodais}</span></td>
                  </tr>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043' }}>Diretoria</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#f1f3f4', padding: '4px 10px', borderRadius: '12px', color: '#5f6368', fontWeight: '500' }}>{totalDiretoria}</span></td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#e8f0fe', padding: '4px 10px', borderRadius: '12px', color: '#1967d2', fontWeight: 'bold' }}>{diretoriaConfirmados}</span></td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#e6f4ea', padding: '4px 10px', borderRadius: '12px', color: '#137333', fontWeight: 'bold' }}>{presentesDiretoria}</span></td>
                  </tr>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043' }}>Secretários de Ativ.</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#f1f3f4', padding: '4px 10px', borderRadius: '12px', color: '#5f6368', fontWeight: '500' }}>{totalSecretarios}</span></td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#e8f0fe', padding: '4px 10px', borderRadius: '12px', color: '#1967d2', fontWeight: 'bold' }}>{secretariosConfirmados}</span></td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#e6f4ea', padding: '4px 10px', borderRadius: '12px', color: '#137333', fontWeight: 'bold' }}>{presentesSecretarios}</span></td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #dadce0', backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#202124' }}>TOTAL</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#e8eaed', padding: '4px 12px', borderRadius: '16px', color: '#202124', fontWeight: 'bold' }}>{totalMembrosCE}</span></td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#d2e3fc', padding: '4px 12px', borderRadius: '16px', color: '#174ea6', fontWeight: 'bold' }}>{totalPresencasConfirmadas}</span></td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={{ backgroundColor: '#ceead6', padding: '4px 12px', borderRadius: '16px', color: '#0d652d', fontWeight: 'bold' }}>{totalPresentes}</span></td>
                  </tr>
                  <tr style={{ backgroundColor: '#e6f4ea' }}>
                    <td style={{ padding: '16px', color: '#137333', borderBottomLeftRadius: '8px' }}><strong>QUÓRUM MÍNIMO</strong></td>
                    <td style={{ padding: '16px' }}></td>
                    <td style={{ padding: '16px' }}></td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#0d652d', borderBottomRightRadius: '8px' }}>
                      <span style={{ backgroundColor: '#137333', color: 'white', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {quorum}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        {/* GR�FICO 1 */}
        <div className="card chart-card">
            <div className="card-header">
              <h3 className="font-bold flex items-center gap-2"><Users size={18} className="text-primary"/> Proporção de Inscritos vs Presentes por Região</h3>
            </div>
            <div className="chart-container" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={presencaPorRegiao} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, angle: -45, textAnchor: 'end'}} height={60} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#f5f5f5'}} />
                  <Legend />
                  <Bar dataKey="Total" fill="#e0e0e0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Inscritos" fill="#0b57d0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Presentes" fill="#38761d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        {/* DOCUMENTOS */}
        <div className="card">
            <div className="card-header bg-gray-light font-bold">DOCUMENTOS</div>
            <div className="overflow-x-auto" style={{ padding: '0.5rem' }}>
              <table className="w-full" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0', color: '#5f6368', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Documento</th>
                    <th style={{ padding: '12px 4px', fontWeight: '600' }}>Não Entregue</th>
                    <th style={{ padding: '12px 4px', fontWeight: '600' }}>Entregue</th>
                    <th style={{ padding: '12px 4px', fontWeight: '600' }}>Reenvio</th>
                    <th style={{ padding: '12px 4px', fontWeight: '600' }}>T.Pendentes</th>
                    <th style={{ padding: '12px 4px', fontWeight: '600' }}>Não Precisa</th>
                    <th style={{ padding: '12px 4px', fontWeight: '600' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043', textAlign: 'left' }}>Relat. Atividade Sinodais</td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.naoEntregue} type="red" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.entregue} type="green" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.reenvio} type="orange" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.naoEntregue + ativ.entregue + ativ.reenvio} type="total" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.naoPrecisa} type="white" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.total} type="total" /></td>
                  </tr>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043', textAlign: 'left' }}>Relat. de Estat. Sinodais</td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={estat.naoEntregue} type="red" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={estat.entregue} type="green" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={estat.reenvio} type="orange" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={estat.naoEntregue + estat.entregue + estat.reenvio} type="total" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={estat.naoPrecisa} type="white" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={estat.total} type="total" /></td>
                  </tr>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043', textAlign: 'left' }}>Livro de Atas</td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={atas.naoEntregue} type="red" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={atas.entregue} type="green" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={atas.reenvio} type="orange" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={atas.naoEntregue + atas.entregue + atas.reenvio} type="total" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={atas.naoPrecisa} type="white" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={atas.total} type="total" /></td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #dadce0', backgroundColor: '#fcfcfc' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#202124', textAlign: 'left' }}>SUB-TOTAL</td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.naoEntregue + estat.naoEntregue + atas.naoEntregue} type="red" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.entregue + estat.entregue + atas.entregue} type="green" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.reenvio + estat.reenvio + atas.reenvio} type="orange" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={ativ.naoEntregue + estat.naoEntregue + atas.naoEntregue + ativ.entregue + estat.entregue + atas.entregue + ativ.reenvio + estat.reenvio + atas.reenvio} type="total" /></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><span style={{ color: '#dadce0' }}>-</span></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><span style={{ color: '#dadce0' }}>-</span></td>
                  </tr>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043', textAlign: 'left' }}>Consultas</td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }} colSpan={5}></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={consultas} type="total" /></td>
                  </tr>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043', textAlign: 'left' }}>Propostas</td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }} colSpan={5}></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={propostas} type="total" /></td>
                  </tr>
                  <tr className="table-row-hover" style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#3c4043', textAlign: 'left' }}>Indicação HPP</td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }} colSpan={5}></td>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}><Badge val={indHpp} type="total" /></td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #dadce0', backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#202124', textAlign: 'left', whiteSpace: 'nowrap' }}>TOTAL (Entregues + Reenvio + Avulsos)</td>
                    <td colSpan={5}></td>
                    <td style={{ padding: '14px 4px', textAlign: 'center' }}><Badge val={ativ.entregue + estat.entregue + atas.entregue + ativ.reenvio + estat.reenvio + atas.reenvio + consultas + propostas + indHpp} type="total" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        {/* GR�FICO 2 */}
        <div className="card chart-card">
            <div className="card-header">
              <h3 className="font-bold flex items-center gap-2"><PieChartIcon size={18} className="text-primary"/> Proporção de Documentos Recebidos</h3>
            </div>
            <div className="chart-container" style={{ height: 350 }}>
              {docChartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={docChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {docChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  Nenhum documento recebido ainda.
                </div>
              )}
            </div>
          </div>

      </div>
    </div>
  );
}
