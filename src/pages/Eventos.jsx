import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, MapPin, Video, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Eventos.css';

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Reunião CE',
    numero: '',
    data_evento: '',
    forma: 'presencial',
    local_link: '',
    status: 'planejado'
  });

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('eventos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setEventos(data);
        localStorage.setItem('eventosData', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Usando dados locais de eventos.', error);
      const localData = localStorage.getItem('eventosData');
      if (localData) {
        setEventos(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'Reunião CE',
      numero: '',
      data_evento: '',
      forma: 'presencial',
      local_link: '',
      status: 'planejado'
    });
    setEditingId(null);
  };

  const handleOpenModal = (evento = null) => {
    if (evento) {
      setEditingId(evento.id);
      setFormData({
        nome: evento.nome || '',
        tipo: evento.tipo || 'Reunião CE',
        numero: evento.numero || '',
        data_evento: evento.data_evento || '',
        forma: evento.forma || 'presencial',
        local_link: evento.local_link || '',
        status: evento.status || 'planejado'
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.data_evento) {
      alert("Preencha o nome e a data do evento.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Update
        const { data, error } = await supabase
          .from('eventos')
          .update(formData)
          .eq('id', editingId)
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const updatedEventos = eventos.map(e => e.id === editingId ? data[0] : e);
          setEventos(updatedEventos);
          localStorage.setItem('eventosData', JSON.stringify(updatedEventos));
        }
      } else {
        // Insert
        const { data, error } = await supabase
          .from('eventos')
          .insert([formData])
          .select();
          
        if (error) throw error;

        if (data && data.length > 0) {
          const newEventos = [data[0], ...eventos];
          setEventos(newEventos);
          localStorage.setItem('eventosData', JSON.stringify(newEventos));
        }
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar evento no Supabase:", error);
      
      const erroMsg = error.message || JSON.stringify(error);
      alert(`Erro do Supabase: ${erroMsg}\n\nSalvando apenas localmente para fallback.`);
      
      // Fallback local save
      const eventToSave = { ...formData, id: editingId || Date.now() };
      let newEventos = [];
      if (editingId) {
        newEventos = eventos.map(e => e.id === editingId ? eventToSave : e);
      } else {
        newEventos = [eventToSave, ...eventos];
      }
      setEventos(newEventos);
      localStorage.setItem('eventosData', JSON.stringify(newEventos));
      setShowModal(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) throw error;

      const newEventos = eventos.filter(e => e.id !== id);
      setEventos(newEventos);
      localStorage.setItem('eventosData', JSON.stringify(newEventos));
    } catch (error) {
      console.error('Erro ao excluir:', error);
      // Local fallback
      const newEventos = eventos.filter(e => e.id !== id);
      setEventos(newEventos);
      localStorage.setItem('eventosData', JSON.stringify(newEventos));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando eventos...</div>;
  }

  return (
    <div className="eventos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">Gerencie as Reuniões da Comissão Executiva e Congressos</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Novo Evento
          </button>
        </div>
      </div>

      <div className="eventos-grid">
        {eventos.map(evento => (
          <div key={evento.id} className="card evento-card">
            <div className="evento-header">
              <span className={`badge ${evento.tipo === 'Congresso' ? 'badge-primary' : 'badge-success'}`}>
                {evento.tipo}
              </span>
              <span className={`status-text ${evento.status === 'planejado' ? 'text-orange-500' : 'text-green-600'}`}>
                {evento.status === 'planejado' ? <Clock size={14} /> : <CheckCircle size={14} />}
                {evento.status.charAt(0).toUpperCase() + evento.status.slice(1)}
              </span>
            </div>
            
            <h3 className="evento-title">
              {evento.nome} {evento.numero && <span className="text-muted">#{evento.numero}</span>}
            </h3>
            
            <div className="evento-details">
              <div className="detail-item">
                <Calendar size={16} />
                <span>{evento.data_evento}</span>
              </div>
              <div className="detail-item">
                {evento.forma === 'presencial' ? (
                  <>
                    <MapPin size={16} />
                    <span className="truncate">Presencial: {evento.local_link}</span>
                  </>
                ) : (
                  <>
                    <Video size={16} />
                    <span className="truncate">Online: {evento.local_link?.startsWith('http') ? <a href={evento.local_link} target="_blank" rel="noreferrer" className="text-primary">Link da Reunião</a> : evento.local_link}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="evento-actions flex gap-2 mt-4">
              <button className="btn btn-outline" style={{ flex: 1 }}>Gerenciar Módulos</button>
              <button className="btn btn-outline text-muted px-2" title="Editar" onClick={() => handleOpenModal(evento)}>
                <Edit size={16} />
              </button>
              <button className="btn btn-outline text-danger px-2 border-red-200 hover:bg-red-50" title="Excluir" onClick={() => handleDelete(evento.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {eventos.length === 0 && (
          <div className="p-8 text-center text-muted" style={{ gridColumn: '1 / -1' }}>
            Nenhum evento cadastrado. Clique em "Novo Evento" para começar.
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Editar Evento' : 'Cadastrar Novo Evento'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="input-group full-width">
                  <label>Nome do Evento *</label>
                  <input type="text" className="input" placeholder="Ex: Reunião Ordinária da Comissão Executiva" 
                         value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                
                <div className="input-group">
                  <label>Tipo de Evento</label>
                  <select className="input" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="Reunião CE">Reunião da Comissão Executiva</option>
                    <option value="Congresso">Congresso</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Número/Edição</label>
                  <input type="text" className="input" placeholder="Ex: 23" 
                         value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} />
                </div>
                
                <div className="input-group">
                  <label>Data *</label>
                  <input type="text" className="input" placeholder="DD/MM/AAAA"
                         value={formData.data_evento} onChange={e => setFormData({...formData, data_evento: e.target.value})} />
                </div>

                <div className="input-group">
                  <label>Status</label>
                  <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="planejado">Planejado</option>
                    <option value="em andamento">Em andamento</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Forma</label>
                  <select className="input" value={formData.forma} onChange={e => setFormData({...formData, forma: e.target.value})}>
                    <option value="presencial">Presencial</option>
                    <option value="online">On-line</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>{formData.forma === 'presencial' ? 'Localização (Presencial)' : 'Link (On-line)'}</label>
                  <input type={formData.forma === 'presencial' ? 'text' : 'url'} className="input" 
                         placeholder={formData.forma === 'presencial' ? 'Nome do local e endereço' : 'https://...'}
                         value={formData.local_link} onChange={e => setFormData({...formData, local_link: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
