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

// BLOQUE 1.7: Panel de Técnico (ACTUALIZADO con manejo mejorado de estado)
const PanelTecnico = ({ 
  mantenimientos, 
  loading, 
  error, 
  tecnico, 
  onDescargarChecklist,
  onMarcarCompletado 
}) => {
  const [completando, setCompletando] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [localMantenimientos, setLocalMantenimientos] = useState(mantenimientos);

  // Sincronizar con los mantenimientos prop
  useEffect(() => {
    setLocalMantenimientos(mantenimientos);
  }, [mantenimientos]);

  // Efecto para limpiar estado al desmontar
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

  // Manejo mejorado de eventos táctiles
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e, callback, ...args) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Solo ejecutar si no fue un deslizamiento significativo
    if (Math.abs(diff) < 10) {
      callback(...args);
    }
    
    setTouchStart(null);
  };

  // Función mejorada para marcar completado
  const handleMarcarCompletado = async (mantenimientoId) => {
    if (completando) return;
    
    setCompletando(mantenimientoId);
    
    try {
      // Actualización optimista del estado local
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

      // Pequeño delay para permitir que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Llamar a la función principal
      await onMarcarCompletado(mantenimientoId);
      
    } catch (error) {
      console.error('Error en handleMarcarCompletado:', error);
      
      // Revertir la actualización optimista en caso de error
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
      // Delay más largo para evitar conflictos de renderizado
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
                  <button 
                    onClick={() => onDescargarChecklist(mantenimiento)}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded text-sm font-medium hover:bg-green-700 flex items-center justify-center transition-colors"
                    style={{ 
                      minHeight: '44px',
                      touchAction: 'manipulation'
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Checklist
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


// BLOQUE 2: Componente Principal Perfil
const Perfil = () => {
  // Estados principales
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [redirecting, setRedirecting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [success, setSuccess] = useState("");

  // Estados para mantenimientos
  const [mantenimientosMes, setMantenimientosMes] = useState([]);
  const [loadingMantenimientos, setLoadingMantenimientos] = useState(false);
  const [errorMantenimientos, setErrorMantenimientos] = useState("");
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());

  // Estados para técnicos
  const [tecnicos, setTecnicos] = useState([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [errorTecnicos, setErrorTecnicos] = useState("");

  // Estados para panel de técnico
  const [misMantenimientos, setMisMantenimientos] = useState([]);
  const [loadingMisMantenimientos, setLoadingMisMantenimientos] = useState(false);
  const [errorMisMantenimientos, setErrorMisMantenimientos] = useState("");

  // Estados para admin
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState("");

  // NUEVO: Estado para manejo seguro de UI
  const [uiState, setUiState] = useState({
    loading: false,
    error: '',
    success: '',
    updatingId: null,
    isMounted: true
  });

  const isAdmin = userData?.rol === "admin";
  const isTecnico = userData?.rol === "user";

  // NUEVO: Effect para manejar desmontaje seguro
  useEffect(() => {
    return () => {
      setUiState(prev => ({ ...prev, isMounted: false }));
    };
  }, []);

  // NUEVO: Función para actualizaciones seguras de estado
  const setSafeState = (setter, newState) => {
    if (uiState.isMounted) {
      setter(newState);
    }
  };

  // === AGREGAR ESTAS DOS FUNCIONES DENTRO DEL COMPONENTE PERFIL ===

  // Función auxiliar para obtener descripciones del checklist
  const getDescripcionChecklist = (numero) => {
  const descripciones = {
    1: "Revision visual de ruedas, chasis, mastil, etc.",
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
    22: "Revision de nivel de líquido de frenos",
    23: "Revisar tornillo de contrapeso",
    24: "Drenar aceite de motor y quitar filtro",
    25: "Resmplace filtro yaceite de trasmision cuando aplique",
    26: "Revisar conectrores del sistema de gs",
    27: "Revisar tapa(s) de caja(s) de fusibles y fusibles",
    28: "Cambiar cables y bujías de motor",
    29: "Cambiar tapa de distribuidor y rotor cuando aplique",
    30: "Revisar de arnés eléctricos grapas y/o bases de sujeción",
    31: "Colocar filtro y aceite de motor",
    32: "Colocar tapa lateral izquierda",
    33: "Revisar fugas en lineas de gas utilizando swipe",
    34: "Cerrar cofre y colocar tapa de radiador",
    35: "Revisar luces: Traseras: Buenas □ Reemplazo □ Reversa: Buena □ Reemplazo □ Delanteras: Buenas □ Reemplazo □ Torreta: Buena □ Reemplazo □",
    36: "Sopletear equipo en general",
    37: "Colocar tapete y piso",
    38: "Recoger material de desecho (filtros, aceite usado y trapos)",
    39: "Partes o piezas faltantes:",
    40: "Revision de nivel de aceite hidraulico agregar si es necesario",
    41: "Asegurar que no se encuentre con fugas el equipo",
    42: "Revisar switch de arranque",
    43: "Revisar switch de asiento",
    44: "Revisar y accionar palanca de cambios",
    45: "Revisar estado de cinturón de seguridad",
    46: "Revisar ajuste de freno de estacionamiento",
    47: "Revisar asiento y su riel",
    48: "Accionar inclinación y retracción de mástil",
    49: "Subir mástil, girar volante derecha e izquierda (identificar anomalias)",
    50: "Medir altura de llantas (mm) FD________ FI________ TD________TI________",
    51: "Asegurar ajuste demuelas del carro en mastil",
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
    66: "Revisar nivel de aceite de diferecial",
    67: "Cambair bujias de motor",
    68: "Revisar ajuste de cadenas",
    69: "Lubricar cadenas",
    70: "Revisar juego en ruedas y balatas",
    71: "engrasar cruceta cuando aplique",
    72: "Revisar estado de banda y bomba de agua",
    73: "Revisar fugas de aceite ó fluidos en el motor",
    74: "Colocar tapa lateral derecha",
    75: "Abrir válvula de gas y revisar línea principal",
    76: "Revisar ajuste de pedales (Neutralizador,freno, acelerador)",
    77: "Cerrar cofre y colocar tapa de radiador",
    78: "Revisar y limpiar retrovisores",
    79: "Realizar limpieza general de la unidad",
    80: "Lubricar y engrasar todos los pntos de movimiento",
    81: "Revision y engrasado de eje de direccion",
    82: "Golpes en la unidad:",
    83: "Revisar condiciones de la pintura",
    84: "Hora en la que se terminó el servicio:_______________________"
  };
  
  return descripciones[numero] || `Revisión ${numero}`;
};

  // Función para generar el documento Word de checklist de mantenimiento
  const generarChecklistWord = (mantenimiento) => {
  // Crear contenido HTML con el formato específico similar al Excel
  const contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Checklist Mantenimiento Montacargas #${mantenimiento.montacargas_numero}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 10px; 
          font-size: 10pt;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        td { 
          border: 1px solid black; 
          padding: 4px; 
          vertical-align: top;
        }
        .header-table {
          margin-bottom: 15px;
        }
        .header-table td {
          border: none;
          padding: 2px 5px;
        }
        .check-column {
          width: 20px;
          text-align: center;
        }
        .desc-column {
          width: 65%;
        }
        .status-column {
          width: 30%;
        }
        .section-title {
          background-color: #f0f0f0;
          font-weight: bold;
          padding: 5px;
        }
        .checkbox {
          font-family: "Segoe UI Symbol";
        }
      </style>
    </head>
    <body>
      
      <!-- Información del encabezado -->
      <table class="header-table">
        <tr>
          <td><strong>No. Económico:</strong></td>
          <td>${mantenimiento.montacargas_numero || ''}</td>
          <td><strong>Fecha:</strong></td>
          <td>${new Date().toLocaleDateString('es-ES')}</td>
          <td><strong>Cliente:</strong></td>
          <td>${mantenimiento.montacargas_ubicacion || 'N/A'}</td>
          <td><strong>FOLIO:</strong></td>
          <td>${mantenimiento.id || ''}</td>
        </tr>
        <tr>
          <td><strong>Marca:</strong></td>
          <td>${mantenimiento.montacargas_marca || ''}</td>
          <td></td>
          <td><strong>Equipo de:</strong></td>
          <td>Renta</td>
          <td><strong>Planta:</strong></td>
          <td>${mantenimiento.montacargas_planta || 'N/A'}</td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Modelo:</strong></td>
          <td>${mantenimiento.montacargas_modelo || ''}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td><strong>Hora de inicio:</strong></td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Serie:</strong></td>
          <td>${mantenimiento.montacargas_serie || ''}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td><strong>Hora de termino:</strong></td>
          <td></td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td><strong>Tiempo de reparaciones:</strong></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td><strong>Tiempo utilizado:</strong></td>
          <td></td>
          <td></td>
        </tr>
      </table>

      <h2>Checklist de Mantenimiento - ${mantenimiento.tipo}</h2>
      
      <!-- Tabla de checklist en dos columnas -->
      <table>
        ${Array.from({length: 41}, (_, i) => {
          const num = i + 1;
          const num2 = i + 42;
          
          // Solo mostrar filas hasta el número 41 en la primera columna
          if (num <= 41) {
            return `
              <tr>
                <!-- Primera columna -->
                <td class="desc-column">${num}. ${getDescripcionChecklist(num)}</td>
                <td class="check-column">${num === 2 || num === 3 || num === 4 || num === 10 || num === 11 || num === 15 || num === 17 || num === 19 || num === 21 || num === 27 || num === 33 || num === 35 ? 'Bueno □ Reemplazo □' : ''}</td>
                <td class="check-column">${num === 1 || num === 5 || num === 6 || num === 7 || num === 8 || num === 9 || num === 12 || num === 13 || num === 14 || num === 16 || num === 18 || num === 20 || num === 22 || num === 23 || num === 24 || num === 25 || num === 26 || num === 28 || num === 29 || num === 30 || num === 31 || num === 32 || num === 34 || num === 36 || num === 37 || num === 38 || num === 40 || num === 41 ? 'Efectuado □' : ''}</td>
                
                <!-- Segunda columna (solo si existe el item) -->
                <td class="desc-column">${num2 <= 83 ? `${num2}. ${getDescripcionChecklist(num2)}` : ''}</td>
                <td class="check-column">${num2 === 42 || num2 === 43 || num2 === 44 || num2 === 45 || num2 === 46 || num2 === 47 || num2 === 48 || num2 === 49 || num2 === 51 || num2 === 52 || num2 === 53 || num2 === 57 || num2 === 58 || num2 === 59 || num2 === 60 || num2 === 62 || num2 === 63 || num2 === 68 || num2 === 69 || num2 === 76 || num2 === 77 || num2 === 79 || num2 === 80 || num2 === 81 ? 'Efectuado □' : ''}</td>
                <td class="check-column">${num2 === 54 || num2 === 55 || num2 === 56 || num2 === 61 || num2 === 64 || num2 === 65 || num2 === 66 || num2 === 67 || num2 === 70 || num2 === 72 || num2 === 75 || num2 === 78 ? 'Bueno □ Reemplazo □' : ''}</td>
              </tr>
            `;
          }
          return '';
        }).join('')}
        
        <!-- Fila para "Partes o piezas faltantes" -->
        <tr>
          <td class="desc-column">39. Partes o piezas faltantes:</td>
          <td class="check-column">NO □ SI □</td>
          <td class="check-column"></td>
          <td class="desc-column">82. Golpes en la unidad:</td>
          <td class="check-column">NO □ SI □</td>
          <td class="check-column"></td>
        </tr>
        
        <!-- Fila para "Cuales" -->
        <tr>
          <td class="desc-column">Cuales:</td>
          <td class="check-column"></td>
          <td class="check-column"></td>
          <td class="desc-column">Donde:</td>
          <td class="check-column"></td>
          <td class="check-column"></td>
        </tr>
        
        <!-- Fila para "Revisar condiciones de la pintura" -->
        <tr>
          <td class="desc-column"></td>
          <td class="check-column"></td>
          <td class="check-column"></td>
          <td class="desc-column">83. Revisar condiciones de la pintura:</td>
          <td class="check-column">Retoque □ Parcial □ General □ Bueno □</td>
          <td class="check-column"></td>
        </tr>
        
        <!-- Fila para "Hora en la que se terminó el servicio" -->
        <tr>
          <td class="desc-column"></td>
          <td class="check-column"></td>
          <td class="check-column"></td>
          <td class="desc-column">84. Hora en la que se terminó el servicio:</td>
          <td class="check-column"></td>
          <td class="check-column"></td>
        </tr>
      </table>

      <!-- Observaciones y actividades pendientes -->
      <table style="margin-top: 20px;">
        <tr>
          <td style="width: 50%;"><strong>Observaciones:</strong></td>
          <td style="width: 50%;"><strong>Actividades pendientes:</strong></td>
        </tr>
        <tr>
          <td style="height: 80px; vertical-align: top;"></td>
          <td style="height: 80px; vertical-align: top;"></td>
        </tr>
      </table>

      <div style="margin-top: 30px;">
        <p><strong>Técnico asignado:</strong> ${userData?.nombre || 'N/A'}</p>
        <p><strong>Fecha de mantenimiento:</strong> ${new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}</p>
      </div>
    </body>
    </html>
  `;

  // Crear blob y descargar
  const blob = new Blob([contenido], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `checklist-montacargas-${mantenimiento.montacargas_numero}-${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// BLOQUE 2.1: Función mejorada para marcar mantenimiento como completado
const marcarComoCompletado = async (mantenimientoId) => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    console.log('Marcando mantenimiento como completado:', mantenimientoId);

    // Usar AbortController para evitar llamadas duplicadas
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

  // Hooks para cargar datos según la pestaña activa
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
      
      {(errorMantenimientos || errorTecnicos || errorUsers || errorMisMantenimientos) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMantenimientos || errorTecnicos || errorUsers || errorMisMantenimientos}
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
  onDescargarChecklist={generarChecklistWord} 
  onMarcarCompletado={async (mantenimientoId) => {
    try {
      await marcarComoCompletado(mantenimientoId);
      
      // Actualizar el estado global después del éxito
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
  </div> 
);
};

export default Perfil;
