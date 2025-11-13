import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export default function InversionInicial({ montacargasId }) {
  const id = montacargasId;
  
  const [refacciones, setRefacciones] = useState([]);
  const [totales, setTotales] = useState({ totalRefacciones: 0, costoTotal: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refaccionAEliminar, setRefaccionAEliminar] = useState(null);
  const [userRole, setUserRole] = useState('user'); // Estado para el rol del usuario
  const [formData, setFormData] = useState({
    descripcion: '',
    numero_parte: '',
    cantidad: 1,
    costo_unitario: ''
  });

  // Obtener el rol del usuario al cargar el componente
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(userData.rol || 'user');
  }, []);

  useEffect(() => {
    console.log('ID del montacargas recibido:', id);
    console.log('Tipo de ID:', typeof id);
  }, [id]);

  useEffect(() => {
    if (id) {
      console.log('Cargando refacciones para ID:', id);
      cargarRefacciones();
    }
  }, [id]);

  // Función para verificar si el usuario es admin
  const isAdmin = () => userRole === 'admin';

  const cargarRefacciones = async () => {
    try {
      setLoading(true);
      console.log('Solicitando refacciones para:', id);
      
      const response = await axios.get(`${API_URL}/api/montacargas/${id}/refacciones`);
      
      if (response.data.success) {
        setRefacciones(response.data.refacciones);
        setTotales(response.data.totales);
        console.log('Refacciones cargadas:', response.data.refacciones);
      }
    } catch (error) {
      console.error('Error cargando refacciones:', error);
      alert('Error al cargar las refacciones');
    } finally {
      setLoading(false);
    }
  };

  const agregarRefaccion = async (e) => {
    e.preventDefault();
    
    // Verificar permisos antes de agregar
    if (!isAdmin()) {
      alert('❌ No tienes permisos para agregar refacciones');
      return;
    }

    try {
      if (!id || id === 'undefined') {
        alert('Error: No se pudo identificar el montacargas');
        return;
      }

      console.log('Agregando refacción para montacargas ID:', id);
      console.log('Datos a enviar:', formData);

      const response = await axios.post(
        `${API_URL}/api/montacargas/${id}/refacciones`,
        formData
      );

      if (response.data.success) {
        setRefacciones([response.data.refaccion, ...refacciones]);
        setFormData({ 
          descripcion: '', 
          numero_parte: '', 
          cantidad: 1, 
          costo_unitario: '' 
        });
        setShowForm(false);
        cargarRefacciones();
        alert('Refacción agregada correctamente');
      }
    } catch (error) {
      console.error('Error agregando refacción:', error);
      console.error('Detalles del error:', error.response?.data);
      alert('Error al agregar la refacción: ' + (error.response?.data?.error || error.message));
    }
  };

  const eliminarRefaccion = async (refaccionId) => {
    // Verificar permisos antes de eliminar
    if (!isAdmin()) {
      alert('❌ No tienes permisos para eliminar refacciones');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/montacargas/refacciones/${refaccionId}`);
      
      if (response.data.success) {
        setRefacciones(refacciones.filter(ref => ref.id !== refaccionId));
        cargarRefacciones();
        setRefaccionAEliminar(null);
        alert('Refacción eliminada correctamente');
      }
    } catch (error) {
      console.error('Error eliminando refacción:', error);
      alert('Error al eliminar la refacción');
    }
  };

  if (!id) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Selecciona un montacargas para ver sus refacciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-xl font-bold mb-2 sm:mb-0 sm:text-2xl">
          Control de Refacciones - Montacargas #{id}
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

      {/* Resumen de Totales */}
      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 sm:gap-4">
        <div className="bg-blue-50 p-3 rounded-lg sm:p-4">
          <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Total Refacciones</h3>
          <p className="text-xl font-bold sm:text-2xl">{totales.totalRefacciones}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg sm:p-4">
          <h3 className="font-semibold text-green-800 text-sm sm:text-base">Inversión Total</h3>
          <p className="text-xl font-bold sm:text-2xl">${totales.costoTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Botón para agregar nueva refacción - SOLO PARA ADMIN */}
      {isAdmin() && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
        >
          + Agregar Refacción
        </button>
      )}

      {/* Formulario para agregar refacción - SOLO PARA ADMIN */}
      {showForm && isAdmin() && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 sm:p-6">
          <h2 className="text-lg font-bold mb-4 sm:text-xl">Nueva Refacción</h2>
          <form onSubmit={agregarRefaccion}>
            <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Filtro de aceite, Batería, etc."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Parte
                </label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={formData.numero_parte}
                  onChange={(e) => setFormData({...formData, numero_parte: e.target.value})}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 1})}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                  min="1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costo_unitario}
                  onChange={(e) => setFormData({...formData, costo_unitario: e.target.value})}
                  className="border p-2 rounded w-full text-sm sm:text-base"
                  required
                />
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
            <strong>Modo de solo lectura:</strong> Puedes visualizar las refacciones pero no modificarlas.
          </p>
        </div>
      )}

      {/* Tabla de refacciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Cargando refacciones...</div>
        ) : refacciones.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay refacciones registradas para este montacargas
          </div>
        ) : (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden sm:block">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left text-sm">Descripción</th>
                    <th className="p-3 text-left text-sm">N° Parte</th>
                    <th className="p-3 text-left text-sm">Cantidad</th>
                    <th className="p-3 text-left text-sm">Costo Unitario</th>
                    <th className="p-3 text-left text-sm">Subtotal</th>
                    {/* Columna de acciones solo para admin */}
                    {isAdmin() && <th className="p-3 text-left text-sm">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {refacciones.map((refaccion) => (
                    <tr key={refaccion.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm">{refaccion.descripcion}</td>
                      <td className="p-3 text-sm">{refaccion.numero_parte || 'N/A'}</td>
                      <td className="p-3 text-sm">{refaccion.cantidad}</td>
                      <td className="p-3 text-sm">${parseFloat(refaccion.costo_unitario).toLocaleString()}</td>
                      <td className="p-3 text-sm font-semibold">
                        ${(refaccion.cantidad * parseFloat(refaccion.costo_unitario)).toLocaleString()}
                      </td>
                      {/* Botón eliminar solo para admin */}
                      {isAdmin() && (
                        <td className="p-3">
                          <button
                            onClick={() => setRefaccionAEliminar(refaccion.id)}
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
              {refacciones.map((refaccion) => (
                <div key={refaccion.id} className="border-b p-4 hover:bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-semibold">Descripción:</div>
                    <div>{refaccion.descripcion}</div>
                    
                    <div className="font-semibold">N° Parte:</div>
                    <div>{refaccion.numero_parte || 'N/A'}</div>
                    
                    <div className="font-semibold">Cantidad:</div>
                    <div>{refaccion.cantidad}</div>
                    
                    <div className="font-semibold">Costo Unitario:</div>
                    <div>${parseFloat(refaccion.costo_unitario).toLocaleString()}</div>
                    
                    <div className="font-semibold">Subtotal:</div>
                    <div className="font-semibold">
                      ${(refaccion.cantidad * parseFloat(refaccion.costo_unitario)).toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Botón eliminar solo para admin */}
                  {isAdmin() && (
                    <div className="mt-3">
                      <button
                        onClick={() => setRefaccionAEliminar(refaccion.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 w-full"
                      >
                        Eliminar Refacción
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
      {refaccionAEliminar && isAdmin() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirmar Eliminación</h3>
            <p className="mb-6">¿Estás seguro de eliminar esta refacción?</p>
            <div className="flex gap-2 justify-end flex-col sm:flex-row">
              <button
                onClick={() => setRefaccionAEliminar(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarRefaccion(refaccionAEliminar)}
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