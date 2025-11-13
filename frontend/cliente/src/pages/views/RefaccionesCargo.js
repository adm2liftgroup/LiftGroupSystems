import React, { useState, useEffect, useRef } from 'react';

export default function RefaccionesCargo({ montacargas }) {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [mantenimientosFiltrados, setMantenimientosFiltrados] = useState([]);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);
  const [observaciones, setObservaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    descripcion: '',
    cargo_a: 'empresa'
  });
  const [editandoObservacion, setEditandoObservacion] = useState(null);
  
  // Estados para evidencias en observaciones individuales
  const [evidenciasObservacion, setEvidenciasObservacion] = useState([]);
  const [observacionConEvidencias, setObservacionConEvidencias] = useState(null);
  const [subiendoEvidencias, setSubiendoEvidencias] = useState(false);

  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear(),
    mes: '',
    tipo: '',
    status: ''
  });

  useEffect(() => {
    if (montacargas && montacargas.numero) {
      fetchMantenimientos(montacargas.numero);
    } else {
      setMantenimientos([]);
      setMantenimientosFiltrados([]);
      setMantenimientoSeleccionado(null);
    }
  }, [montacargas]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, mantenimientos]);

  useEffect(() => {
    if (mantenimientoSeleccionado) {
      fetchObservaciones(mantenimientoSeleccionado.id);
    } else {
      setObservaciones([]);
    }
  }, [mantenimientoSeleccionado]);

  // FUNCIÓN: Manejar selección de evidencias para observación individual
  const handleEvidenciasSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar cantidad máxima (3)
    if (evidenciasObservacion.length + files.length > 3) {
      setError('Máximo 3 imágenes permitidas');
      return;
    }

    // Validar cada archivo
    const nuevasEvidencias = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`El archivo ${file.name} no es una imagen válida`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`La imagen ${file.name} no debe superar los 5MB`);
        return;
      }

      nuevasEvidencias.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      });
    });

    setEvidenciasObservacion(prev => [...prev, ...nuevasEvidencias]);
    setError('');
  };

  // FUNCIÓN: Eliminar evidencia de observación
  const removeEvidencia = (index) => {
    setEvidenciasObservacion(prev => prev.filter((_, i) => i !== index));
  };

  // FUNCIÓN: Subir evidencias para una observación específica
  const subirEvidenciasObservacion = async () => {
    if (!observacionConEvidencias) {
      setError('No hay observación seleccionada');
      return;
    }

    if (evidenciasObservacion.length === 0) {
      setError('Debe agregar al menos una imagen como evidencia');
      return;
    }

    setSubiendoEvidencias(true);
    setError('');

    try {
      const token = localStorage.getItem("token");
      
      for (const evidencia of evidenciasObservacion) {
        const formData = new FormData();
        formData.append('mantenimiento_id', observacionConEvidencias.mantenimiento_id);
        formData.append('descripcion', observacionConEvidencias.descripcion);
        formData.append('cargo_a', observacionConEvidencias.cargo_a);
        formData.append('es_evidencia', 'true');
        formData.append('estado_resolucion', 'resuelto');
        formData.append('imagen', evidencia.file);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/refacciones`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al subir evidencia');
        }
      }

      setSuccess(`Observación completada con ${evidenciasObservacion.length} evidencia(s)`);
      setEvidenciasObservacion([]);
      setObservacionConEvidencias(null);
      fetchObservaciones(mantenimientoSeleccionado.id);
      
    } catch (err) {
      console.error('Error al subir evidencias:', err);
      setError(err.message);
    } finally {
      setSubiendoEvidencias(false);
    }
  };

  // FUNCIÓN: Completar observación con evidencias
  const completarObservacionConEvidencias = (observacion) => {
    setObservacionConEvidencias(observacion);
    setEvidenciasObservacion([]);
  };

  const handleEliminarImagen = async (observacionId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar la imagen de esta observación?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/refacciones/${observacionId}/imagen`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Imagen eliminada correctamente');
        fetchObservaciones(mantenimientoSeleccionado.id);
      } else {
        throw new Error(data.error || 'Error al eliminar imagen');
      }
    } catch (err) {
      console.error('Error en handleEliminarImagen:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMantenimientos = async (montacargasId) => {
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
          const mantenimientosOrdenados = (data.mantenimientos || [])
            .sort((a, b) => {
              if (b.anio !== a.anio) return b.anio - a.anio;
              return b.mes - a.mes;
            });
          
          setMantenimientos(mantenimientosOrdenados);
          
          if (mantenimientosOrdenados.length > 0) {
            setMantenimientoSeleccionado(mantenimientosOrdenados[0]);
          } else {
            setMantenimientoSeleccionado(null);
          }
        } else {
          throw new Error(data.error || 'Error al cargar mantenimientos');
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (err) {
      console.error('Error en fetchMantenimientos:', err);
      setError(err.message);
      setMantenimientos([]);
      setMantenimientosFiltrados([]);
      setMantenimientoSeleccionado(null);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...mantenimientos];

    if (filtros.anio) {
      filtrados = filtrados.filter(m => m.anio === parseInt(filtros.anio));
    }

    if (filtros.mes) {
      filtrados = filtrados.filter(m => m.mes === parseInt(filtros.mes));
    }

    if (filtros.tipo) {
      filtrados = filtrados.filter(m => m.tipo === filtros.tipo);
    }

    if (filtros.status) {
      filtrados = filtrados.filter(m => m.status === filtros.status);
    }

    setMantenimientosFiltrados(filtrados);

    if (mantenimientoSeleccionado && !filtrados.find(m => m.id === mantenimientoSeleccionado.id)) {
      setMantenimientoSeleccionado(filtrados.length > 0 ? filtrados[0] : null);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      anio: new Date().getFullYear(),
      mes: '',
      tipo: '',
      status: ''
    });
  };

  const fetchObservaciones = async (mantenimientoId) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/refacciones/mantenimiento/${mantenimientoId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setObservaciones(data.observaciones || []);
        } else {
          throw new Error(data.error || 'Error al cargar observaciones');
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (err) {
      console.error('Error en fetchObservaciones:', err);
      setError(err.message);
      setObservaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitObservacion = async (e) => {
    e.preventDefault();
    
    if (!mantenimientoSeleccionado) {
      setError('Debe seleccionar un mantenimiento primero');
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem("token");
      
      // Usar JSON en lugar de FormData para NO permitir imágenes en la creación inicial
      const requestBody = {
        mantenimiento_id: mantenimientoSeleccionado.id,
        descripcion: formData.descripcion.trim(),
        cargo_a: formData.cargo_a,
        es_evidencia: 'false',
        estado_resolucion: 'pendiente'
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/refacciones`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Observación agregada correctamente');
        setFormData({
          descripcion: '',
          cargo_a: 'empresa'
        });
        fetchObservaciones(mantenimientoSeleccionado.id);
      } else {
        throw new Error(data.error || 'Error al agregar observación');
      }
    } catch (err) {
      console.error('Error en handleSubmitObservacion:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarObservacion = async (e) => {
    e.preventDefault();
    
    if (!editandoObservacion || !editandoObservacion.descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (!mantenimientoSeleccionado) {
      setError('No hay mantenimiento seleccionado');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem("token");
      
      const requestBody = {
        descripcion: editandoObservacion.descripcion.trim(),
        cargo_a: editandoObservacion.cargo_a,
        estado_resolucion: editandoObservacion.estado_resolucion || 'pendiente',
        es_evidencia: editandoObservacion.es_evidencia || 'false'
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/refacciones/${editandoObservacion.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Observación actualizada correctamente');
        setEditandoObservacion(null);
        fetchObservaciones(mantenimientoSeleccionado.id);
      } else {
        throw new Error(data.error || 'Error al actualizar observación');
      }
    } catch (err) {
      console.error('Error en handleEditarObservacion:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarObservacion = async (observacionId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta observación?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/refacciones/${observacionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Observación eliminada correctamente');
        fetchObservaciones(mantenimientoSeleccionado.id);
      } else {
        throw new Error(data.error || 'Error al eliminar observación');
      }
    } catch (err) {
      console.error('Error en handleEliminarObservacion:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolverObservacion = async (observacionId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem("token");
      const observacion = observaciones.find(o => o.id === observacionId);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/refacciones/${observacionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            descripcion: observacion.descripcion,
            cargo_a: observacion.cargo_a,
            estado_resolucion: 'resuelto',
            es_evidencia: observacion.es_evidencia || 'false'
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Observación marcada como resuelta');
        fetchObservaciones(mantenimientoSeleccionado.id);
      } else {
        throw new Error(data.error || 'Error al resolver observación');
      }
    } catch (err) {
      console.error('Error en handleResolverObservacion:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditandoObservacion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const iniciarEdicion = (observacion) => {
    setEditandoObservacion({ ...observacion });
    setError('');
    setSuccess('');
  };

  const cancelarEdicion = () => {
    setEditandoObservacion(null);
    setError('');
    setSuccess('');
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "Avanzado": return "bg-red-100 text-red-800 border-red-200";
      case "Intermedio": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Básico": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completado": return "bg-green-100 text-green-800 border-green-200";
      case "cancelado": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCargoColor = (cargo) => {
    switch (cargo) {
      case "empresa": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cliente": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCargoText = (cargo) => {
    switch (cargo) {
      case "empresa": return "Cargo a Empresa";
      case "cliente": return "Cargo a Cliente";
      default: return cargo;
    }
  };

  const getEvidenciaBadge = (esEvidencia) => {
    if (esEvidencia === 'true' || esEvidencia === true) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    return "";
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

  const obtenerAniosUnicos = () => {
    const anios = [...new Set(mantenimientos.map(m => m.anio))];
    return anios.sort((a, b) => b - a);
  };

  const obtenerMesesUnicos = () => {
    const meses = [...new Set(mantenimientos.map(m => m.mes))];
    return meses.sort((a, b) => a - b);
  };

  const nombresMeses = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
    7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
  };

  if (!montacargas) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No se seleccionó ningún montacargas</h3>
          <p className="text-yellow-700">Por favor, seleccione un montacargas para gestionar las observaciones de mantenimiento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Gestión de Observaciones - Montacargas #{montacargas.numero}
        </h2>
        <p className="text-gray-600">
          Registre y gestione las observaciones, fallas y refacciones necesarias encontradas durante los mantenimientos.
        </p>
      </div>

      {/* Mensajes de estado */}
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Filtros y Selección de mantenimiento */}
        <div className="lg:col-span-1">
          {/* Panel de Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Filtros de Búsqueda
            </h3>
            
            <div className="space-y-4">
              {/* Filtro por Año */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <select
                  name="anio"
                  value={filtros.anio}
                  onChange={handleFiltroChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los años</option>
                  {obtenerAniosUnicos().map(anio => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Mes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  name="mes"
                  value={filtros.mes}
                  onChange={handleFiltroChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los meses</option>
                  {obtenerMesesUnicos().map(mes => (
                    <option key={mes} value={mes}>{nombresMeses[mes]}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Mantenimiento
                </label>
                <select
                  name="tipo"
                  value={filtros.tipo}
                  onChange={handleFiltroChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              {/* Filtro por Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="status"
                  value={filtros.status}
                  onChange={handleFiltroChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Botón Limpiar Filtros */}
              <button
                onClick={limpiarFiltros}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Lista de Mantenimientos Filtrados - SIN BOTÓN DE COMPLETAR */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Mantenimientos
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {mantenimientosFiltrados.length} de {mantenimientos.length}
              </span>
            </div>
            
            {mantenimientosFiltrados.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mantenimientosFiltrados.map((mantenimiento) => (
                  <div
                    key={mantenimiento.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      mantenimientoSeleccionado?.id === mantenimiento.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setMantenimientoSeleccionado(mantenimiento)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTipoColor(mantenimiento.tipo)}`}>
                            {mantenimiento.tipo}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoColor(mantenimiento.status)}`}>
                            {mantenimiento.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {nombresMeses[mantenimiento.mes]} {mantenimiento.anio}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    {mantenimiento.tecnico_nombre && (
                      <p className="text-sm text-gray-600 mt-1">
                        Técnico: <span className="font-medium">{mantenimiento.tecnico_nombre}</span>
                      </p>
                    )}
                    
                    {/* BOTÓN ELIMINADO: No mostrar botón de completar mantenimiento aquí */}
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-gray-500">
                    No hay mantenimientos que coincidan con los filtros.
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Columna 2: Formulario para agregar observación (SIN IMÁGENES) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editandoObservacion ? 'Editar Observación' : 'Nueva Observación'}
            </h3>
            
            {mantenimientoSeleccionado ? (
              <div>
                {/* Información del mantenimiento seleccionado */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-800">
                    Mantenimiento seleccionado:
                  </p>
                  <p className="text-sm text-blue-700">
                    {nombresMeses[mantenimientoSeleccionado.mes]} {mantenimientoSeleccionado.anio} - {mantenimientoSeleccionado.tipo}
                  </p>
                  <p className={`text-sm font-medium ${getEstadoColor(mantenimientoSeleccionado.status)} px-2 py-1 rounded-full inline-block mt-1`}>
                    Estado: {mantenimientoSeleccionado.status}
                  </p>
                </div>

                <form onSubmit={editandoObservacion ? handleEditarObservacion : handleSubmitObservacion}>
                  <div className="space-y-4">
                    {editandoObservacion && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          name="estado_resolucion"
                          value={editandoObservacion.estado_resolucion || 'pendiente'}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="resuelto">Resuelto</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción de la observación *
                      </label>
                      <textarea
                        name="descripcion"
                        value={editandoObservacion ? editandoObservacion.descripcion : formData.descripcion}
                        onChange={editandoObservacion ? handleEditInputChange : handleInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describa la falla encontrada, refacción necesaria, o observación del mantenimiento..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo de la reparación
                      </label>
                      <select
                        name="cargo_a"
                        value={editandoObservacion ? editandoObservacion.cargo_a : formData.cargo_a}
                        onChange={editandoObservacion ? handleEditInputChange : handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="empresa">Cargo a Empresa</option>
                        <option value="cliente">Cargo a Cliente</option>
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Guardando...' : editandoObservacion ? 'Actualizar' : 'Agregar Observación'}
                      </button>
                      
                      {editandoObservacion && (
                        <button
                          type="button"
                          onClick={cancelarEdicion}
                          disabled={loading}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-gray-500">
                  Seleccione un mantenimiento para agregar observaciones.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna 3: Lista de observaciones existentes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Observaciones Registradas
              </h3>
              {mantenimientoSeleccionado && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {observaciones.length} registros
                </span>
              )}
            </div>

            {mantenimientoSeleccionado ? (
              observaciones.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {observaciones.map((observacion) => (
                    <div
                      key={observacion.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2 flex-wrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoColor(observacion.estado_resolucion)}`}>
                            {observacion.estado_resolucion || 'pendiente'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCargoColor(observacion.cargo_a)}`}>
                            {getCargoText(observacion.cargo_a)}
                          </span>
                          {(observacion.es_evidencia === 'true' || observacion.es_evidencia === true) && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEvidenciaBadge(observacion.es_evidencia)}`}>
                              📷 Evidencia
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* MOSTRAR IMAGEN SI EXISTE */}
                      {observacion.imagen_url && (
                        <div className="mb-3">
                          <div className="relative inline-block">
                            <img 
                              src={observacion.imagen_url} 
                              alt="Observación"
                              className="h-32 w-auto rounded-md border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(observacion.imagen_url, '_blank')}
                            />
                            <button
                              onClick={() => handleEliminarImagen(observacion.id)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Eliminar imagen"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {observacion.imagen_nombre}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-gray-800 mb-3 whitespace-pre-wrap text-sm">
                        {observacion.descripcion}
                      </p>
                      
                      <div className="text-xs text-gray-500 border-t pt-2 space-y-1">
                        <p>
                          Creado: {formatDate(observacion.creado_en)}
                          {observacion.tecnico_nombre && ` por ${observacion.tecnico_nombre}`}
                        </p>
                        
                        {observacion.fecha_resolucion && (
                          <p>
                            Resuelto: {formatDate(observacion.fecha_resolucion)}
                            {observacion.resuelto_por_nombre && ` por ${observacion.resuelto_por_nombre}`}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                        {/* BOTÓN NUEVO: Completar con evidencias - solo para observaciones pendientes */}
                        {observacion.estado_resolucion !== 'resuelto' && (
                          <button
                            onClick={() => completarObservacionConEvidencias(observacion)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            📷 Completar
                          </button>
                        )}
                        
                        {observacion.estado_resolucion !== 'resuelto' && (
                          <button
                            onClick={() => handleResolverObservacion(observacion.id)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Resolver
                          </button>
                        )}
                        <button
                          onClick={() => iniciarEdicion(observacion)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarObservacion(observacion.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No hay observaciones</h4>
                  <p className="text-gray-500">
                    No se han registrado observaciones para este mantenimiento.
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-gray-500">
                  Seleccione un mantenimiento para ver sus observaciones.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para subir evidencias de observación individual */}
      {observacionConEvidencias && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📷 Completar Observación con Evidencias
              </h3>
              <button
                onClick={() => {
                  setObservacionConEvidencias(null);
                  setEvidenciasObservacion([]);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={subiendoEvidencias}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Observación:</strong> {observacionConEvidencias.descripcion}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Suba fotos como evidencia de que esta observación ha sido completada.
                {evidenciasObservacion.length === 0 && ' Mínimo 1 imagen, máximo 3.'}
              </p>
            </div>

            {/* Selector de evidencias */}
            <div className="mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleEvidenciasSelect}
                className="hidden"
                id="evidencias-observacion-input"
                disabled={subiendoEvidencias || evidenciasObservacion.length >= 3}
              />
              
              <label
                htmlFor="evidencias-observacion-input"
                className={`block w-full border border-gray-300 rounded-md py-3 px-4 text-center cursor-pointer mb-3 ${
                  subiendoEvidencias || evidenciasObservacion.length >= 3
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {evidenciasObservacion.length >= 3 ? '✅ Máximo alcanzado (3)' : '📸 Seleccionar Imágenes (Máx. 3)'}
              </label>

              {/* Vista previa de evidencias */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {evidenciasObservacion.map((evidencia, index) => (
                  <div key={index} className="relative border border-gray-200 rounded-md p-3 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={evidencia.preview} 
                        alt={`Evidencia ${index + 1}`}
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {evidencia.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(evidencia.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => removeEvidencia(index)}
                        disabled={subiendoEvidencias}
                        className="bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {evidenciasObservacion.length}/3 imágenes seleccionadas
                </p>
                {evidenciasObservacion.length > 0 && (
                  <button
                    onClick={() => setEvidenciasObservacion([])}
                    disabled={subiendoEvidencias}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Limpiar todas
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={subirEvidenciasObservacion}
                disabled={subiendoEvidencias || evidenciasObservacion.length === 0}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {subiendoEvidencias ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </div>
                ) : (
                  `Completar con ${evidenciasObservacion.length} Evidencia${evidenciasObservacion.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              Formatos: JPEG, PNG, GIF, WebP. Máx. 5MB por imagen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}