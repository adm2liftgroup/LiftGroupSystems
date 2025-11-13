import React, { useState, useEffect } from 'react';

export default function HistorialMantenimientos({ montacargas }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (montacargas && montacargas.numero) {
      fetchHistorial(montacargas.numero);
    } else {
      setHistorial([]);
    }
  }, [montacargas]);

  const fetchHistorial = async (montacargasId) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/mantenimientos/todos?montacargasId=${montacargasId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const mantenimientosCompletados = (data.mantenimientos || [])
            .filter(m => m.status === 'completado')
            .sort((a, b) => new Date(b.completado_en) - new Date(a.completado_en));
          
          setHistorial(mantenimientosCompletados);
        } else {
          throw new Error(data.error || 'Error al cargar historial');
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (err) {
      console.error('Error en fetchHistorial:', err);
      setError(err.message);
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "Avanzado": return "bg-red-100 text-red-800";
      case "Intermedio": return "bg-yellow-100 text-yellow-800";
      case "Básico": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!montacargas) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No se seleccionó ningún montacargas</h3>
          <p className="text-yellow-700">Por favor, seleccione un montacargas para ver su historial de mantenimientos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Encabezado simplificado */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Historial de Mantenimientos - Montacargas #{montacargas.numero}
        </h2>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando historial de mantenimientos...</p>
        </div>
      )}

      {/* Tabla de Historial */}
      {!loading && historial.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Mantenimientos Completados ({historial.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Programada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mes/Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completado el
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historial.map((mantenimiento) => (
                  <tr key={mantenimiento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mantenimiento.mes}/{mantenimiento.anio}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(mantenimiento.tipo)}`}>
                        {mantenimiento.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mantenimiento.tecnico_nombre ? (
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                            {mantenimiento.tecnico_nombre.charAt(0).toUpperCase()}
                          </div>
                          {mantenimiento.tecnico_nombre}
                        </div>
                      ) : (
                        <span className="text-gray-400">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mantenimiento.completado_en ? (
                        <span className="text-green-600 font-medium">
                          {formatDate(mantenimiento.completado_en)}
                        </span>
                      ) : (
                        <span className="text-gray-400">No completado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay historial */}
      {!loading && historial.length === 0 && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            No hay mantenimientos completados
          </h3>
          <p className="text-blue-700">
            No se encontraron mantenimientos completados para el montacargas #{montacargas.numero}.
          </p>
        </div>
      )}
    </div>
  );
}