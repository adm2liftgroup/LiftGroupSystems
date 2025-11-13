import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export default function InversionInicial({ montacargasId }) {
  const id = montacargasId;
  
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [inversionAEliminar, setInversionAEliminar] = useState(null);
  const [userRole, setUserRole] = useState('user'); // Estado para el rol del usuario
  const [formData, setFormData] = useState({
    costo_equipo: '',
    valor_factura: '',
    importacion: '',
    flete: ''
  });

  // Obtener el rol del usuario al cargar el componente
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(userData.rol || 'user');
  }, []);

  useEffect(() => {
    console.log('ID del montacargas recibido:', id);
    if (id) {
      console.log('Cargando inversión inicial para ID:', id);
      cargarInversiones();
    }
  }, [id]);

  // Función para verificar si el usuario es admin
  const isAdmin = () => userRole === 'admin';

  const cargarInversiones = async () => {
    try {
      setLoading(true);
      console.log('Solicitando inversión inicial para:', id);
      
      const response = await axios.get(`${API_URL}/api/montacargas/${id}/inversion-inicial`);
      
      if (response.data.success) {
        setInversiones(response.data.inversiones);
        console.log('Inversión inicial cargada:', response.data.inversiones);
      }
    } catch (error) {
      console.error('Error cargando inversión inicial:', error);
      alert('Error al cargar la inversión inicial');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = () => {
    const costoEquipo = parseFloat(formData.costo_equipo) || 0;
    const valorFactura = parseFloat(formData.valor_factura) || 0;
    const importacion = parseFloat(formData.importacion) || 0;
    const flete = parseFloat(formData.flete) || 0;
    
    return costoEquipo + valorFactura + importacion + flete;
  };

  const agregarInversion = async (e) => {
    e.preventDefault();
    
    // Verificar permisos antes de agregar
    if (!isAdmin()) {
      alert('❌ No tienes permisos para agregar inversiones iniciales');
      return;
    }

    try {
      if (!id || id === 'undefined') {
        alert('Error: No se pudo identificar el montacargas');
        return;
      }

      const total = calcularTotal();
      
      console.log('Agregando inversión inicial para montacargas ID:', id);
      console.log('Datos a enviar:', { ...formData, total });

      const response = await axios.post(
        `${API_URL}/api/montacargas/${id}/inversion-inicial`,
        { ...formData, total }
      );

      if (response.data.success) {
        setInversiones([response.data.inversion, ...inversiones]);
        setFormData({ 
          costo_equipo: '', 
          valor_factura: '', 
          importacion: '', 
          flete: '' 
        });
        setShowForm(false);
        cargarInversiones();
        alert('Inversión inicial agregada correctamente');
      }
    } catch (error) {
      console.error('Error agregando inversión inicial:', error);
      console.error('Detalles del error:', error.response?.data);
      alert('Error al agregar la inversión inicial: ' + (error.response?.data?.error || error.message));
    }
  };

  const eliminarInversion = async (inversionId) => {
    // Verificar permisos antes de eliminar
    if (!isAdmin()) {
      alert('❌ No tienes permisos para eliminar inversiones iniciales');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/montacargas/inversion-inicial/${inversionId}`);
      
      if (response.data.success) {
        setInversiones(inversiones.filter(inv => inv.id !== inversionId));
        setInversionAEliminar(null);
        alert('Inversión inicial eliminada correctamente');
      }
    } catch (error) {
      console.error('Error eliminando inversión inicial:', error);
      alert('Error al eliminar la inversión inicial');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!id) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Selecciona un montacargas para ver su inversión inicial.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-xl font-bold mb-2 sm:mb-0 sm:text-2xl">
          Inversión Inicial - Montacargas #{id}
        </h1>
        
        {/* Indicador de rol del usuario */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isAdmin() 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {isAdmin() ? 'Administrador' : 'Usuario'}
        </div>
      </div>

      {/* Resumen de Total */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 text-sm sm:text-base mb-2">Resumen de Inversión</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-600">Registros:</p>
            <p className="text-lg font-bold">{inversiones.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total General:</p>
            <p className="text-lg font-bold text-green-600">
              ${inversiones.reduce((sum, inv) => sum + parseFloat(inv.total), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Botón para agregar nueva inversión - SOLO PARA ADMIN */}
      {isAdmin() && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
        >
          + Agregar Inversión Inicial
        </button>
      )}

      {/* Formulario para agregar inversión - SOLO PARA ADMIN */}
      {showForm && isAdmin() && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 sm:p-6">
          <h2 className="text-lg font-bold mb-4 sm:text-xl">Nueva Inversión Inicial</h2>
          <form onSubmit={agregarInversion}>
            <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Equipo *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  name="costo_equipo"
                  value={formData.costo_equipo}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Factura *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  name="valor_factura"
                  value={formData.valor_factura}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importación *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  name="importacion"
                  value={formData.importacion}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flete *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  name="flete"
                  value={formData.flete}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <div className="bg-gray-50 p-3 rounded">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Calculado
                  </label>
                  <p className="text-lg font-bold text-green-600">
                    ${calcularTotal().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              <button 
                type="submit" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm sm:text-base flex-1"
              >
                Guardar
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm sm:text-base flex-1"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mensaje informativo para usuarios no admin */}
      {!isAdmin() && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">
            <strong>Modo de solo lectura:</strong> Puedes visualizar la inversión inicial pero no modificarla.
          </p>
        </div>
      )}

      {/* Tabla de inversiones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Cargando inversión inicial...</div>
        ) : inversiones.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay inversión inicial registrada para este montacargas
          </div>
        ) : (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden sm:block">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left text-sm">Costo Equipo</th>
                    <th className="p-3 text-left text-sm">Valor Factura</th>
                    <th className="p-3 text-left text-sm">Importación</th>
                    <th className="p-3 text-left text-sm">Flete</th>
                    <th className="p-3 text-left text-sm">Total</th>
                    <th className="p-3 text-left text-sm">Fecha</th>
                    {/* Columna de acciones solo para admin */}
                    {isAdmin() && <th className="p-3 text-left text-sm">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {inversiones.map((inversion) => (
                    <tr key={inversion.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm">${parseFloat(inversion.costo_equipo).toLocaleString()}</td>
                      <td className="p-3 text-sm">${parseFloat(inversion.valor_factura).toLocaleString()}</td>
                      <td className="p-3 text-sm">${parseFloat(inversion.importacion).toLocaleString()}</td>
                      <td className="p-3 text-sm">${parseFloat(inversion.flete).toLocaleString()}</td>
                      <td className="p-3 text-sm font-semibold text-green-600">
                        ${parseFloat(inversion.total).toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(inversion.creado_en).toLocaleDateString('es-ES')}
                      </td>
                      {/* Botón eliminar solo para admin */}
                      {isAdmin() && (
                        <td className="p-3">
                          <button
                            onClick={() => setInversionAEliminar(inversion.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="sm:hidden">
              {inversiones.map((inversion) => (
                <div key={inversion.id} className="border-b p-4 hover:bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-semibold">Costo Equipo:</div>
                    <div>${parseFloat(inversion.costo_equipo).toLocaleString()}</div>
                    
                    <div className="font-semibold">Valor Factura:</div>
                    <div>${parseFloat(inversion.valor_factura).toLocaleString()}</div>
                    
                    <div className="font-semibold">Importación:</div>
                    <div>${parseFloat(inversion.importacion).toLocaleString()}</div>
                    
                    <div className="font-semibold">Flete:</div>
                    <div>${parseFloat(inversion.flete).toLocaleString()}</div>
                    
                    <div className="font-semibold">Total:</div>
                    <div className="font-semibold text-green-600">
                      ${parseFloat(inversion.total).toLocaleString()}
                    </div>
                    
                    <div className="font-semibold">Fecha:</div>
                    <div className="text-gray-500">
                      {new Date(inversion.creado_en).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  
                  {/* Botón eliminar solo para admin */}
                  {isAdmin() && (
                    <div className="mt-3">
                      <button
                        onClick={() => setInversionAEliminar(inversion.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 w-full"
                      >
                        Eliminar Inversión
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Confirmación - SOLO PARA ADMIN */}
      {inversionAEliminar && isAdmin() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirmar Eliminación</h3>
            <p className="mb-6">¿Estás seguro de eliminar este registro de inversión inicial?</p>
            <div className="flex gap-2 justify-end flex-col sm:flex-row">
              <button
                onClick={() => setInversionAEliminar(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarInversion(inversionAEliminar)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm sm:text-base order-1 sm:order-2"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}   
    </div>
  );
}