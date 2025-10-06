import React, { useState } from 'react';

export default function InformacionEquipo({ montacargas }) {
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [montacargasLocal, setMontacargasLocal] = useState(montacargas);

  // Actualizar el estado local cuando cambie el prop
  React.useEffect(() => {
    setMontacargasLocal(montacargas);
  }, [montacargas]);

  if (!montacargasLocal) return <p>No se seleccionó ningún montacargas.</p>;

  const handleFileUpload = async (event, tipo) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert('Solo se permiten archivos PDF, Word y texto');
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe exceder 10MB');
      return;
    }

    setUploading(prev => ({ ...prev, [tipo]: true }));

    try {
      const formData = new FormData();
      formData.append('documento_' + tipo, file);
      
      // Asegurarse de que los valores numéricos se envíen correctamente
      formData.append('Marca', montacargasLocal.Marca || '');
      formData.append('Modelo', montacargasLocal.Modelo || '');
      formData.append('Serie', montacargasLocal.Serie || '');
      formData.append('Sistema', montacargasLocal.Sistema || '');
      
      // CORRECCIÓN: Convertir Capacidad a número, usar 0 si está vacío
      const capacidad = montacargasLocal.Capacidad ? parseInt(montacargasLocal.Capacidad) : 0;
      formData.append('Capacidad', capacidad.toString());
      
      formData.append('Ubicacion', montacargasLocal.Ubicacion || '');
      formData.append('Planta', montacargasLocal.Planta || '');

      console.log('Enviando datos:', {
        Marca: montacargasLocal.Marca,
        Modelo: montacargasLocal.Modelo,
        Serie: montacargasLocal.Serie,
        Sistema: montacargasLocal.Sistema,
        Capacidad: capacidad,
        Ubicacion: montacargasLocal.Ubicacion,
        Planta: montacargasLocal.Planta
      });

      const response = await fetch(`http://localhost:4000/api/montacargas/${montacargasLocal.numero}`, {
        method: 'PUT',
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        // Actualizar el estado local
        setMontacargasLocal(responseData);
        alert('✅ Documento cargado correctamente');
      } else {
        throw new Error(responseData.error || responseData.details || 'Error al cargar documento');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('❌ Error al cargar el documento: ' + error.message);
    } finally {
      setUploading(prev => ({ ...prev, [tipo]: false }));
      event.target.value = '';
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(`http://localhost:4000/api/montacargas/documento/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar archivo');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('❌ Error al descargar el documento: ' + error.message);
    }
  };

  const handleDeleteDocument = async (tipo) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    setDeleting(prev => ({ ...prev, [tipo]: true }));

    try {
      const response = await fetch(`http://localhost:4000/api/montacargas/documento/${montacargasLocal.numero}/${tipo}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        // Actualizar el estado local
        setMontacargasLocal(prev => ({
          ...prev,
          [`documento_${tipo}`]: null
        }));
        alert('✅ Documento eliminado correctamente');
      } else {
        throw new Error(result.error || result.details || 'Error al eliminar documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('❌ Error al eliminar el documento: ' + error.message);
    } finally {
      setDeleting(prev => ({ ...prev, [tipo]: false }));
    }
  };

  // Función para obtener icono según tipo de archivo
  const getFileIcon = (filename) => {
    if (!filename) return '📄';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (ext === 'txt') return '📃';
    return '📄';
  };

  // Función para formatear el nombre del archivo
  const formatFileName = (filename) => {
    if (!filename) return '';
    const cleanName = filename.replace(/^montacargas-\d+-/, '');
    return cleanName.length > 20 ? cleanName.substring(0, 20) + '...' : cleanName;
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      {/* Información del Montacargas */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.5em' }}>Información del Montacargas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <p><strong>Número:</strong> {montacargasLocal.numero}</p>
          <p><strong>Marca:</strong> {montacargasLocal.Marca}</p>
          <p><strong>Modelo:</strong> {montacargasLocal.Modelo}</p>
          <p><strong>Serie:</strong> {montacargasLocal.Serie}</p>
          <p><strong>Sistema:</strong> {montacargasLocal.Sistema}</p>
          <p><strong>Capacidad:</strong> {montacargasLocal.Capacidad} lbs</p>
          <p><strong>Ubicación:</strong> {montacargasLocal.Ubicacion}</p>
          <p><strong>Planta:</strong> {montacargasLocal.Planta}</p>
        </div>
      </div>

      {/* Sección de Documentos - Pedimento */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        border: '2px solid #e0e0e0', 
        borderRadius: '12px',
        background: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{ 
          margin: '0 0 15px 0', 
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📋 Documento de Pedimento
        </h4>
        
        {montacargasLocal.documento_pedimento ? (
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <span style={{ fontSize: '1.5em' }}>{getFileIcon(montacargasLocal.documento_pedimento)}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                  {formatFileName(montacargasLocal.documento_pedimento)}
                </p>
                <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
                  {montacargasLocal.documento_pedimento}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleDownload(montacargasLocal.documento_pedimento)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                ⬇️ Descargar
              </button>
              <button 
                onClick={() => handleDeleteDocument('pedimento')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleting.pedimento ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.3s ease',
                  opacity: deleting.pedimento ? 0.6 : 1
                }}
                onMouseOver={(e) => !deleting.pedimento && (e.target.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                disabled={deleting.pedimento}
              >
                {deleting.pedimento ? '⏳ Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
            No se ha cargado el documento de pedimento
          </p>
        )}
        
        <div style={{ marginTop: '15px' }}>
          <input
            type="file"
            id="pedimento-upload"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileUpload(e, 'pedimento')}
            style={{ display: 'none' }}
          />
          <label 
            htmlFor="pedimento-upload" 
            style={{
              padding: '12px 25px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: uploading.pedimento ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              opacity: uploading.pedimento ? 0.6 : 1
            }}
            onMouseOver={(e) => !uploading.pedimento && (e.target.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            {uploading.pedimento ? '⏳ Cargando...' : (montacargasLocal.documento_pedimento ? '🔄 Reemplazar Documento' : '📤 Cargar Documento')}
          </label>
        </div>
      </div>

      {/* Sección de Documentos - Adicional */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        border: '2px solid #e0e0e0', 
        borderRadius: '12px',
        background: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{ 
          margin: '0 0 15px 0', 
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📋 Factura
        </h4>
        
        {montacargasLocal.documento_adicional ? (
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <span style={{ fontSize: '1.5em' }}>{getFileIcon(montacargasLocal.documento_adicional)}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                  {formatFileName(montacargasLocal.documento_adicional)}
                </p>
                <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
                  {montacargasLocal.documento_adicional}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleDownload(montacargasLocal.documento_adicional)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                ⬇️ Descargar
              </button>
              <button 
                onClick={() => handleDeleteDocument('adicional')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleting.adicional ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.3s ease',
                  opacity: deleting.adicional ? 0.6 : 1
                }}
                onMouseOver={(e) => !deleting.adicional && (e.target.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                disabled={deleting.adicional}
              >
                {deleting.adicional ? '⏳ Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
            No se ha cargado el documento adicional
          </p>
        )}
        
        <div style={{ marginTop: '15px' }}>
          <input
            type="file"
            id="adicional-upload"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileUpload(e, 'adicional')}
            style={{ display: 'none' }}
          />
          <label 
            htmlFor="adicional-upload" 
            style={{
              padding: '12px 25px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: uploading.adicional ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              opacity: uploading.adicional ? 0.6 : 1
            }}
            onMouseOver={(e) => !uploading.adicional && (e.target.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            {uploading.adicional ? '⏳ Cargando...' : (montacargasLocal.documento_adicional ? '🔄 Reemplazar Documento' : '📤 Cargar Documento')}
          </label>
        </div>
      </div>
    </div>
  );
}