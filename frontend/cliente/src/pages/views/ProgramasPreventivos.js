// FALTA TERMINARLO DE DOCUMENTAR PORQUE YA ME CONFUNDÍ
import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

// BLOQUE 1: Función auxiliar (parsear fechas) 
function parseDateToLocal(date) {
  if (!date) return null;
  
  if (typeof date === 'string') {
    const [y, m, d] = date.split("T")[0].split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  
  return new Date(date);
}
// FIN DEL BLOQUE 1: Función auxiliar

// BLOQUE 2: Componente principal
export default function ProgramasPreventivos({ id }) {
  console.log("ID recibido como prop:", id);
  
  // BLOQUE 3: Usuarios y permisos
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.rol === "admin";
  
  // Validación robusta del ID
  const montacargasId = React.useMemo(() => {
    const numId = Number(id);
    return isNaN(numId) || numId <= 0 ? null : numId;
  }, [id]);
  // FIN DEL BLOQUE 3: Usuarios y permisos

  // BLOQUE 4: Estados 
  const [eventos, setEventos] = useState([]);
  const [todosEventos, setTodosEventos] = useState([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [dia, setDia] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [montacargasInfo, setMontacargasInfo] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [anioFiltro, setAnioFiltro] = useState("");
  const [fechaActual, setFechaActual] = useState(new Date());
  
  // Estados para edición
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mantenimientoEditando, setMantenimientoEditando] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    tipo: "",
    fecha: "",
    tecnico_id: ""
  });
  // FIN DEL BLOQUE 4: Estados 

  console.log("montacargasId convertido:", montacargasId);
  console.log("Usuario:", user);
  console.log("Es admin:", isAdmin);

  // BLOQUE 5: Cargar info del montacargas
  useEffect(() => {
    if (!montacargasId) return; // No cargar si no hay ID válido

    const fetchMontacargasInfo = async () => {
      try {
        const res = await fetch(`${API_URL}/api/montacargas/${montacargasId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMontacargasInfo(data.montacargas);
          }
        }
      } catch (err) {
        console.error("Error cargando info del montacargas:", err);
      }
    };

    fetchMontacargasInfo();
  }, [montacargasId]);
  // FIN DEL BLOQUE 5: Cargar info del montacargas

  // BLOQUE 6: Cargar todos los mantenimientos
  const cargarMantenimientos = async () => {
    if (!montacargasId) return; // No cargar si no hay ID válido

    try {
      setError("");
      console.log("Cargando todos los mantenimientos para montacargas:", montacargasId);
      
      const res = await fetch(
        `${API_URL}/api/mantenimientos/todos?montacargasId=${montacargasId}`
      );
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Todos los mantenimientos:", data);

      if (data.success) {
        const todosLosEventos = data.mantenimientos.map((m) => ({
          id: m.id,
          title: `${m.tipo} - ${m.mes}/${m.anio}`,
          start: parseDateToLocal(m.fecha),
          end: parseDateToLocal(m.fecha),
          allDay: true,
          tipo: m.tipo,
          mes: m.mes,
          anio: m.anio,
          montacargas_id: m.montacargas_id,
          fecha_original: m.fecha,
          tecnico_id: m.tecnico_id
        }));
        setTodosEventos(todosLosEventos);
        
        // Filtrar por año actual por defecto
        const eventosAnioActual = todosLosEventos.filter(evento => 
          evento.start.getFullYear() === anio
        );
        setEventos(eventosAnioActual);
      } else {
        setError(data.error || "Error al cargar mantenimientos");
      }
    } catch (err) {
      console.error("Error cargando mantenimientos:", err);
      setError("No se pudieron cargar los mantenimientos. Verifica la conexión.");
    }
  };

  useEffect(() => {
    cargarMantenimientos();
  }, [montacargasId, anio]);
  // FIN DEL BLOQUE 6: Cargar todos los mantenimientos 

  // BLOQUE 7: Funciones de filtrado
  const filtrarPorAnio = (year) => {
    if (!year) {
      setEventos(todosEventos);
    } else {
      const eventosFiltrados = todosEventos.filter(evento => 
        evento.start.getFullYear() === parseInt(year)
      );
      setEventos(eventosFiltrados);
    }
  };
  // FIN DEL BLOQUE 7: Funciones de filtrado

  // BLOQUE 8: Abrir modal de edición
  const abrirModalEdicion = (evento) => {
    if (!isAdmin) {
      setError("Solo los administradores pueden editar mantenimientos");
      return;
    }

    setMantenimientoEditando(evento);
    setFormEdicion({
      tipo: evento.tipo,
      fecha: evento.fecha_original ? evento.fecha_original.split('T')[0] : 
             `${evento.anio}-${evento.mes.toString().padStart(2, '0')}-15`,
      tecnico_id: evento.tecnico_id || ""
    });
    setMostrarModalEdicion(true);
  };
  // FIN DEL BLOQUE 8: Abrir modal de edición

  // BLOQUE 9: Cerrar modal de edición
  const cerrarModalEdicion = () => {
    setMostrarModalEdicion(false);
    setMantenimientoEditando(null);
    setFormEdicion({ tipo: "", fecha: "", tecnico_id: "" });
  };
// FIN DEL BLOQUE 9: Cerrar modal de edición

  // BLOQUE 10: Actualizar mantenimiento
  const handleActualizarMantenimiento = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/mantenimientos/${mantenimientoEditando.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formEdicion),
      });
      
      const data = await res.json();
      console.log("Respuesta actualización:", data);

      if (res.ok && data.success) {
        setSuccess("Mantenimiento actualizado correctamente");
        cerrarModalEdicion();
        cargarMantenimientos(); // Recargar datos
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Error al actualizar mantenimiento");
      }
    } catch (err) {
      console.error("Error actualizando mantenimiento:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };
  // FIN DEL BLOQUE 10: Actualizar mantenimiento

  // BLOQUE 11: Eliminar mantenimiento
  const handleEliminarMantenimiento = async (mantenimientoId) => {
    if (!isAdmin) {
      setError("Solo los administradores pueden eliminar mantenimientos");
      return;
    }

    if (!window.confirm("¿Estás seguro de que deseas eliminar este mantenimiento?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/mantenimientos/${mantenimientoId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      console.log("Respuesta eliminación:", data);

      if (res.ok && data.success) {
        setSuccess("Mantenimiento eliminado correctamente");
        cargarMantenimientos(); // Recargar datos
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Error al eliminar mantenimiento");
      }
    } catch (err) {
      console.error("Error eliminando mantenimiento:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };
  // BLOQUE 12: Eliminar mantenimiento

  // BLOQUE 13: Eliminar programa completo de un año
  const handleEliminarProgramaAnual = async (anioEliminar) => {
    if (!isAdmin) {
      setError("Solo los administradores pueden eliminar programas");
      return;
    }

    const mantenimientosDelAnio = todosEventos.filter(e => e.anio === anioEliminar);
    
    if (mantenimientosDelAnio.length === 0) {
      setError(`No hay mantenimientos para el año ${anioEliminar}`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar TODOS los mantenimientos del año ${anioEliminar}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Eliminar cada mantenimiento del año
      for (const mantenimiento of mantenimientosDelAnio) {
        await fetch(`${API_URL}/api/mantenimientos/${mantenimiento.id}`, {
          method: "DELETE",
        });
      }

      setSuccess(`Programa completo del año ${anioEliminar} eliminado correctamente`);
      cargarMantenimientos(); // Recargar datos
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error eliminando programa anual:", err);
      setError("Error al eliminar el programa anual");
    } finally {
      setLoading(false);
    }
  };
// BLOQUE 13: Eliminar programa completo de un año

// BLOQUE 14: Crear programa anual automático - SOLO ADMIN
  const handleCrearPrograma = async () => {
    if (!isAdmin) {
      setError("Solo los administradores pueden crear programas de mantenimiento");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      console.log("Enviando datos:", { montacargasId, anio, dia });
      
      const res = await fetch(`${API_URL}/api/mantenimientos`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          montacargasId: montacargasId,
          anio: Number(anio),
          dia: Number(dia),
        }),
      });
      
      const data = await res.json();
      console.log("Respuesta del servidor:", data);

      if (res.ok && data.success) {
        setSuccess(data.message || "Programa creado exitosamente");
        cargarMantenimientos(); // Recargar datos en lugar de recargar página
      } else {
        setError(data.error || data.message || "Error al crear programa");
      }
    } catch (err) {
      console.error("Error creando programa:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };
  // FIN DEL BLOQUE: Funciones de edición y eliminación

  // BLOQUE 15: Utilidades de vista calendario
  const añosUnicos = [...new Set(todosEventos.map(evento => evento.start.getFullYear()))].sort((a, b) => b - a);

  // Estilos de eventos por tipo
  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad"; // Default - Preventivo
    if (event.tipo === "Básico") backgroundColor = "#28a745";
    if (event.tipo === "Intermedio") backgroundColor = "#ffc107";
    if (event.tipo === "Avanzado") backgroundColor = "#dc3545";
    
    return { 
      style: { 
        backgroundColor, 
        color: "#fff", 
        borderRadius: 6,
        padding: "2px 5px",
        fontSize: "12px",
        fontWeight: "bold",
        cursor: isAdmin ? "pointer" : "default"
      } 
    };
  };

  // Formateador personalizado para el calendario
  const formats = {
    monthHeaderFormat: (date) => moment(date).format('MMMM YYYY'),
    dayRangeHeaderFormat: ({ start, end }) => 
      `${moment(start).format('MMM D')} - ${moment(end).format('MMM D, YYYY')}`,
    dayHeaderFormat: (date) => moment(date).format('dddd, MMM D'),
  };

  // Función para navegar entre meses y años
  const onNavigate = (newDate) => {
    setFechaActual(newDate);
  };

  // Manejar clic en evento del calendario
  const handleSelectEvent = (event) => {
    if (isAdmin) {
      abrirModalEdicion(event);
    }
  };
// FIN DEL BLOQUE 15: Utilidades de vista calendario

  // Botones de navegación personalizados
  const CustomToolbar = ({ label, onNavigate, onView }) => {
    return (
      <div className="rbc-toolbar flex flex-wrap items-center justify-between mb-4">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => onNavigate('TODAY')} className="bg-gray-300 px-3 py-1 rounded mr-2">
            Hoy
          </button>
          <button type="button" onClick={() => onNavigate('PREV')} className="bg-gray-300 px-3 py-1 rounded mr-2">
            ◀
          </button>
          <button type="button" onClick={() => onNavigate('NEXT')} className="bg-gray-300 px-3 py-1 rounded">
            ▶
          </button>
        </span>
        
        <span className="rbc-toolbar-label text-lg font-semibold">
          {label}
        </span>
      </div>
    );
  };
  // FIN DEL BLOQUE 15: Utilidades de vista calendario

  // BLOQUE 16: Validación de ID inválido
  if (!montacargasId) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
           Error: ID de montacargas no válido. Recibido: "{id}"
        </div>
        <p className="mt-4 text-gray-600">
          Por favor, selecciona un montacargas válido desde el menú principal.
        </p>
      </div>
    );
  }
  // FIN DEL BLOQUE 16: Validación de ID inválido

  // BLOQUE 17: Return UI 
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        📅 Programas Preventivos – Montacargas #{montacargasId}
        {montacargasInfo && ` - ${montacargasInfo.Marca || ''} ${montacargasInfo.Modelo || ''}`}
        {!isAdmin && <span className="text-sm text-gray-500 ml-2">(Solo lectura)</span>}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Configuración Automática - SOLO PARA ADMIN */}
      {isAdmin && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🔄 Programa Automático Anual</h3>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <label className="flex items-center gap-2">
              <span className="font-medium">Año programa:</span>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded w-24"
                min="2020"
                max="2030"
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="font-medium">Día del mes:</span>
              <input
                type="number"
                value={dia}
                onChange={(e) => setDia(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded w-20"
                min="1"
                max="28"
              />
            </label>

            <button
              disabled={loading}
              onClick={handleCrearPrograma}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {loading ? "⏳ Creando..." : "🚀 Crear Programa Anual"}
            </button>
          </div>
          
          <div className="text-sm text-blue-700">
            <strong>Patrón automático:</strong> Básico (Ene,Feb,Abr,May,Jul,Ago,Oct,Nov), Intermedio (Mar,Jun,Sep), Avanzado (Dic)
          </div>
        </div>
      )}

      {/* Mensaje para usuarios no administradores */}
      {!isAdmin && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">👤 Modo de solo lectura</h3>
          <p className="text-yellow-700">
            Eres un usuario normal. Solo puedes consultar los programas de mantenimiento existentes.
            Contacta a un administrador para crear nuevos programas.
          </p>
        </div>
      )}

      {/* Filtros de visualización */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">👁️ Visualización</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2">
            <span className="font-medium">Filtrar por año:</span>
            <select
              value={anioFiltro}
              onChange={(e) => {
                setAnioFiltro(e.target.value);
                filtrarPorAnio(e.target.value);
              }}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="">Todos los años</option>
              {añosUnicos.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mostrarTodos}
              onChange={(e) => setMostrarTodos(e.target.checked)}
              className="mr-2"
            />
            <span>Mostrar todos los años en el calendario</span>
          </label>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Calendario {anioFiltro ? `- Año ${anioFiltro}` : "- Todos los años"}
          {isAdmin && <span className="text-sm text-gray-500 ml-2">(Haz clic en un evento para editarlo)</span>}
        </h3>
        
        {eventos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay mantenimientos programados {anioFiltro ? `para el año ${anioFiltro}` : ""}</p>
            {isAdmin && (
              <p className="text-sm mt-2">Usa el botón "Crear Programa Anual" para generar los mantenimientos</p>
            )}
          </div>
        ) : (
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={mostrarTodos ? todosEventos : eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              views={["month", "agenda"]}
              view={"month"}
              date={fechaActual}
              onNavigate={onNavigate}
              onSelectEvent={isAdmin ? handleSelectEvent : null}
              onView={(view) => {
                const calendarElement = document.querySelector('.rbc-calendar');
                if (calendarElement) {
                  if (view === 'agenda') {
                    calendarElement.style.height = '800px';
                  } else {
                    calendarElement.style.height = '600px';
                  }
                }
              }}
              eventPropGetter={eventStyleGetter}
              formats={formats}
              messages={{
                today: "Hoy",
                previous: "◀",
                next: "▶",
                month: "Mes",
                agenda: "Lista",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
              }}
              components={{
                toolbar: (props) => (
                  <CustomToolbar 
                    {...props} 
                    onNavigate={(action) => {
                      if (action === 'PREV') {
                        const newDate = new Date(fechaActual);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setFechaActual(newDate);
                      } else if (action === 'NEXT') {
                        const newDate = new Date(fechaActual);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setFechaActual(newDate);
                      } else if (action === 'TODAY') {
                        setFechaActual(new Date());
                      }
                    }}
                    onView={props.onView}
                  />
                )
              }}
              popup
            />
          </div>
        )}
      </div>

      {/* Lista de mantenimientos con acciones */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">📋 Lista de Mantenimientos</h3>
        
        {añosUnicos.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay mantenimientos programados</p>
        ) : (
          añosUnicos.map(year => {
            const eventosDelAño = todosEventos.filter(e => e.anio === year).sort((a, b) => a.mes - b.mes);
            
            return (
              <div key={year} className="mb-6 border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <h4 className="font-semibold">Año {year}</h4>
                  {isAdmin && (
                    <button
                      onClick={() => handleEliminarProgramaAnual(year)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      title="Eliminar todo el programa de este año"
                    >
                      🗑️ Eliminar Programa
                    </button>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventosDelAño.map(evento => (
                      <div key={evento.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            evento.tipo === "Básico" ? "bg-green-100 text-green-800" :
                            evento.tipo === "Intermedio" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {evento.tipo}
                          </span>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => abrirModalEdicion(evento)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleEliminarMantenimiento(evento.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="font-medium">Mes: {evento.mes}/{evento.anio}</p>
                        <p className="text-sm text-gray-600">
                          Fecha: {evento.start.toLocaleDateString()}
                        </p>
                        {evento.tecnico_id && (
                          <p className="text-sm text-gray-600">Técnico: {evento.tecnico_id}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Edición */}
      {mostrarModalEdicion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">✏️ Editar Mantenimiento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Mantenimiento
                </label>
                <select
                  value={formEdicion.tipo}
                  onChange={(e) => setFormEdicion({...formEdicion, tipo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formEdicion.fecha}
                  onChange={(e) => setFormEdicion({...formEdicion, fecha: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Técnico (Opcional)
                </label>
                <input
                  type="text"
                  value={formEdicion.tecnico_id}
                  onChange={(e) => setFormEdicion({...formEdicion, tecnico_id: e.target.value})}
                  placeholder="ID del técnico asignado"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cerrarModalEdicion}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarMantenimiento}
                disabled={loading || !formEdicion.tipo || !formEdicion.fecha}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen y estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold mb-3">📊 Resumen por año</h4>
          {añosUnicos.length === 0 ? (
            <p className="text-gray-500">No hay mantenimientos registrados</p>
          ) : (
            añosUnicos.map(year => {
              const eventosDelAño = todosEventos.filter(e => e.start.getFullYear() === year);
              const basicos = eventosDelAño.filter(e => e.tipo === "Básico").length;
              const intermedios = eventosDelAño.filter(e => e.tipo === "Intermedio").length;
              const avanzados = eventosDelAño.filter(e => e.tipo === "Avanzado").length;
              
              return (
                <div key={year} className="mb-3 p-2 bg-white rounded">
                  <h5 className="font-medium">Año {year}</h5>
                  <div className="text-sm">
                    <p>Total: {eventosDelAño.length}</p>
                    <p>Básicos: {basicos}</p>
                    <p>Intermedios: {intermedios}</p>
                    <p>Avanzados: {avanzados}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Leyenda */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3">Simbología</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 mr-2 rounded-sm bg-green-500"></span>
              <span>Básico</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 mr-2 rounded-sm bg-yellow-500"></span>
              <span>Intermedio</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 mr-2 rounded-sm bg-red-500"></span>
              <span>Avanzado</span>
            </div>
          </div>
          {isAdmin && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <h5 className="font-medium mb-2">Acciones disponibles:</h5>
              <p className="text-sm">• Haz clic en eventos del calendario para editarlos</p>
              <p className="text-sm">• Usa los íconos ✏️ y 🗑️ en la lista</p>
              <p className="text-sm">• Elimina programas completos por año</p>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-3">ℹ️ Información</h4>
        <div className="text-sm">
          <p><strong>Total de mantenimientos:</strong> {todosEventos.length}</p>
          <p><strong>Años con programas:</strong> {añosUnicos.join(', ') || 'Ninguno'}</p>
          <p><strong>Montacargas ID:</strong> {montacargasId}</p>
          <p><strong>Mostrando:</strong> {mostrarTodos ? 'Todos los años' : anioFiltro ? `Año ${anioFiltro}` : `Año ${anio}`}</p>
          <p><strong>Permisos:</strong> {isAdmin ? 'Administrador (Edición habilitada)' : 'Usuario (Solo lectura)'}</p>
        </div>
      </div>
    </div>
  );
  // FIN DEL BLOQUE 17: Return UI

}
// FIN DEL BLOQUE 1: Componente pricipal