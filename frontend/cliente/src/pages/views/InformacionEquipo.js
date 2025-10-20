import React, { useState } from 'react';

// URL base para API - usa variable de entorno en producción
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function InformacionEquipo({ montacargas, onMontacargasUpdate }) {
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [montacargasLocal, setMontacargasLocal] = useState(montacargas);
  const [showPedimentoOpcional, setShowPedimentoOpcional] = useState(false);

  // Actualizar el estado local cuando cambie el prop
  React.useEffect(() => {
    setMontacargasLocal(montacargas);
    // Mostrar sección opcional de pedimento si ya existe un documento
    if (montacargas?.doc_ped_adicional) {
      setShowPedimentoOpcional(true);
    }
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
      
      // CORRECCIÓN: Usar los nombres correctos que espera el backend
      if (tipo === 'pedimento') {
        formData.append('documento_pedimento', file);
      } else if (tipo === 'adicional') {
        formData.append('documento_adicional', file);
      } else if (tipo === 'ped_adicional') {
        formData.append('doc_ped_adicional', file);
      }
      
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

      console.log('Enviando datos a:', `${API_URL}/api/montacargas/${montacargasLocal.numero}`);
      console.log('Tipo de documento:', tipo);
      
      const response = await fetch(`${API_URL}/api/montacargas/${montacargasLocal.numero}`, {
        method: 'PUT',
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        // Actualizar el estado local Y notificar al padre
        setMontacargasLocal(responseData);
        if (onMontacargasUpdate) {
          onMontacargasUpdate(responseData);
        }
        // Si es documento opcional de pedimento, mostrar la sección
        if (tipo === 'ped_adicional') {
          setShowPedimentoOpcional(true);
        }
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

  const handleDownload = async (fileUrl, originalFileName = null) => {
  try {
    if (!fileUrl) {
      alert('No hay documento para descargar');
      return;
    }

    console.log('📥 Iniciando descarga de:', fileUrl);

    // ⭐⭐ SOLUCIÓN MEJORADA: Siempre usar el backend como proxy
    const encodedUrl = encodeURIComponent(fileUrl);
    const downloadUrl = `${API_URL}/api/montacargas/documento/${encodedUrl}`;
    
    console.log('🌐 Descargando a través del backend:', downloadUrl);
    
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al descargar archivo');
    }
    
    // Obtener el blob
    const blob = await response.blob();
    
    // Extraer nombre del archivo del header Content-Disposition o de la URL
    let fileName = 'documento';
    const contentDisposition = response.headers.get('content-disposition');
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        fileName = filenameMatch[1];
      }
    } else {
      // Fallback: extraer de la URL
      try {
        const urlParts = fileUrl.split('/');
        const publicId = urlParts[urlParts.length - 1];
        fileName = publicId || 'documento';
      } catch (e) {
        console.log('No se pudo extraer nombre de archivo:', e);
      }
    }
    
    // Crear URL temporal y descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    alert('❌ Error al descargar el documento: ' + error.message);
  }
};

  const handleDeleteDocument = async (tipo) => {
  if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
    return;
  }

  setDeleting(prev => ({ ...prev, [tipo]: true }));

  try {
    console.log('Eliminando documento desde:', `${API_URL}/api/montacargas/documento/${montacargasLocal.numero}/${tipo}`);
    const response = await fetch(`${API_URL}/api/montacargas/documento/${montacargasLocal.numero}/${tipo}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (response.ok) {
      // ⭐⭐ FORZAR RECARGA COMPLETA DESDE EL SERVIDOR
      // Esperar un momento para que Cloudinary procese la eliminación
      setTimeout(async () => {
        const refreshResponse = await fetch(`${API_URL}/api/montacargas/${montacargasLocal.numero}`);
        const refreshData = await refreshResponse.json();
        
        if (refreshData.success) {
          const updatedMontacargas = refreshData.montacargas;
          setMontacargasLocal(updatedMontacargas);
          if (onMontacargasUpdate) {
            onMontacargasUpdate(updatedMontacargas);
          }
          
          // Si es documento opcional de pedimento y se elimina, ocultar la sección
          if (tipo === 'ped_adicional') {
            setShowPedimentoOpcional(false);
          }
          alert('✅ Documento eliminado correctamente');
        } else {
          throw new Error('Error al actualizar datos después de eliminar');
        }
      }, 1000);
      
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
  const getFileIcon = (fileUrl) => {
  if (!fileUrl) return '📄';
  
  let ext = '';
  
  // Si es una URL de Cloudinary, intentar detectar la extensión
  if (fileUrl.includes('cloudinary')) {
    // Cloudinary puede detectar el tipo automáticamente, pero por seguridad usar PDF
    ext = 'pdf';
  } else {
    // Si es un archivo local
    ext = fileUrl.split('.').pop().toLowerCase();
  }
  
  if (ext === 'pdf') return '📕';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (ext === 'txt') return '📃';
  return '📄';
};

  // Función para formatear el nombre del archivo
  const formatFileName = (fileUrl) => {
  if (!fileUrl) return '';
  
  // Si es una URL de Cloudinary, extraer el nombre del public_id
  if (fileUrl.includes('cloudinary')) {
    const parts = fileUrl.split('/');
    const publicId = parts[parts.length - 1];
    const fileName = publicId.split('.')[0];
    // Remover el prefijo "montacargas-" si existe
    return fileName.replace(/^montacargas-/, '').substring(0, 20) + '...';
  }
  
  // Si es un archivo local (antiguo)
  const cleanName = fileUrl.replace(/^montacargas-\d+-/, '');
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

      {/* Sección de Documentos - Pedimento (CON DOS DOCUMENTOS) */}
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
          📋 Documentos de Pedimento
        </h4>

        {/* Documento de Pedimento PRINCIPAL (OBLIGATORIO) */}
        <div style={{ marginBottom: '25px' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Pedimento Principal</h5>
          
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
              No se ha cargado el documento de pedimento principal
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
              {uploading.pedimento ? '⏳ Cargando...' : (montacargasLocal.documento_pedimento ? '🔄 Reemplazar Documento' : '📤 Cargar Pedimento Principal')}
            </label>
          </div>
        </div>

        {/* Documento de Pedimento OPCIONAL */}
        {!showPedimentoOpcional && !montacargasLocal.doc_ped_adicional && (
          <div style={{ 
            textAlign: 'center',
            padding: '15px',
            border: '1px dashed #ddd',
            borderRadius: '8px',
            background: '#f0f0f0'
          }}>
            <button
              onClick={() => setShowPedimentoOpcional(true)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#28a745',
                border: '2px solid #28a745',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#28a745';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#28a745';
              }}
            >
              ➕ Agregar Documento Opcional de Pedimento
            </button>
          </div>
        )}

        {(showPedimentoOpcional || montacargasLocal.doc_ped_adicional) && (
          <div style={{ 
            marginTop: '20px',
            padding: '15px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: '#f0f8ff'
          }}>
            <h5 style={{ 
              margin: '0 0 10px 0', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📄 Documento Opcional de Pedimento
            </h5>
            
            {montacargasLocal.doc_ped_adicional ? (
              <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '1.5em' }}>{getFileIcon(montacargasLocal.doc_ped_adicional)}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                      {formatFileName(montacargasLocal.doc_ped_adicional)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
                      {montacargasLocal.doc_ped_adicional}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleDownload(montacargasLocal.doc_ped_adicional)}
                    style={{
                      padding: '8px 16px',
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
                    onClick={() => handleDeleteDocument('ped_adicional')}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: deleting.ped_adicional ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.3s ease',
                      opacity: deleting.ped_adicional ? 0.6 : 1
                    }}
                    onMouseOver={(e) => !deleting.ped_adicional && (e.target.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    disabled={deleting.ped_adicional}
                  >
                    {deleting.ped_adicional ? '⏳ Eliminando...' : '🗑️ Eliminar'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
                  No se ha cargado el documento opcional
                </p>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    id="pedimento-opcional-upload"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFileUpload(e, 'ped_adicional')}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="pedimento-opcional-upload" 
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: uploading.ped_adicional ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                      opacity: uploading.ped_adicional ? 0.6 : 1
                    }}
                    onMouseOver={(e) => !uploading.ped_adicional && (e.target.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {uploading.ped_adicional ? '⏳ Cargando...' : '📤 Cargar Documento Opcional'}
                  </label>
                  
                  <button
                    onClick={() => setShowPedimentoOpcional(false)}
                    style={{
                      padding: '10px 20px',
                      background: 'transparent',
                      color: '#6c757d',
                      border: '1px solid #6c757d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#6c757d';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#6c757d';
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sección de Documentos - Factura (SE MANTIENE IGUAL) */}
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
            No se ha cargado la factura
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
            {uploading.adicional ? '⏳ Cargando...' : (montacargasLocal.documento_adicional ? '🔄 Reemplazar Factura' : '📤 Cargar Factura')}
          </label>
        </div>
      </div>
    </div>
  );
}