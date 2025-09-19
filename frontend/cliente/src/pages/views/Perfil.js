import React, { useState, useEffect } from "react";

// Componente para la vista de login simulado
const Login = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido</h2>
        <p className="text-gray-500 mb-6">Inicia sesión para ver tu perfil.</p>
        <button
          onClick={onLogin}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

const Perfil = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [redirecting, setRedirecting] = useState(false);

  const userRole = userData?.rol || "usuario";
  const firstLetter = userData?.nombre ? userData.nombre.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    // Comprueba si el usuario está en el almacenamiento local para decidir si está logueado
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && (parsedUser.nombre || parsedUser.email || parsedUser.rol)) {
          setUserData(parsedUser);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("❌ Error parseando usuario de localStorage:", error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }

    if (user && user.id && isLoggedIn) {
      fetchUserData();
    } else if (user && user.id && !isLoggedIn) {
      // Si el prop 'user' existe pero no hay nada en el localStorage, simula un login
      setIsLoggedIn(true);
    }
  }, [user, isLoggedIn]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUserData(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        const altResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/user/${user.id}`);
        if (altResponse.ok) {
          const altUserData = await altResponse.json();
          setUserData(altUserData);
          localStorage.setItem("user", JSON.stringify(altUserData));
        }
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

 const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  setRedirecting(true);
  // Redirigir a la página principal (raíz)
  setTimeout(() => {
      window.location.href = '/';
  }, 1500); // 1.5 segundos para mostrar el mensaje de redirección
};
  
  const handleLogin = () => {
    // Simula un login estableciendo el estado a true y recargando datos
    setIsLoggedIn(true);
    fetchUserData();
  };

  const handleEditProfile = () => {
    console.log("Editar perfil");
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cerrando sesión...</h2>
          <p className="text-gray-500 mb-6">Redirigiendo al login.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Cargando...</div>;
    }

    switch (activeTab) {
      case "perfil":
        return (
          <div className="flex-1 flex flex-col items-center p-8 bg-white rounded-2xl w-full max-w-lg mx-auto">
            <div className="relative mb-4">
              <img
                src={`https://placehold.co/120x120/1e293b/ffffff?text=${firstLetter}`}
                alt="Foto de perfil"
                className="w-32 h-32 rounded-full ring-4 ring-gray-200"
              />
              <span className={`absolute bottom-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${userRole === "admin" ? "bg-green-500" : "bg-blue-500"} ring-2 ring-white`}></span>
            </div>
            <h2 className="text-3xl font-bold mb-1 text-center text-gray-800">
              {userData?.nombre || "Usuario"}
            </h2>
            <p className="text-center text-md text-gray-500 mb-1">
              {userData?.email || "No disponible"}
            </p>
            <p className="text-center text-md text-gray-400 mb-6">
              {userData?.rol === "admin" ? "Administrador" : "Usuario Estándar"}
            </p>
            <button
              onClick={handleEditProfile}
              className="px-6 py-2 mb-6 text-gray-700 font-semibold rounded-full border border-gray-300 hover:bg-gray-100 transition-colors duration-200 shadow-sm"
            >
              Editar perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full max-w-sm bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg"
            >
              Cerrar Sesión
            </button>
          </div>
        );
      case "admin-panel":
        return (
          <div className="flex-1 p-4 sm:p-6 w-full max-w-2xl mx-auto md:w-full md:max-w-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">Panel de Administración</h2>
              <p className="text-gray-600">Aquí puedes gestionar usuarios y ver las tareas de mantenimiento.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Gestión de Usuarios</h3>
                  <button className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full hover:bg-blue-600 transition-colors">
                    Ver todos
                  </button>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <span>{userData?.nombre || "Usuario"} (admin)</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Mantenimientos del mes</h3>
                  <button className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full hover:bg-blue-600 transition-colors">
                    Ver calendario
                  </button>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3 text-gray-700">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.944v.933a1 1 0 001.555.832l4.5 2.75a1 1 0 001.445-.832v-.933a1 1 0 00-1.445-.832l-4.5-2.75z" clipRule="evenodd"></path></svg>
                    <span>Mantenimiento Preventivo Edificio A</span>
                  </li>
                  <li className="flex items-center space-x-3 text-gray-700">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.944v.933a1 1 0 001.555.832l4.5 2.75a1 1 0 001.445-.832v-.933a1 1 0 00-1.445-.832l-4.5-2.75z" clipRule="evenodd"></path></svg>
                    <span>Revisión de sistemas de seguridad</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <div className="hidden md:flex flex-col bg-slate-900 text-white w-64 p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-8">Panel de Usuario</h1>
        <nav className="flex-1 space-y-4">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
              activeTab === "perfil" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
            </svg>
            <span>Mi Perfil</span>
          </button>
          {userRole === "admin" && (
            <button
              onClick={() => setActiveTab("admin-panel")}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors duration-200 ${
                activeTab === "admin-panel" ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 18a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM17.25 15a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12 2.25a.75.75 极 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM7.5 15a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z"></path>
              </svg>
              <span>Panel de Administración</span>
            </button>
          )}
        </nav>
      </div>

      <main className="flex-1 flex flex-col pt-8 md:pt-12 pb-20">
        <div className="w-full flex justify-center md:hidden mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("perfil")}
              className={`py-2 px-4 rounded-full font-medium transition-colors duration-200 ${
                activeTab === "perfil" ? "bg-gray-200 text-gray-800" : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              Mi Perfil
            </button>
            {userRole === "admin" && (
              <button
                onClick={() => setActiveTab("admin-panel")}
                className={`py-2 px-4 rounded-full font-medium transition-colors duration-200 ${
                  activeTab === "admin-panel" ? "bg-gray-200 text-gray-800" : "bg-white text-gray-500 hover:bg-gray-100"
                }`}
              >
                Panel de Admin
              </button>
            )}
          </nav>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

export default Perfil;