import fs from 'fs';
import { regioesData, confederacoesData, delegadosData, entregasData } from '../src/data/mockDatabase.js';

let sql = '-- Seed data gerado a partir do mockDatabase.js\n\n';

// 1. Regiões
sql += '-- Regiões\n';
regioesData.forEach(r => {
  sql += `INSERT INTO regioes (id, nome, confeds) VALUES (${r.id}, '${r.nome}', ${r.confeds});\n`;
});
sql += '\n';

// 2. Confederações
sql += '-- Confederações\n';
confederacoesData.forEach(c => {
  sql += `INSERT INTO confederacoes (id, regiao, nome, sigla, ativa) VALUES (${c.id}, '${c.regiao}', '${c.nome}', '${c.sigla}', ${c.ativa});\n`;
});
sql += '\n';

// 3. Delegados
sql += '-- Delegados\n';
delegadosData.forEach(d => {
  // escaping simple quotes in names
  const safeName = d.nome.replace(/'/g, "''");
  sql += `INSERT INTO delegados (id, nome, cargo, tipo, confederacao, regiao, confirmou, presente) VALUES (${d.id}, '${safeName}', '${d.cargo}', '${d.tipo}', '${d.confederacao}', '${d.regiao}', ${d.confirmou}, ${d.presente});\n`;
});
sql += '\n';

// 4. Entregas
sql += '-- Entregas (Documentos)\n';
entregasData.forEach(e => {
  const relAtiv = e.docs.rel_ativ ? 'green' : 'red';
  const relEstat = e.docs.rel_estat ? 'green' : 'red';
  const livroAta = e.docs.livro_ata ? 'green' : 'red';
  sql += `INSERT INTO entregas (id, confederacao_sigla, rel_ativ, rel_estat, livro_ata, consulta, proposta, hpp) VALUES (${e.id}, '${e.confederacao}', '${relAtiv}', '${relEstat}', '${livroAta}', ${e.docs.consulta}, ${e.docs.proposta}, ${e.docs.hpp});\n`;
});

fs.writeFileSync('seed.sql', sql);
console.log('Arquivo seed.sql gerado com sucesso!');
