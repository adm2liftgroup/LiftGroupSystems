import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

function parseDateToLocal(date) {
  if (!date) return null;
  
  if (typeof date === 'string') {
    const [y, m, d] = date.split("T")[0].split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  
  return new Date(date);
}

export default function ProgramasPreventivos({ id }) {
  console.log("ID recibido como prop:", id);
  
  // Validación robusta del ID
  const montacargasId = React.useMemo(() => {
    const numId = Number(id);
    return isNaN(numId) || numId <= 0 ? null : numId;
  }, [id]);

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

  console.log("montacargasId convertido:", montacargasId);

  // Mostrar error si el ID no es válido
  if (!montacargasId) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ Error: ID de montacargas no válido. Recibido: "{id}"
        </div>
        <p className="mt-4 text-gray-600">
          Por favor, selecciona un montacargas válido desde el menú principal.
        </p>
      </div>
    );
  }

  // Cargar información del montacargas
  useEffect(() => {
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

  // Cargar todos los mantenimientos
  useEffect(() => {
    const fetchTodosMantenimientos = async () => {
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
            montacargas_id: m.montacargas_id
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

    fetchTodosMantenimientos();
  }, [montacargasId, anio]);

  // Filtrar eventos por año
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

  // Crear programa anual automático
  const handleCrearPrograma = async () => {
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
        setSuccess(data.message || "✅ Programa creado exitosamente");
        
        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        setError(data.error || data.message || "❌ Error al crear programa");
      }
    } catch (err) {
      console.error("Error creando programa:", err);
      setError("❌ Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Obtener años únicos de todos los eventos
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
        fontWeight: "bold"
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        📅 Programas Preventivos – Montacargas #{montacargasId}
        {montacargasInfo && ` - ${montacargasInfo.Marca || ''} ${montacargasInfo.Modelo || ''}`}
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

      {/* Configuración Automática */}
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
        </h3>
        
        {eventos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay mantenimientos programados {anioFiltro ? `para el año ${anioFiltro}` : ""}</p>
            <p className="text-sm mt-2">Usa el botón "Crear Programa Anual" para generar los mantenimientos</p>
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
              popup
            />
          </div>
        )}
      </div>

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
          <h4 className="font-semibold mb-3">🎨 Simbología</h4>
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
        </div>
      </div>
    </div>
  );
}