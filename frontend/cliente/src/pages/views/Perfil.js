import React, { useState, useEffect, useCallback } from "react";

// BLOQUE 1: Panel de Administración
const AdminPanel = ({ users, loading, error }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  const getInitial = (nombre) => {
    if (!nombre) return "U";
    return nombre.charAt(0).toUpperCase();
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-2xl shadow-lg w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Panel de Administración</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Gestión de Usuarios</h3>
        <p className="text-gray-600">Total de usuarios: {users.length}</p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Estadísticas</h3>
        <p className="text-gray-600">
          Usuarios verificados: {users.filter(user => user.email_verified).length}
        </p>
        <p className="text-gray-600">
          Administradores: {users.filter(user => user.rol === "admin").length}
        </p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-3">Lista de Usuarios Registrados</h3>
        {loading ? (
          <div className="text-center py-4">Cargando usuarios...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">USUARIO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">EMAIL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ROL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">VERIFICADO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">FECHA REGISTRO</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                            {getInitial(user.nombre)}
                          </div>
                          <div><strong>{user.nombre || "N/A"}</strong></div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.rol === "admin" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email_verified ? "Sí" : "No"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// BLOQUE 1.5: Panel de Mantenimientos del Mes
const MantenimientosMesPanel = ({ mantenimientos, loading, error, mes, anio }) => {
  const getNombreMes = (mesNum) => {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses[mesNum - 1] || "Mes desconocido";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No programado";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "Básico": return "bg-green-100 text-green-800";
      case "Intermedio": return "bg-yellow-100 text-yellow-800";
      case "Avanzado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-2xl shadow-lg w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Mantenimientos del Mes - {getNombreMes(mes)} {anio}</h2>
      <p className="text-gray-600 mb-6">Total de mantenimientos programados: {mantenimientos.length}</p>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando mantenimientos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          {mantenimientos.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">MONTACARGAS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">INFORMACIÓN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">TIPO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">FECHA PROGRAMADA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">UBICACIÓN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">TÉCNICO</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mantenimientos.map((mantenimiento) => (
                  <tr key={mantenimiento.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          #{mantenimiento.montacargas_numero}
                        </div>
                        <div>
                          <strong>#{mantenimiento.montacargas_numero}</strong>
                          <div className="text-sm text-gray-600">{mantenimiento.montacargas_marca} {mantenimiento.montacargas_modelo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div><strong>Serie:</strong> {mantenimiento.montacargas_serie}</div>
                      <div><strong>Planta:</strong> {mantenimiento.montacargas_planta || "N/A"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipoColor(mantenimiento.tipo)}`}>
                        {mantenimiento.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(mantenimiento.fecha)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {mantenimiento.montacargas_ubicacion || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {mantenimiento.tecnico_nombre || "Por asignar"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-2">📅</div>
              <p className="text-gray-600">No hay mantenimientos programados para este mes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// BLOQUE 1.6: Panel de Asignación de Técnicos
const AsignacionTecnicosPanel = ({ 
  mantenimientos, 
  tecnicos, 
  loading, 
  error, 
  mes, 
  anio,
  onAsignarTecnico 
}) => {
  const [asignando, setAsignando] = useState(null);

  const getNombreMes = (mesNum) => {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses[mesNum - 1] || "Mes desconocido";
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "Básico": return "bg-green-100 text-green-800";
      case "Intermedio": return "bg-yellow-100 text-yellow-800";
      case "Avanzado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAsignar = async (mantenimientoId, tecnicoId) => {
    setAsignando(mantenimientoId);
    try {
      await onAsignarTecnico(mantenimientoId, tecnicoId);
    } finally {
      setAsignando(null);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-2xl shadow-lg w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Asignación de Técnicos - {getNombreMes(mes)} {anio}</h2>
      <p className="text-gray-600 mb-6">
        Total de mantenimientos: {mantenimientos.length} | Técnicos disponibles: {tecnicos.length}
      </p>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando mantenimientos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          {mantenimientos.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">MONTACARGAS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">TIPO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">FECHA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">TÉCNICO ASIGNADO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mantenimientos.map((mantenimiento) => (
                  <tr key={mantenimiento.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          #{mantenimiento.montacargas_numero}
                        </div>
                        <div>
                          <strong>#{mantenimiento.montacargas_numero}</strong>
                          <div className="text-sm text-gray-600">{mantenimiento.montacargas_marca} {mantenimiento.montacargas_modelo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipoColor(mantenimiento.tipo)}`}>
                        {mantenimiento.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {mantenimiento.tecnico_nombre ? (
                        <span className="text-green-600 font-medium">{mantenimiento.tecnico_nombre}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Por asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {asignando === mantenimiento.id ? (
                        <span className="text-blue-600">Asignando...</span>
                      ) : (
                        <select 
                          value={mantenimiento.tecnico_id || ""}
                          onChange={(e) => handleAsignar(mantenimiento.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                          disabled={asignando}
                        >
                          <option value="">Seleccionar técnico</option>
                          {tecnicos.map((tecnico) => (
                            <option key={tecnico.id} value={tecnico.id}>
                              {tecnico.nombre} - {tecnico.email}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay mantenimientos programados para este mes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// BLOQUE 1.7: Panel de Técnico - CORREGIDO
const PanelTecnico = ({ 
  mantenimientos, 
  loading, 
  error, 
  tecnico, 
  onAbrirChecklist,  // CAMBIADO: onDescargarChecklist -> onAbrirChecklist
  onMarcarCompletado 
}) => {
  const [completando, setCompletando] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [localMantenimientos, setLocalMantenimientos] = useState(mantenimientos);

  useEffect(() => {
    setLocalMantenimientos(mantenimientos);
  }, [mantenimientos]);

  useEffect(() => {
    return () => {
      setCompletando(null);
      setTouchStart(null);
    };
  }, []);

  const getNombreMes = (mesNum) => {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses[mesNum - 1] || "Mes desconocido";
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "Básico": return "bg-green-100 text-green-800";
      case "Intermedio": return "bg-yellow-100 text-yellow-800";
      case "Avanzado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const mesActual = new Date().getMonth() + 1;
  const anioActual = new Date().getFullYear();

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e, callback, ...args) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) < 10) {
      callback(...args);
    }
    
    setTouchStart(null);
  };

  const handleMarcarCompletado = async (mantenimientoId) => {
    if (completando) return;
    
    setCompletando(mantenimientoId);
    
    try {
      
      setLocalMantenimientos(prev => 
        prev.map(m => 
          m.id === mantenimientoId 
            ? { 
                ...m, 
                status: 'completado',
                completado_en: new Date().toISOString()
              }
            : m
        )
      );

      await new Promise(resolve => setTimeout(resolve, 100));
      
      await onMarcarCompletado(mantenimientoId);
      
    } catch (error) {
      console.error('Error en handleMarcarCompletado:', error);
     
      setLocalMantenimientos(prev => 
        prev.map(m => 
          m.id === mantenimientoId 
            ? { 
                ...m, 
                status: 'pendiente',
                completado_en: null
              }
            : m
        )
      );
    } finally {
      
      setTimeout(() => {
        setCompletando(null);
      }, 1000);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-2xl shadow-lg w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Mis Mantenimientos Asignados - {getNombreMes(mesActual)} {anioActual}</h2>
      <p className="text-gray-600 mb-6">Hola <strong>{tecnico?.nombre}</strong>, aquí tienes tus mantenimientos asignados para este mes.</p>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando tus asignaciones...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localMantenimientos.length > 0 ? (
            localMantenimientos.map((mantenimiento) => (
              <div 
                key={`mantenimiento-${mantenimiento.id}-${mantenimiento.status}-${completando}`}
                className="border border-gray-200 rounded-lg p-4 transition-all duration-300"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(mantenimiento.tipo)}`}>
                    {mantenimiento.tipo}
                  </span>
                  <span className="text-lg font-bold text-blue-600">#{mantenimiento.montacargas_numero}</span>
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-2">
                  {mantenimiento.montacargas_marca} {mantenimiento.montacargas_modelo}
                </h3>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Serie:</strong> {mantenimiento.montacargas_serie}</p>
                  <p><strong>Ubicación:</strong> {mantenimiento.montacargas_ubicacion || "N/A"}</p>
                  <p><strong>Planta:</strong> {mantenimiento.montacargas_planta || "N/A"}</p>
                  <p><strong>Fecha:</strong> {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}</p>
                  <p><strong>Estado:</strong> 
                    <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      mantenimiento.status === 'completado' 
                        ? 'bg-green-100 text-green-800' 
                        : mantenimiento.status === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mantenimiento.status || 'pendiente'}
                    </span>
                  </p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  {/* BOTÓN CORREGIDO: Ahora abre el checklist móvil */}
                  <button 
                    onClick={() => onAbrirChecklist(mantenimiento)}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded text-sm font-medium hover:bg-green-700 flex items-center justify-center transition-colors"
                    style={{ 
                      minHeight: '44px',
                      touchAction: 'manipulation'
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Completar Checklist
                  </button>
                  
                  {/* BOTÓN MEJORADO PARA MÓVILES */}
                  {completando === mantenimiento.id ? (
                    <button 
                      disabled
                      className="w-full bg-gray-400 text-white py-3 px-4 rounded text-sm font-medium flex items-center justify-center cursor-not-allowed"
                      style={{ minHeight: '44px' }}
                    >
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </button>
                  ) : mantenimiento.status !== 'completado' ? (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarcarCompletado(mantenimiento.id);
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={(e) => handleTouchEnd(e, handleMarcarCompletado, mantenimiento.id)}
                      disabled={completando}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded text-sm font-medium flex items-center justify-center hover:bg-blue-700 transition-colors active:bg-blue-800"
                      style={{ 
                        minHeight: '44px',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Marcar como completado
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-green-600 text-white py-3 px-4 rounded text-sm font-medium flex items-center justify-center cursor-not-allowed"
                      style={{ minHeight: '44px' }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completado
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <div className="text-gray-500 text-lg mb-2">🔧</div>
              <p className="text-gray-600">No tienes mantenimientos asignados para este mes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// BLOQUE 1.8: Componente de Checklist Móvil
const ChecklistMovil = ({ mantenimiento, tecnico, onCompletarChecklist }) => {
  const [checklistData, setChecklistData] = useState({});
  const [observaciones, setObservaciones] = useState("");
  const [actividadesPendientes, setActividadesPendientes] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [partesFaltantes, setPartesFaltantes] = useState("");
  const [golpesUnidad, setGolpesUnidad] = useState("");
  const [condicionesPintura, setCondicionesPintura] = useState("Bueno");
  const [currentSection, setCurrentSection] = useState(0);
  

  const sections = [
    { title: "Información General", range: [1, 10] },
    { title: "Inspección Visual", range: [11, 20] },
    { title: "Revisión Mecánica", range: [21, 30] },
    { title: "Sistema Eléctrico", range: [31, 40] },
    { title: "Motor y Transmisión", range: [41, 50] },
    { title: "Hidráulica", range: [51, 60] },
    { title: "Pruebas Finales", range: [61, 70] },
    { title: "Limpieza y Lubricación", range: [71, 84] },
    { title: "Observaciones y Firmas" }
  ];

  const getDescripcionChecklist = (numero) => {
    const descripciones = {
      1: "Revisión visual de ruedas, chasis, mástil, etc.",
      2: "Revisar alarma de reversa",
      3: "Revisar funcionamiento de claxón",
      4: "Revisar extintor y base",
      5: "Revisar seguros de cuchillas",
      6: "Revisar mofle y tubo de escape",
      7: "Inspeccionar cilindros de inclinación y mangueras",
      8: "Inspeccionar manguera principal y poleas",
      9: "Revisar y engrasar cilindros, ejes y soportes",
      10: "Revisar tapas de masas de llantas traseras",
      11: "Revisar tornillos de parrilla y barra",
      12: "Inspeccionar cilindros de desplazador y mangueras",
      13: "Engrasar carro desplazador con aguja",
      14: "Revisar mangueras, abrazaderas y tapón de radiador",
      15: "Abrir cofre y revisar pistón",
      16: "Retirar tapa lateral izquierda",
      17: "Retirar tapete y piso y revisar estado",
      18: "Revisar estado de pedales",
      19: "Limpiar terminales, bornes y protector de batería",
      20: "Revisar ruido y carga de alternador",
      21: "Revisar estado físico de batería",
      22: "Revisión de nivel de líquido de frenos",
      23: "Revisar tornillo de contrapeso",
      24: "Drenar aceite de motor y quitar filtro",
      25: "Reemplazar filtro y aceite de transmisión cuando aplique",
      26: "Revisar conectores del sistema de gas",
      27: "Revisar tapa(s) de caja(s) de fusibles y fusibles",
      28: "Cambiar cables y bujías de motor",
      29: "Cambiar tapa de distribuidor y rotor cuando aplique",
      30: "Revisar arnés eléctrico, grapas y/o bases de sujeción",
      31: "Colocar filtro y aceite de motor",
      32: "Colocar tapa lateral izquierda",
      33: "Revisar fugas en líneas de gas utilizando swipe",
      34: "Cerrar cofre y colocar tapa de radiador",
      35: "Revisar luces: Traseras - Delanteras - Reversa - Torreta",
      36: "Sopletear equipo en general",
      37: "Colocar tapete y piso",
      38: "Recoger material de desecho (filtros, aceite usado y trapos)",
      39: "Partes o piezas faltantes",
      40: "Revisión de nivel de aceite hidráulico - agregar si es necesario",
      41: "Asegurar que no se encuentre con fugas el equipo",
      42: "Revisar switch de arranque",
      43: "Revisar switch de asiento",
      44: "Revisar y accionar palanca de cambios",
      45: "Revisar estado de cinturón de seguridad",
      46: "Revisar ajuste de freno de estacionamiento",
      47: "Revisar asiento y su riel",
      48: "Accionar inclinación y retracción de mástil",
      49: "Subir mástil, girar volante derecha e izquierda (identificar anomalías)",
      50: "Medir altura de llantas (mm)",
      51: "Asegurar ajuste de muelas del carro en mástil",
      52: "Revisar tuercas y birlos",
      53: "Accionar desplazador lateral",
      54: "Desmontar y revisar muelas del carro desplazador",
      55: "Revisar cuchillas y sus condiciones",
      56: "Abrir cofre y revisar empaque",
      57: "Retirar tapa lateral derecha",
      58: "Revisar condiciones de guarda de operador",
      59: "Revisar y purgar el vaporizador",
      60: "Cerrar válvula de gas y dejar APAGARSE el motor",
      61: "Revisar seguro y válvulas de tanque de gas",
      62: "Revisar ruido y funcionamiento de marcha",
      63: "Retirar materiales extraños de llantas y ejes",
      64: "Cambiar filtro y aceite hidráulico cuando aplique",
      65: "Cambiar filtro de aire",
      66: "Revisar nivel de aceite de diferencial",
      67: "Cambiar bujías de motor",
      68: "Revisar ajuste de cadenas",
      69: "Lubricar cadenas",
      70: "Revisar juego en ruedas y balatas",
      71: "Engrasar cruceta cuando aplique",
      72: "Revisar estado de banda y bomba de agua",
      73: "Revisar fugas de aceite o fluidos en el motor",
      74: "Colocar tapa lateral derecha",
      75: "Abrir válvula de gas y revisar línea principal",
      76: "Revisar ajuste de pedales (Neutralizador, freno, acelerador)",
      77: "Cerrar cofre y colocar tapa de radiador",
      78: "Revisar y limpiar retrovisores",
      79: "Realizar limpieza general de la unidad",
      80: "Lubricar y engrasar todos los puntos de movimiento",
      81: "Revisión y engrasado de eje de dirección",
      82: "Golpes en la unidad",
      83: "Revisar condiciones de la pintura",
      84: "Hora en la que se terminó el servicio"
    };
    
    return descripciones[numero] || `Revisión ${numero}`;
  };

  const handleCheckboxChange = (itemNumber, value) => {
    setChecklistData(prev => ({
      ...prev,
      [itemNumber]: value
    }));
  };

  const handleTextInputChange = (itemNumber, value) => {
    setChecklistData(prev => ({
      ...prev,
      [itemNumber]: value
    }));
  };

  const renderCheckboxItem = (numero) => {
    const descripcion = getDescripcionChecklist(numero);
    
    // Items que necesitan selección Bueno/Reemplazo
    const buenoReemplazoItems = [2, 3, 4, 10, 11, 15, 17, 19, 21, 27, 33, 35, 54, 55, 56, 61, 64, 65, 66, 67, 70, 72, 75, 78];
    
    // Items que son solo efectuado
    const efectuadoItems = [1, 5, 6, 7, 8, 9, 12, 13, 14, 16, 18, 20, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 34, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 57, 58, 59, 60, 62, 63, 68, 69, 76, 77, 79, 80, 81];

    if (buenoReemplazoItems.includes(numero)) {
      return (
        <div key={numero} className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
          <p className="font-medium text-gray-800 mb-3">{numero}. {descripcion}</p>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`item-${numero}`}
                value="Bueno"
                checked={checklistData[numero] === "Bueno"}
                onChange={() => handleCheckboxChange(numero, "Bueno")}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-sm">Bueno</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`item-${numero}`}
                value="Reemplazo"
                checked={checklistData[numero] === "Reemplazo"}
                onChange={() => handleCheckboxChange(numero, "Reemplazo")}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-sm">Reemplazo</span>
            </label>
          </div>
        </div>
      );
    } else if (efectuadoItems.includes(numero)) {
      return (
        <div key={numero} className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-800">{numero}. {descripcion}</p>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checklistData[numero] === true}
                onChange={(e) => handleCheckboxChange(numero, e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Efectuado</span>
            </label>
          </div>
        </div>
      );
    } else if (numero === 50) {
      // Medición de llantas
      return (
        <div key={numero} className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
          <p className="font-medium text-gray-800 mb-3">{numero}. {descripcion}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">FD (mm)</label>
              <input
                type="number"
                value={checklistData[`${numero}_FD`] || ""}
                onChange={(e) => handleTextInputChange(`${numero}_FD`, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">FI (mm)</label>
              <input
                type="number"
                value={checklistData[`${numero}_FI`] || ""}
                onChange={(e) => handleTextInputChange(`${numero}_FI`, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">TD (mm)</label>
              <input
                type="number"
                value={checklistData[`${numero}_TD`] || ""}
                onChange={(e) => handleTextInputChange(`${numero}_TD`, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">TI (mm)</label>
              <input
                type="number"
                value={checklistData[`${numero}_TI`] || ""}
                onChange={(e) => handleTextInputChange(`${numero}_TI`, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderSpecialItems = () => {
    const currentSectionData = sections[currentSection];
    if (!currentSectionData.range) return null;

    const items = [];
    for (let i = currentSectionData.range[0]; i <= currentSectionData.range[1]; i++) {
      items.push(renderCheckboxItem(i));
    }
    return items;
  };

  const renderObservacionesSection = () => {
    return (
      <div className="space-y-4">
        {/* Información del equipo */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Información del Equipo</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>No. Económico:</strong> #{mantenimiento.montacargas_numero}</div>
            <div><strong>Marca:</strong> {mantenimiento.montacargas_marca}</div>
            <div><strong>Modelo:</strong> {mantenimiento.montacargas_modelo}</div>
            <div><strong>Serie:</strong> {mantenimiento.montacargas_serie}</div>
            <div><strong>Ubicación:</strong> {mantenimiento.montacargas_ubicacion}</div>
            <div><strong>Planta:</strong> {mantenimiento.montacargas_planta}</div>
          </div>
        </div>

        {/* Partes faltantes y golpes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block font-medium text-gray-800 mb-2">39. Partes o piezas faltantes</label>
            <div className="flex space-x-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="partesFaltantes"
                  value="No"
                  checked={checklistData[39] === "No"}
                  onChange={() => handleCheckboxChange(39, "No")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">No</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="partesFaltantes"
                  value="Si"
                  checked={checklistData[39] === "Si"}
                  onChange={() => handleCheckboxChange(39, "Si")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Sí</span>
              </label>
            </div>
            <textarea
              value={partesFaltantes}
              onChange={(e) => setPartesFaltantes(e.target.value)}
              placeholder="Especificar cuáles..."
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows="3"
            />
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block font-medium text-gray-800 mb-2">82. Golpes en la unidad</label>
            <div className="flex space-x-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="golpesUnidad"
                  value="No"
                  checked={checklistData[82] === "No"}
                  onChange={() => handleCheckboxChange(82, "No")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">No</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="golpesUnidad"
                  value="Si"
                  checked={checklistData[82] === "Si"}
                  onChange={() => handleCheckboxChange(82, "Si")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Sí</span>
              </label>
            </div>
            <textarea
              value={golpesUnidad}
              onChange={(e) => setGolpesUnidad(e.target.value)}
              placeholder="Especificar dónde..."
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows="3"
            />
          </div>
        </div>

        {/* Condiciones de pintura */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <label className="block font-medium text-gray-800 mb-2">83. Condiciones de la pintura</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["Bueno", "Retoque", "Parcial", "General"].map((opcion) => (
              <label key={opcion} className="flex items-center">
                <input
                  type="radio"
                  name="condicionesPintura"
                  value={opcion}
                  checked={condicionesPintura === opcion}
                  onChange={() => setCondicionesPintura(opcion)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">{opcion}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Horas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block font-medium text-gray-800 mb-2">Hora de inicio</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block font-medium text-gray-800 mb-2">84. Hora de término</label>
            <input
              type="time"
              value={horaTermino}
              onChange={(e) => setHoraTermino(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Observaciones y actividades pendientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block font-medium text-gray-800 mb-2">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escriba sus observaciones aquí..."
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows="4"
            />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block font-medium text-gray-800 mb-2">Actividades pendientes</label>
            <textarea
              value={actividadesPendientes}
              onChange={(e) => setActividadesPendientes(e.target.value)}
              placeholder="Actividades que quedaron pendientes..."
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows="4"
            />
          </div>
        </div>

        {/* Firma del técnico */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <label className="block font-medium text-gray-800 mb-2">Firma del Técnico</label>
          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
            <p className="text-gray-600 mb-2">Espacio para firma digital</p>
            <p className="text-sm text-gray-500">Técnico: {tecnico?.nombre || "N/A"}</p>
            <p className="text-sm text-gray-500">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmitChecklist = () => {
    const checklistCompleto = {
      ...checklistData,
      observaciones,
      actividadesPendientes,
      horaInicio,
      horaTermino,
      partesFaltantes,
      golpesUnidad,
      condicionesPintura,
      tecnico: tecnico?.nombre,
      fecha: new Date().toISOString(),
      mantenimientoId: mantenimiento.id
    };

    onCompletarChecklist(checklistCompleto);
  };

  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Checklist de Mantenimiento</h2>
          <span className="bg-blue-800 px-3 py-1 rounded-full text-sm">
            #{mantenimiento.montacargas_numero}
          </span>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          {mantenimiento.montacargas_marca} {mantenimiento.montacargas_modelo} - {mantenimiento.tipo}
        </p>
        
        {/* Progress bar */}
        <div className="mt-3 bg-blue-700 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-blue-200 mt-1">
          <span>Progreso</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex overflow-x-auto pb-2 space-x-2">
          {sections.map((section, index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                currentSection === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {currentSection < sections.length - 1 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {sections[currentSection].title}
            </h3>
            {renderSpecialItems()}
          </div>
        ) : (
          renderObservacionesSection()
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bg-gray-50 p-4 border-t rounded-b-2xl">
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className={`px-6 py-3 rounded-lg font-medium ${
              currentSection === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Anterior
          </button>

          {currentSection < sections.length - 1 ? (
            <button
              onClick={() => setCurrentSection(currentSection + 1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmitChecklist}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Completar Checklist
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// BLOQUE 1.9: Panel de Checklists Completados - MEJORADO
const ChecklistsCompletadosPanel = ({ checklists, loading, error }) => {
  const [checklistDetalle, setChecklistDetalle] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // FUNCIÓN DE TRADUCCIÓN MEJORADA
  const obtenerDescripcionIncidencia = (codigo, valor) => {
    const descripciones = {
      // Mediciones de llantas
      '50_FD': { 
        titulo: 'Medición de llanta delantera derecha fuera de rango', 
        detalle: `Valor medido: ${valor} mm (debe estar entre 10-20 mm)` 
      },
      '50_FI': { 
        titulo: 'Medición de llanta delantera izquierda fuera de rango', 
        detalle: `Valor medido: ${valor} mm (debe estar entre 10-20 mm)` 
      },
      '50_TD': { 
        titulo: 'Medición de llanta trasera derecha fuera de rango', 
        detalle: `Valor medido: ${valor} mm (debe estar entre 10-20 mm)` 
      },
      '50_TI': { 
        titulo: 'Medición de llanta trasera izquierda fuera de rango', 
        detalle: `Valor medido: ${valor} mm (debe estar entre 10-20 mm)` 
      },
      
      // Estados de componentes que necesitan reemplazo
      '2': { titulo: 'Alarma de reversa - Requiere reemplazo' },
      '3': { titulo: 'Claxón - Requiere reemplazo' },
      '4': { titulo: 'Extintor o base - Requiere reemplazo' },
      '10': { titulo: 'Tapas de masas de llantas traseras - Requiere reemplazo' },
      '11': { titulo: 'Tornillos de parrilla y barra - Requieren reemplazo' },
      '15': { titulo: 'Pistón del cofre - Requiere reemplazo' },
      '17': { titulo: 'Tapete y piso - Requieren reemplazo' },
      '19': { titulo: 'Terminales, bornes o protector de batería - Requieren reemplazo' },
      '21': { titulo: 'Batería - Requiere reemplazo' },
      '27': { titulo: 'Caja de fusibles o fusibles - Requieren reemplazo' },
      '33': { titulo: 'Fugas en líneas de gas detectadas' },
      '35': { titulo: 'Sistema de luces - Requiere reemplazo' },
      '54': { titulo: 'Muelas del carro desplazador - Requieren reemplazo' },
      '55': { titulo: 'Cuchillas - Requieren reemplazo' },
      '56': { titulo: 'Empaque del cofre - Requiere reemplazo' },
      '61': { titulo: 'Seguro o válvulas de tanque de gas - Requieren reemplazo' },
      '64': { titulo: 'Filtro hidráulico - Requiere reemplazo' },
      '65': { titulo: 'Filtro de aire - Requiere reemplazo' },
      '66': { titulo: 'Aceite de diferencial - Nivel incorrecto' },
      '67': { titulo: 'Bujías de motor - Requieren reemplazo' },
      '70': { titulo: 'Juego en ruedas o balatas - Requiere ajuste/reemplazo' },
      '72': { titulo: 'Banda o bomba de agua - Requieren reemplazo' },
      '75': { titulo: 'Válvula de gas o línea principal - Requieren atención' },
      '78': { titulo: 'Retrovisores - Requieren reemplazo' },
      
      // Respuestas Sí/No
      '39': { titulo: 'Partes o piezas faltantes identificadas' },
      '82': { titulo: 'Golpes en la unidad identificados' },
      
      // Valores booleanos (false)
      'false': { titulo: 'Actividad no efectuada o pendiente' }
    };

    // Si es un número simple (sin sufijo)
    if (descripciones[codigo]) {
      return descripciones[codigo];
    }

    // Si es un valor "Si"
    if (valor === "Si") {
      return { 
        titulo: `Item ${codigo} - Requiere atención`, 
        detalle: 'Se reportó una incidencia en este punto del checklist' 
      };
    }

    // Si es un valor "Reemplazo"
    if (valor === "Reemplazo") {
      return { 
        titulo: `Item ${codigo} - Necesita reemplazo`, 
        detalle: 'El componente requiere ser reemplazado' 
      };
    }

    // Por defecto
    return { 
      titulo: `Incidencia en item ${codigo}`, 
      detalle: `Valor reportado: ${valor}` 
    };
  };

  const verDetalleChecklist = (checklist) => {
    setChecklistDetalle(checklist);
  };

  return (
    <div className="p-4 md:p-8 bg-white rounded-2xl shadow-lg w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Checklists Completados</h2>
      <p className="text-gray-600 mb-6">Total de checklists: {checklists.length}</p>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando checklists...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          {checklists.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">MONTACARGAS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">TÉCNICO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">FECHA COMPLETADO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">OBSERVACIONES</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checklists.map((checklist) => (
                  <tr key={checklist.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          #{checklist.montacargas_numero}
                        </div>
                        <div>
                          <strong>#{checklist.montacargas_numero}</strong>
                          <div className="text-sm text-gray-600">{checklist.montacargas_marca} {checklist.montacargas_modelo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {checklist.tecnico_nombre}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(checklist.creado_en)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {checklist.observaciones ? (
                        <span className="line-clamp-2">{checklist.observaciones}</span>
                      ) : (
                        <span className="text-gray-400">Sin observaciones</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => verDetalleChecklist(checklist)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay checklists completados.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE DETALLE MEJORADO */}
      {checklistDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Detalle del Checklist</h3>
              <button
                onClick={() => setChecklistDetalle(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Información del Equipo</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>No. Económico:</strong> #{checklistDetalle.montacargas_numero}</p>
                  <p><strong>Marca/Modelo:</strong> {checklistDetalle.montacargas_marca} {checklistDetalle.montacargas_modelo}</p>
                  <p><strong>Serie:</strong> {checklistDetalle.montacargas_serie}</p>
                  <p><strong>Ubicación:</strong> {checklistDetalle.montacargas_ubicacion}</p>
                  <p><strong>Planta:</strong> {checklistDetalle.montacargas_planta}</p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Información del Servicio</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Técnico:</strong> {checklistDetalle.tecnico_nombre}</p>
                  <p><strong>Fecha:</strong> {formatDate(checklistDetalle.creado_en)}</p>
                  <p><strong>Horario:</strong> {checklistDetalle.hora_inicio} - {checklistDetalle.hora_termino}</p>
                  <p><strong>Tipo de Mantenimiento:</strong> {checklistDetalle.tipo_mantenimiento}</p>
                </div>
              </div>
            </div>

            {checklistDetalle.observaciones && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Observaciones Generales</h4>
                <p className="bg-gray-50 p-3 rounded border border-gray-200">{checklistDetalle.observaciones}</p>
              </div>
            )}

            {checklistDetalle.actividades_pendientes && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Actividades Pendientes</h4>
                <p className="bg-yellow-50 p-3 rounded border border-yellow-200">{checklistDetalle.actividades_pendientes}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {checklistDetalle.partes_faltantes && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-1">Partes Faltantes</h4>
                  <p className="text-sm">{checklistDetalle.partes_faltantes}</p>
                </div>
              )}
              
              {checklistDetalle.golpes_unidad && (
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-1">Golpes en Unidad</h4>
                  <p className="text-sm">{checklistDetalle.golpes_unidad}</p>
                </div>
              )}
              
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-1">Condiciones de Pintura</h4>
                <p className="text-sm">{checklistDetalle.condiciones_pintura}</p>
              </div>
            </div>

            {/* SECCIÓN DE INCIDENCIAS MEJORADA */}
            {checklistDetalle.respuestas_incidencias && Object.keys(checklistDetalle.respuestas_incidencias).length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-3 text-red-700">📋 Incidencias Detectadas ({Object.keys(checklistDetalle.respuestas_incidencias).length})</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {Object.entries(checklistDetalle.respuestas_incidencias).map(([key, value]) => {
                      const descripcion = obtenerDescripcionIncidencia(key, value);
                      return (
                        <div key={key} className="flex items-start space-x-3 p-3 bg-white rounded border border-red-100">
                          <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                            ⚠️
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-red-800">{descripcion.titulo}</p>
                            {descripcion.detalle && (
                              <p className="text-sm text-red-600 mt-1">{descripcion.detalle}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Código: {key}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setChecklistDetalle(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// BLOQUE 2: Componente Principal Perfil - CORREGIDO
const Perfil = () => {

  const [userData, setUserData] = useState(null);
  const [checklistsCompletados, setChecklistsCompletados] = useState([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);
  const [errorChecklists, setErrorChecklists] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [redirecting, setRedirecting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [success, setSuccess] = useState("");

  const [mantenimientosMes, setMantenimientosMes] = useState([]);
  const [loadingMantenimientos, setLoadingMantenimientos] = useState(false);
  const [errorMantenimientos, setErrorMantenimientos] = useState("");
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());

  const [tecnicos, setTecnicos] = useState([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [errorTecnicos, setErrorTecnicos] = useState("");

  const [misMantenimientos, setMisMantenimientos] = useState([]);
  const [loadingMisMantenimientos, setLoadingMisMantenimientos] = useState(false);
  const [errorMisMantenimientos, setErrorMisMantenimientos] = useState("");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState("");

  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);

  const [uiState, setUiState] = useState({
    loading: false,
    error: '',
    success: '',
    updatingId: null,
    isMounted: true
  });

  const isAdmin = userData?.rol === "admin";
  const isTecnico = userData?.rol === "user";

  useEffect(() => {
    return () => {
      setUiState(prev => ({ ...prev, isMounted: false }));
    };
  }, []);

  const setSafeState = (setter, newState) => {
    if (uiState.isMounted) {
      setter(newState);
    }
  };

  const manejarChecklistCompletado = async (checklistData) => {
  try {
    console.log('Checklist completado - Datos recibidos:', checklistData);

    // 1. Filtrar SOLO las incidencias (no "Bueno" ni "Efectuado")
    const respuestasIncidencias = {};
    
    Object.entries(checklistData).forEach(([key, value]) => {
      // Solo guardar si es una incidencia (Reemplazo, Si, false, o mediciones)
      const esIncidencia = 
        value === "Reemplazo" || 
        value === "Si" || 
        value === false ||
        (typeof value === 'string' && value.includes('mm')) ||
        key.includes('_FD') || key.includes('_FI') || key.includes('_TD') || key.includes('_TI');
      
      if (esIncidencia && value !== undefined && value !== null) {
        respuestasIncidencias[key] = value;
      }
    });

    console.log('Incidencias filtradas:', respuestasIncidencias);

    // 2. Preparar datos para enviar al backend
    const datosEnvio = {
      status: 'completado',
      tecnico_id: userData?.id,
      tecnico_nombre: userData?.nombre,
      // Datos del checklist
      hora_inicio: checklistData.horaInicio,
      hora_termino: checklistData.horaTermino,
      observaciones: checklistData.observaciones,
      actividades_pendientes: checklistData.actividadesPendientes,
      partes_faltantes: checklistData.partesFaltantes,
      golpes_unidad: checklistData.golpesUnidad,
      condiciones_pintura: checklistData.condicionesPintura,
      respuestas_incidencias: Object.keys(respuestasIncidencias).length > 0 ? respuestasIncidencias : null
    };

    console.log('Datos a enviar al backend:', datosEnvio);

    // 3. Llamar a la API
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/mantenimientos/${checklistData.mantenimientoId}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosEnvio)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Respuesta del servidor:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Error al guardar el checklist');
    }

    // 4. Actualizar estado local
    setMisMantenimientos(prev => 
      prev.map(m => 
        m.id === checklistData.mantenimientoId 
          ? { 
              ...m, 
              status: 'completado', 
              completado_en: new Date().toISOString(),
              tecnico_id: userData?.id,
              tecnico_nombre: userData?.nombre,
              observaciones: checklistData.observaciones
            }
          : m
      )
    );
    
    setSuccess('Checklist completado y guardado correctamente');
    setTimeout(() => setSuccess(''), 5000);
    
    // 5. Cerrar modal
    setMostrarChecklist(false);
    setMantenimientoSeleccionado(null);
    
  } catch (err) {
    console.error('Error al completar checklist:', err);
    setErrorMisMantenimientos(err.message || 'Error al guardar checklist');
    setTimeout(() => setErrorMisMantenimientos(''), 5000);
  }
};

  const marcarComoCompletado = async (mantenimientoId) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      console.log('Marcando mantenimiento como completado:', mantenimientoId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/mantenimientos/${mantenimientoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completado',
          tecnico_id: userData?.id,
          tecnico_nombre: userData?.nombre,
          observaciones: 'Mantenimiento completado exitosamente'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Error al completar el mantenimiento');
      }
    } catch (err) {
      console.error('Error marcando mantenimiento como completado:', err);
      throw err;
    }
  };

  // BLOQUE 3: Fetch de datos de usuario
const fetchUserData = useCallback(async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    
    if (!token || token === "null") {
      console.error("❌ No hay token válido en localStorage");
      setIsLoggedIn(false);
      setLoading(false);
      setShouldRedirect(true);
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    console.log("Datos de /auth/me:", data);

    if (response.ok) {
      setUserData(data);
      setIsLoggedIn(true);
      localStorage.setItem("user", JSON.stringify(data));
      setActiveTab("perfil");
    } else {
      console.error("Token inválido o expirado");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setShouldRedirect(true);
    }
  } catch (err) {
    console.error("Error fetching /auth/me:", err);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setShouldRedirect(true);
  } finally {
    setLoading(false);
  }
}, []);

// BLOQUE 4: Logout
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setRedirecting(true);
  setTimeout(() => {
    window.location.href = "/";
  }, 1500);
};

// BLOQUE 5: useEffect cargar datos
useEffect(() => {
  fetchUserData();
}, [fetchUserData]);

// BLOQUE 6: Redirección si no hay login
useEffect(() => {
  if (shouldRedirect) {
    window.location.href = "/";
  }
}, [shouldRedirect]);

// BLOQUE 7: Fetch de usuarios (solo admin)
const fetchUsers = useCallback(async () => {
  if (!isAdmin) return;

  setLoadingUsers(true);
  setErrorUsers("");

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setUsers(data.users || []);
    } else {
      setErrorUsers(data.error || "Error al cargar usuarios");
    }
  } catch (err) {
    console.error("Error fetching users:", err);
    setErrorUsers("Error de conexión");
  } finally {
    setLoadingUsers(false);
  }
}, [isAdmin]);

// BLOQUE 7.5: Fetch de mantenimientos del mes (solo admin)
const fetchMantenimientosMes = useCallback(async () => {
  if (!isAdmin) return;

  setLoadingMantenimientos(true);
  setErrorMantenimientos("");

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/mantenimientos-mes-actual`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setMantenimientosMes(data.mantenimientos || []);
      setMesActual(data.mes);
      setAnioActual(data.anio);
    } else {
      setErrorMantenimientos(data.error || "Error al cargar mantenimientos del mes");
    }
  } catch (err) {
    console.error("Error fetching mantenimientos del mes:", err);
    setErrorMantenimientos("Error de conexión al cargar mantenimientos");
  } finally {
    setLoadingMantenimientos(false);
  }
}, [isAdmin]);

// BLOQUE 7.6: Fetch de técnicos (solo admin)
const fetchTecnicos = useCallback(async () => {
  if (!isAdmin) return;

  setLoadingTecnicos(true);
  setErrorTecnicos("");

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/tecnicos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setTecnicos(data.tecnicos || []);
    } else {
      setErrorTecnicos(data.error || "Error al cargar técnicos");
    }
  } catch (err) {
    console.error("Error fetching técnicos:", err);
    setErrorTecnicos("Error de conexión al cargar técnicos");
  } finally {
    setLoadingTecnicos(false);
  }
}, [isAdmin]);

// BLOQUE 7.7: Asignar técnico a mantenimiento
const handleAsignarTecnico = async (mantenimientoId, tecnicoId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/asignar-tecnico`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mantenimientoId, tecnicoId }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      fetchMantenimientosMes();
      setSuccess("Técnico asignado correctamente. Se envió notificación por correo.");
      setTimeout(() => setSuccess(""), 5000);
    } else {
      setErrorMantenimientos(data.error || "Error al asignar técnico");
    }
  } catch (err) {
    console.error("Error asignando técnico:", err);
    setErrorMantenimientos("Error de conexión al asignar técnico");
  }
};

// BLOQUE 7.8: Fetch de mis mantenimientos (para técnicos)
const fetchMisMantenimientos = useCallback(async () => {
  setLoadingMisMantenimientos(true);
  setErrorMisMantenimientos("");

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/mis-mantenimientos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setMisMantenimientos(data.mantenimientos || []);
    } else {
      setErrorMisMantenimientos(data.error || "No tienes mantenimientos asignados");
    }
  } catch (err) {
    console.error("Error fetching mis mantenimientos:", err);
    setErrorMisMantenimientos("Error de conexión");
  } finally {
    setLoadingMisMantenimientos(false);
  }
}, []);

useEffect(() => {
  if (activeTab === "admin-panel" && isAdmin) {
    fetchUsers();
  }
}, [activeTab, isAdmin, fetchUsers]);

useEffect(() => {
  if (activeTab === "mantenimientos-mes" && isAdmin) {
    fetchMantenimientosMes();
  }
}, [activeTab, isAdmin, fetchMantenimientosMes]);

useEffect(() => {
  if (activeTab === "asignacion-tecnicos" && isAdmin) {
    fetchMantenimientosMes();
    fetchTecnicos();
  }
}, [activeTab, isAdmin, fetchMantenimientosMes, fetchTecnicos]);

useEffect(() => {
  if (activeTab === "mis-mantenimientos" && isTecnico) {
    fetchMisMantenimientos();
  }
}, [activeTab, isTecnico, fetchMisMantenimientos]);

// BLOQUE 7.9: Función para cargar checklists completados (para admin)
const fetchChecklistsCompletados = useCallback(async () => {
  if (!isAdmin) return;

  setLoadingChecklists(true);
  setErrorChecklists("");

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/mantenimientos/checklists/completados`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setChecklistsCompletados(data.checklists || []);
    } else {
      setErrorChecklists(data.error || "Error al cargar checklists");
    }
  } catch (err) {
    console.error("Error fetching checklists:", err);
    setErrorChecklists("Error de conexión al cargar checklists");
  } finally {
    setLoadingChecklists(false);
  }
}, [isAdmin]);

// BLOQUE 7.10: Cargar checklists cuando se active la pestaña
useEffect(() => {
  if (activeTab === "checklists-completados" && isAdmin) {
    fetchChecklistsCompletados();
  }
}, [activeTab, isAdmin, fetchChecklistsCompletados]);

// BLOQUE 8: Renderizado de carga/redirección
if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cargando...</h2>
        <p className="text-gray-500 mb-6">Cargando información del perfil.</p>
      </div>
    </div>
  );
}

if (redirecting) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cerrando sesión...</h2>
        <p className="text-gray-500 mb-6">Redirigiendo al inicio.</p>
      </div>
    </div>
  );
}

if (shouldRedirect) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Redirigiendo...</h2>
        <p className="text-gray-500 mb-6">Serás redirigido al inicio.</p>
      </div>
    </div>
  );
}

// BLOQUE 9: Return UI principal
return (
  <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
    {/* Mobile Menu Button */}
    <div className="md:hidden bg-slate-900 text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Panel de Usuario</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
    </div>

    {/* Mobile Menu */}
    {mobileMenuOpen && (
      <div className="md:hidden bg-slate-800 text-white p-4">
        <nav className="space-y-2">
          <button onClick={() => { setActiveTab("perfil"); setMobileMenuOpen(false); }}
            className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
              activeTab === "perfil" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"
            }`}>
            <span>Mi Perfil</span>
          </button>
          
          {isAdmin && (
            <>
              <button onClick={() => { setActiveTab("admin-panel"); setMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                  activeTab === "admin-panel" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"
                }`}>
                <span>Gestión de Usuarios</span>
              </button>
              
              <button onClick={() => { setActiveTab("asignacion-tecnicos"); setMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                  activeTab === "asignacion-tecnicos" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"
                }`}>
                <span>Asignación de Técnicos</span>
              </button>

              {/* NUEVO BOTÓN PARA CHECKLISTS */}
              <button onClick={() => { setActiveTab("checklists-completados"); setMobileMenuOpen(false); }}
                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                  activeTab === "checklists-completados" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"
                }`}>
                <span>Checklists Completados</span>
              </button>
            </>
          )}
          
          {isTecnico && (
            <button onClick={() => { setActiveTab("mis-mantenimientos"); setMobileMenuOpen(false); }}
              className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                activeTab === "mis-mantenimientos" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"
              }`}>
              <span>Mis Mantenimientos</span>
            </button>
          )}
        </nav>
      </div>
    )}

    {/* Sidebar Desktop */}
    <div className="hidden md:flex flex-col bg-slate-900 text-white w-64 p-6 shadow-xl">
      <h1 className="text-xl font-bold mb-8">Panel de Usuario</h1>
      <nav className="flex-1 space-y-4">
        <button onClick={() => setActiveTab("perfil")}
          className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
            activeTab === "perfil" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
          }`}>
          <span>Mi Perfil</span>
        </button>
        
        {isAdmin && (
          <>
            <button onClick={() => setActiveTab("admin-panel")}
              className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                activeTab === "admin-panel" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
              }`}>
              <span>Gestión de Usuarios</span>
            </button>
            
            <button onClick={() => setActiveTab("asignacion-tecnicos")}
              className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                activeTab === "asignacion-tecnicos" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
              }`}>
              <span>Asignación de Técnicos</span>
            </button>

            {/* NUEVO BOTÓN PARA CHECKLISTS */}
            <button onClick={() => setActiveTab("checklists-completados")}
              className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                activeTab === "checklists-completados" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
              }`}>
              <span>Checklists Completados</span>
            </button>
          </>
        )}
        
        {isTecnico && (
          <button onClick={() => setActiveTab("mis-mantenimientos")}
            className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
              activeTab === "mis-mantenimientos" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
            }`}>
            <span>Mis Mantenimientos</span>
          </button>
        )}
      </nav>
    </div>

    {/* Contenido Principal */}
    <main className="flex-1 p-4 md:p-6">
      {/* Mensajes de éxito y error */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {/* ACTUALIZADO: Incluir errorChecklists */}
      {(errorMantenimientos || errorTecnicos || errorUsers || errorMisMantenimientos || errorChecklists) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMantenimientos || errorTecnicos || errorUsers || errorMisMantenimientos || errorChecklists}
        </div>
      )}

      {/* Contenido según el tipo de usuario y pestaña activa */}
      {isTecnico ? (
        // USUARIO TÉCNICO
        activeTab === "mis-mantenimientos" ? (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Mis Mantenimientos Asignados</h1>
            <PanelTecnico 
              mantenimientos={misMantenimientos}
              loading={loadingMisMantenimientos}
              error={errorMisMantenimientos}
              tecnico={userData}
              onAbrirChecklist={(mantenimiento) => {
                setMantenimientoSeleccionado(mantenimiento);
                setMostrarChecklist(true);
              }}
              onMarcarCompletado={async (mantenimientoId) => {
                try {
                  await marcarComoCompletado(mantenimientoId);
                  setMisMantenimientos(prev => 
                    prev.map(m => 
                      m.id === mantenimientoId 
                        ? { 
                            ...m, 
                            status: 'completado', 
                            completado_en: new Date().toISOString(),
                            tecnico_id: userData?.id,
                            tecnico_nombre: userData?.nombre
                          }
                        : m
                    )
                  );
                  setSuccess('Mantenimiento marcado como completado correctamente');
                  setTimeout(() => setSuccess(''), 3000);
                } catch (err) {
                  console.error('Error en onMarcarCompletado:', err);
                  setErrorMisMantenimientos(err.message || 'Error al completar mantenimiento');
                  setTimeout(() => setErrorMisMantenimientos(''), 5000);
                }
              }}
            />
          </div>
        ) : (
          // Perfil normal del técnico
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
              
              <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mx-auto mb-4">
                {userData?.nombre ? userData.nombre.charAt(0).toUpperCase() : "U"}
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">{userData?.nombre || "Usuario"}</h2>
              <p className="text-gray-600 mb-4">{userData?.email}</p>
              
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Técnico
                </span>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )
      ) : isAdmin ? (
        // ADMINISTRADOR
        <>
          {activeTab === "perfil" ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
                
                <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mx-auto mb-4">
                  {userData?.nombre ? userData.nombre.charAt(0).toUpperCase() : "U"}
                </div>
                
                <h2 className="text-xl font-bold text-gray-800 mb-2">{userData?.nombre || "Usuario"}</h2>
                <p className="text-gray-600 mb-4">{userData?.email}</p>
                
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Administrador
                  </span>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : activeTab === "admin-panel" ? (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios</h1>
              <AdminPanel users={users} loading={loadingUsers} error={errorUsers} />
            </div>
          
          ) : activeTab === "asignacion-tecnicos" ? (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Asignación de Técnicos</h1>
              <AsignacionTecnicosPanel 
                mantenimientos={mantenimientosMes}
                tecnicos={tecnicos}
                loading={loadingMantenimientos || loadingTecnicos}
                error={errorMantenimientos || errorTecnicos}
                mes={mesActual}
                anio={anioActual}
                onAsignarTecnico={handleAsignarTecnico}
              />
            </div>

          ) : activeTab === "checklists-completados" ? (
            // NUEVO PANEL PARA CHECKLISTS COMPLETADOS
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Checklists Completados</h1>
              <ChecklistsCompletadosPanel 
                checklists={checklistsCompletados}
                loading={loadingChecklists}
                error={errorChecklists}
              />
            </div>
          ) : null}
        </>
      ) : (
        // USUARIO NORMAL (no admin, no técnico)
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
            
            <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mx-auto mb-4">
              {userData?.nombre ? userData.nombre.charAt(0).toUpperCase() : "U"}
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-2">{userData?.nombre || "Usuario"}</h2>
            <p className="text-gray-600 mb-4">{userData?.email}</p>
            
            <div className="mb-6"> 
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Usuario
              </span>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </main>

    {/* MODAL DEL CHECKLIST MÓVIL */}
    {mostrarChecklist && mantenimientoSeleccionado && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <ChecklistMovil 
            mantenimiento={mantenimientoSeleccionado}
            tecnico={userData}
            onCompletarChecklist={manejarChecklistCompletado}
          />
          <button
            onClick={() => {
              setMostrarChecklist(false);
              setMantenimientoSeleccionado(null);
            }}
            className="mt-4 w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700"
          >
            Cerrar Checklist
          </button>
        </div>
      </div>
    )}
  </div> 
);
};

export default Perfil;