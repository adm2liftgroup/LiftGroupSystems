import React, { useState, useEffect, useCallback } from "react";

// BLOQUE 1: Panel de Administración
//Panel exclusivo para usuarios administradores, se muestan, total de usuarios, estadísticas (verificados, admins), tabla detallada de usuarios
//Props: users - lista de usuarios, loaging - estado de carga, error - mensaje de error si falla el fetch
const AdminPanel = ({ users, loading, error }) => {
  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  // Función para obtener la inicial del nombre
  const getInitial = (nombre) => {
    if (!nombre) return "U";
    return nombre.charAt(0).toUpperCase();
  };

  //Renderizado del panel
  return (
    <div className="p-4 md:p-8 bg-white rounded-2xl shadow-lg w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Panel de Administración</h2>
      
      {/* Gestión de Usuarios */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Gestión de Usuarios</h3>
        <p className="text-gray-600">Total de usuarios: {users.length}</p>
        <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          Actualizar listo
        </button>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Estadísticas</h3>
        <p className="text-gray-600">
          Usuarios verificados: {users.filter(user => user.email_verified).length}
        </p>
        <p className="text-gray-600">
          Administradores: {users.filter(user => user.rol === "admin").length}
        </p>
      </div>

      {/* Lista de Usuarios Registrados */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    USUARIO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    EMAIL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    ROL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    VERIFICADO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    FECHA REGISTRO
                  </th>
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
                          <div>
                            <strong>{user.nombre || "N/A"}</strong>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.rol === "admin"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
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
// FIN DEL BLOQUE 1: Panel de Administración

// BLOQUE 2: Perfil
//Vista que tiene el usuario de su perfil de usuario
//Funcionalidades: -Cargar y mostrar datos del usuario logueado, -Controlar sesión, -Renderizar un menú lateral, -Si el usuario es admin, mostrar el AdminPanel
const Perfil = () => {
  // Estados principales
  const [userData, setUserData] = useState(null); // Datos del usuario 
  const [loading, setLoading] = useState(true); // Cargar inicial del perfil
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado de sesión 
  const [activeTab, setActiveTab] = useState("perfil"); // Pestña activa 
  const [redirecting, setRedirecting] = useState(false); // Estado al cerrar sesión 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Menú móvil
  const [shouldRedirect, setShouldRedirect] = useState(false); // Redirección si no hay login

  // Estados para admin
  const [users, setUsers] = useState([]); // lista de usuarios (solo admin)
  const [loadingUsers, setLoadingUsers] = useState(false); // Estado de carga usuarios 
  const [errorUsers, setErrorUsers] = useState(""); // Error al cargar usuarios

  // Verificación de que el usuario es admin 
  const isAdmin = userData?.rol === "admin";

// FIN DEL BLOQUE 2: Perfil

  // BLOQUE 3: Fetch de datos de usuario 
  // Se encarga de: -Validar el token en localStorage, -Hacer peticiones a auth/me, -Guardar datos de usuario si es válido, -Restringir a login si no hay token válido
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Validación del token 
      if (!token || token === "null") {
        console.error("❌ No hay token válido en localStorage");
        setIsLoggedIn(false);
        setLoading(false);
        setShouldRedirect(true);
        return;
      }

      //Petición al backend con el token 
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("Datos de /auth/me:", data);

      if (response.ok) {
        // Guardar datos en estado y localStorage 
        setUserData(data);
        setIsLoggedIn(true);
        localStorage.setItem("user", JSON.stringify(data));
        setActiveTab("perfil");
      } else {
        //Token inválido, se limpia la sesión
        console.error("Token inválido o expirado");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        setShouldRedirect(true);
      }
    } catch (err) {
      //Error en conexión
      console.error("Error fetching /auth/me:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setShouldRedirect(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // FIN DEL BLOQUE 3: Fetch de datos de usuario

  // BLOQUE 4: Logout
  // Función para cerra sesión: -Limpia token y datos de usuario en localStorage, -Cambia estado a "redirecting", -Redirige a la raíz "/" despues de  1.5 segundo
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setRedirecting(true);
    setTimeout(() => {
      // Redirigir a la raíz donde está el login
      window.location.href = "/";
    }, 1500);
  };
  // FIN DEL BLOQUE 4: Logout 

  // BLOQUE 5: useEffect cargar datos
  //Se ejecuta al montar el componente, llama a fetchUserData() para obtener datos del usuario logueado
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  // FIN DEL BLOQUE 5: useEffect cargar datos 

  // BLOQUE 6: Redirección si no hay login
  // Si el estado "shouldRedirect" está activo, significa que no hay sesión válida y se redirige al login
  useEffect(() => {
    if (shouldRedirect) {
      // Redirigir a la raíz donde está el login
      window.location.href = "/";
    }
  }, [shouldRedirect]);
  // FIN DEL BLOQUE 6: Redirección si no hay login

  // BLOQUE 7: Fetch de usuarios (solo admin)
  // Solo se ejecuta si el usuario es administrador, y obtiene todos los usuarios desde /auth/users.
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    setErrorUsers("");

    try {
      const token = localStorage.getItem("token");
      if (!token || token === "null") {
        setErrorUsers("No hay token válido");
        setLoadingUsers(false);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("Datos de /auth/users:", data);
      
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

// Hook para cargar usuarios cuando admin entra al panel
  useEffect(() => {
    if (activeTab === "admin-panel" && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin, fetchUsers]);
  // FIN DEL BLOQUE 7: Fetch de usuarios (solo admin)

  // BLOQUE 8: Renderizado
  // Se encarga de mostar diferentes vistas según el estado: -Pantalla de carga, -Pantalla de logout/redirección, -Menú responsive (mobile/desktop),
  // -Perfil normal (usuario común), -Panel admin (para rol "amdmin")
  if (loading) {
    // Vista mientras carga el perfil
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
    // Vista al cerrar sesión
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
    // Vista mientras redirige al login
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Redirigiendo...</h2>
          <p className="text-gray-500 mb-6">Serás redirigido al inicio.</p>
        </div>
      </div>
    );
  }
  // FIN DEL BLOQUE 8: Renderizado

  // BLOQUE 9: Return UI principal
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Menu Button */}
      <div className="md:hidden bg-slate-900 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel de Usuario</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-white"
          >
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
            <button
              onClick={() => {
                setActiveTab("perfil");
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                activeTab === "perfil" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"
              }`}
            >
              <span>Mi Perfil</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab("admin-panel");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                  activeTab === "admin-panel" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"
                }`}
              >
                <span>Panel de Administración</span>
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden md:flex flex-col bg-slate-900 text-white w-64 p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-8">Panel de Usuario</h1>
        <nav className="flex-1 space-y-4">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
              activeTab === "perfil" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
            }`}
          >
            <span>Mi Perfil</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin-panel")}
              className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                activeTab === "admin-panel" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
              }`}
            >
              <span>Panel de Administración</span>
            </button>
          )}
        </nav>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-6">
        {!isAdmin ? (
          // Perfil para usuarios normales
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
        ) : (
          // Para administradores
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
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Panel de Administración</h1>
                <AdminPanel users={users} loading={loadingUsers} error={errorUsers} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
// FIN DEL BLOQUE 9: Return UI principal
export default Perfil;