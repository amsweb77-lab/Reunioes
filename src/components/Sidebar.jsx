import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, FileText, CheckSquare, Settings, LayoutTemplate } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: LayoutTemplate, label: 'Painel Geral', path: '/painel-geral' },
    { icon: CalendarDays, label: 'Eventos', path: '/eventos' },
    { icon: Users, label: 'Base Cadastral', path: '/base-cadastral' },
    { icon: Users, label: 'Comissões', path: '/comissoes' },
    { icon: Settings, label: 'Configurações', path: '/config' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-box">
          <h2>Reuniões</h2>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Admin</span>
            <span className="user-role">Administrador</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
