import React from 'react';
import { Bell, Search } from 'lucide-react';
import './Header.css';

export default function Header() {
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
            <option>Reunião CE - 2026</option>
            <option>Congresso Nacional - 2025</option>
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
