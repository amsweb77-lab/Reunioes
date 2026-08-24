import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Header.css';

export default function Header() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    async function loadEventos() {
      const { data } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
      if (data) {
        setEventos(data);
      }
    }
    loadEventos();
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Buscar participantes, eventos..." className="search-input" />
        </div>
      </div>
      <div className="header-right">
        <div className="event-selector">
          <span className="event-label">Evento Ativo:</span>
          <select className="event-select">
            {eventos.length === 0 && <option>Nenhum evento criado</option>}
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.nome} {ev.numero ? `#${ev.numero}` : ''}
              </option>
            ))}
          </select>
        </div>
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge-indicator"></span>
        </button>
      </div>
    </header>
  );
}
