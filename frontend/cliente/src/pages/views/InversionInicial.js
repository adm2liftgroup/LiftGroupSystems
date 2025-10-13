import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export default function InversionInicial() {
  const { id } = useParams(); // ID del montacargas
  const [refacciones, setRefacciones] = useState([]);
  const [totales, setTotales] = useState({ totalRefacciones: 0, costoTotal: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refaccionAEliminar, setRefaccionAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    numero_parte: '',
    cantidad: 1,
    costo_unitario: ''
  });

  // DEBUG: Verificar el ID
  useEffect(() => {
    console.log('ID del montacargas:', id);
    console.log('Tipo de ID:', typeof id);
  }, [id]);

  // Cargar refacciones al montar el componente
  useEffect(() => {
    if (id) {
      cargarRefacciones();
    }
  }, [id]);

  const cargarRefacciones = async () => {
    try {
      setLoading(true);
      console.log('Cargando refacciones para montacargas ID:', id);
      
      const response = await axios.get(`${API_URL}/api/montacargas/${id}/refacciones`);
      
      if (response.data.success) {
        setRefacciones(response.data.refacciones);
        setTotales(response.data.totales);
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
    try {
      // Validar que tenemos un ID válido
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
        cargarRefacciones(); // Recargar para actualizar totales
        alert('Refacción agregada correctamente');
      }
    } catch (error) {
      console.error('Error agregando refacción:', error);
      console.error('Detalles del error:', error.response?.data);
      alert('Error al agregar la refacción: ' + (error.response?.data?.error || error.message));
    }
  };

  const eliminarRefaccion = async (refaccionId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/montacargas/refacciones/${refaccionId}`);
      
      if (response.data.success) {
        setRefacciones(refacciones.filter(ref => ref.id !== refaccionId));
        cargarRefacciones(); // Recargar para actualizar totales
        setRefaccionAEliminar(null); // Cerrar modal
        alert('Refacción eliminada correctamente');
      }
    } catch (error) {
      console.error('Error eliminando refacción:', error);
      alert('Error al eliminar la refacción');
    }
  };

  // Si no hay ID, mostrar mensaje de error
  if (!id || id === 'undefined') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">Error</h2>
          <p>No se pudo identificar el montacargas. Verifica la URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Control de Refacciones - Montacargas #{id}
      </h1>

      {/* Resumen de Totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Total Refacciones</h3>
          <p className="text-2xl font-bold">{totales.totalRefacciones}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Inversión Total</h3>
          <p className="text-2xl font-bold">${totales.costoTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Botón para agregar nueva refacción */}
      <button
        onClick={() => setShowForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
      >
        + Agregar Refacción
      </button>

      {/* Formulario para agregar refacción */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Nueva Refacción</h2>
          <form onSubmit={agregarRefaccion}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Filtro de aceite, Batería, etc."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="border p-2 rounded w-full"
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
                  className="border p-2 rounded w-full"
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
                  className="border p-2 rounded w-full"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costo_unitario}
                  onChange={(e) => setFormData({...formData, costo_unitario: e.target.value})}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Guardar
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
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
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">N° Parte</th>
                <th className="p-3 text-left">Cantidad</th>
                <th className="p-3 text-left">Costo Unitario</th>
                <th className="p-3 text-left">Subtotal</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {refacciones.map((refaccion) => (
                <tr key={refaccion.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{refaccion.descripcion}</td>
                  <td className="p-3">{refaccion.numero_parte || 'N/A'}</td>
                  <td className="p-3">{refaccion.cantidad}</td>
                  <td className="p-3">${parseFloat(refaccion.costo_unitario).toLocaleString()}</td>
                  <td className="p-3 font-semibold">
                    ${(refaccion.cantidad * parseFloat(refaccion.costo_unitario)).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setRefaccionAEliminar(refaccion.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Confirmación */}
      {refaccionAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirmar Eliminación</h3>
            <p className="mb-6">¿Estás seguro de eliminar esta refacción?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRefaccionAEliminar(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarRefaccion(refaccionAEliminar)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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