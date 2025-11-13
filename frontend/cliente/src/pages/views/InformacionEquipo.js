import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function InformacionEquipo({ montacargas, onMontacargasUpdate }) {
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [montacargasLocal, setMontacargasLocal] = useState(montacargas);
  const [showPedimentoOpcional, setShowPedimentoOpcional] = useState(false);
  const [userRole, setUserRole] = useState('user'); // Estado para el rol del usuario

  // Obtener el rol del usuario al cargar el componente
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(userData.rol || 'user');
  }, []);

  useEffect(() => {
    setMontacargasLocal(montacargas);

    if (montacargas?.doc_ped_adicional) {
      setShowPedimentoOpcional(true);
    }
  }, [montacargas]);

  useEffect(() => {
    console.log('🔄 montacargasLocal actualizado:', montacargasLocal);
  }, [montacargasLocal]);

  useEffect(() => {
    console.log('📥 montacargas (prop) actualizado:', montacargas);
  }, [montacargas]);

  // Función para verificar si el usuario es admin
  const isAdmin = () => userRole === 'admin';

  if (!montacargasLocal) return <p>No se seleccionó ningún montacargas.</p>;

  const handleFileUpload = async (event, tipo) => {
    // Verificar permisos antes de subir
    if (!isAdmin()) {
      alert('❌ No tienes permisos para subir documentos');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert('Solo se permiten archivos PDF, Word y texto');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe exceder 10MB');
      return;
    }

    setUploading(prev => ({ ...prev, [tipo]: true }));

    try {
      const formData = new FormData();

      if (tipo === 'pedimento') {
        formData.append('documento_pedimento', file);
      } else if (tipo === 'adicional') {
        formData.append('documento_adicional', file);
      } else if (tipo === 'ped_adicional') {
        formData.append('doc_ped_adicional', file);
      }

      formData.append('Marca', montacargasLocal.Marca || '');
      formData.append('Modelo', montacargasLocal.Modelo || '');
      formData.append('Serie', montacargasLocal.Serie || '');
      formData.append('Sistema', montacargasLocal.Sistema || '');

      const capacidad = montacargasLocal.Capacidad ? parseInt(montacargasLocal.Capacidad) : 0;
      formData.append('Capacidad', capacidad.toString());
      
      formData.append('Ubicacion', montacargasLocal.Ubicacion || '');
      formData.append('Planta', montacargasLocal.Planta || '');

      console.log('📤 Enviando datos a:', `${API_URL}/api/montacargas/${montacargasLocal.numero}`);
      console.log('📄 Tipo de documento:', tipo);
      
      const response = await fetch(`${API_URL}/api/montacargas/${montacargasLocal.numero}`, {
        method: 'PUT',
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('✅ Respuesta del servidor:', responseData);

        setMontacargasLocal(responseData);
        if (onMontacargasUpdate) {
          onMontacargasUpdate(responseData);
        }

        if (tipo === 'ped_adicional') {
          setShowPedimentoOpcional(true);
        }
        alert('✅ Documento cargado correctamente');
      } else {
        throw new Error(responseData.error || responseData.details || 'Error al cargar documento');
      }
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      alert('❌ Error al cargar el documento: ' + error.message);
    } finally {
      setUploading(prev => ({ ...prev, [tipo]: false }));
      event.target.value = '';
    }
  };

  const handleDownload = async (fileUrl, tipo) => {
    try {
      if (!fileUrl) {
        alert('No hay documento para descargar');
        return;
      }

      console.log('📥 Iniciando descarga de:', fileUrl);

      const encodedUrl = encodeURIComponent(fileUrl);
      const downloadUrl = `${API_URL}/api/montacargas/documento/${encodedUrl}`;
      
      console.log('🌐 Descargando a través del backend:', downloadUrl);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;

      let fileName = 'documento.pdf';
      try {
        if (fileUrl.includes('cloudinary')) {
          const urlParts = fileUrl.split('/');
          const publicIdPart = urlParts[urlParts.length - 1];
          const publicId = decodeURIComponent(publicIdPart.split('?')[0]);
          const nameFromPublicId = publicId.split('/').pop();
          if (nameFromPublicId && nameFromPublicId.includes('.')) {
            fileName = nameFromPublicId;
          }
        } else {
          const urlParts = fileUrl.split('/');
          fileName = urlParts[urlParts.length - 1];
        }
      } catch (e) {
        console.log('Error extrayendo nombre:', e);
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log('✅ Descarga iniciada:', fileName);
      
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      alert('❌ Error al descargar el documento: ' + error.message);
    }
  };

  const handleDeleteDocument = async (tipo) => {
    // Verificar permisos antes de eliminar
    if (!isAdmin()) {
      alert('❌ No tienes permisos para eliminar documentos');
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    setDeleting(prev => ({ ...prev, [tipo]: true }));

    try {
      console.log('🗑️ Eliminando documento desde:', `${API_URL}/api/montacargas/documento/${montacargasLocal.numero}/${tipo}`);
      const response = await fetch(`${API_URL}/api/montacargas/documento/${montacargasLocal.numero}/${tipo}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Respuesta de eliminación:', result);
  
        if (result.montacargas) {
          setMontacargasLocal(result.montacargas);
          if (onMontacargasUpdate) {
            onMontacargasUpdate(result.montacargas);
          }
        } else {
          const refreshResponse = await fetch(`${API_URL}/api/montacargas/${montacargasLocal.numero}`);
          const refreshData = await refreshResponse.json();
          
          if (refreshData.success) {
            setMontacargasLocal(refreshData.montacargas);
            if (onMontacargasUpdate) {
              onMontacargasUpdate(refreshData.montacargas);
            }
          }
        }

        if (tipo === 'ped_adicional') {
          setShowPedimentoOpcional(false);
        }
        alert('✅ Documento eliminado correctamente');
      } else {
        throw new Error(result.error || result.details || 'Error al eliminar documento');
      }
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      alert('❌ Error al eliminar el documento: ' + error.message);
    } finally {
      setDeleting(prev => ({ ...prev, [tipo]: false }));
    }
  };

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return '📄';
    
    let ext = '';
    
    if (fileUrl.includes('cloudinary')) {
      ext = 'pdf';
    } else {
      ext = fileUrl.split('.').pop().toLowerCase();
    }
    
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (ext === 'txt') return '📃';
    return '📄';
  };

  const formatFileName = (fileUrl) => {
    if (!fileUrl) return '';
    
    if (fileUrl.includes('cloudinary')) {
      const parts = fileUrl.split('/');
      const publicId = parts[parts.length - 1];
      const fileName = publicId.split('.')[0];
      return fileName.replace(/^montacargas-/, '').substring(0, 20) + '...';
    }
    
    const cleanName = fileUrl.replace(/^montacargas-\d+-/, '');
    return cleanName.length > 20 ? cleanName.substring(0, 20) + '...' : cleanName;
  };

  // Componente para botones de subida (solo visible para admin)
  const UploadButton = ({ tipo, texto, tieneDocumento }) => (
    <div style={{ marginTop: '15px' }}>
      <input
        type="file"
        id={`${tipo}-upload`}
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleFileUpload(e, tipo)}
        style={{ display: 'none' }}
      />
      <label 
        htmlFor={`${tipo}-upload`} 
        style={{
          padding: '12px 25px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: uploading[tipo] ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          opacity: uploading[tipo] ? 0.6 : 1
        }}
        onMouseOver={(e) => !uploading[tipo] && (e.target.style.transform = 'scale(1.05)')}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        {uploading[tipo] ? '⏳ Cargando...' : (tieneDocumento ? '🔄 Reemplazar Documento' : texto)}
      </label>
    </div>
  );

  // Componente para botones de eliminación (solo visible para admin)
  const DeleteButton = ({ tipo }) => (
    <button 
      onClick={() => handleDeleteDocument(tipo)}
      style={{
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: deleting[tipo] ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'all 0.3s ease',
        opacity: deleting[tipo] ? 0.6 : 1
      }}
      onMouseOver={(e) => !deleting[tipo] && (e.target.style.transform = 'scale(1.05)')}
      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      disabled={deleting[tipo]}
    >
      {deleting[tipo] ? '⏳ Eliminando...' : '🗑️ Eliminar'}
    </button>
  );

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
          📋 Documentos de Pedimento
        </h4>

        {/* Documento de Pedimento PRINCIPAL */}
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
                  onClick={() => handleDownload(montacargasLocal.documento_pedimento, 'pedimento')}
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
                
                {/* Solo admin puede eliminar */}
                {isAdmin() && <DeleteButton tipo="pedimento" />}
              </div>
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
              No se ha cargado el documento de pedimento principal
            </p>
          )}
          
          {/* Solo admin puede subir/reemplazar */}
          {isAdmin() && (
            <UploadButton 
              tipo="pedimento" 
              texto="📤 Cargar Pedimento Principal"
              tieneDocumento={!!montacargasLocal.documento_pedimento}
            />
          )}
        </div>

        {/* Documento de Pedimento OPCIONAL */}
        {!showPedimentoOpcional && !montacargasLocal.doc_ped_adicional && isAdmin() && (
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
                    onClick={() => handleDownload(montacargasLocal.doc_ped_adicional, 'ped_adicional')}
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
                  
                  {/* Solo admin puede eliminar */}
                  {isAdmin() && <DeleteButton tipo="ped_adicional" />}
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
                  No se ha cargado el documento opcional
                </p>
                
                {/* Solo admin puede subir */}
                {isAdmin() && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <UploadButton 
                      tipo="ped_adicional" 
                      texto="📤 Cargar Documento Opcional"
                      tieneDocumento={false}
                    />
                    
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
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sección de Documentos - Factura */}
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
                onClick={() => handleDownload(montacargasLocal.documento_adicional, 'adicional')}
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
              
              {/* Solo admin puede eliminar */}
              {isAdmin() && <DeleteButton tipo="adicional" />}
            </div>
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
            No se ha cargado la factura
          </p>
        )}
        
        {/* Solo admin puede subir/reemplazar */}
        {isAdmin() && (
          <UploadButton 
            tipo="adicional" 
            texto="📤 Cargar Factura"
            tieneDocumento={!!montacargasLocal.documento_adicional}
          />
        )}
      </div>
    </div>
  );
}