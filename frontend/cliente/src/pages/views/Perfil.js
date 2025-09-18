import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Función para cerrar sesión
  const handleLogout = () => {
    // Elimina los datos del usuario de localStorage
    localStorage.removeItem("user");
    // Redirige al usuario a la página de inicio
    navigate("/");
  };

  // Cargar la información del usuario al montar el componente
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Si no hay datos de usuario, redirigir al login
        navigate("/");
      }
    } catch (error) {
      console.error("Error al leer el usuario de localStorage:", error);
      navigate("/");
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-6 text-purple-700">Mi Perfil</h2>
        <div className="mb-4">
          <p className="text-gray-600 font-semibold">Nombre:</p>
          <p className="text-lg text-gray-900">{user.nombre}</p>
        </div>
        <div className="mb-4">
          <p className="text-gray-600 font-semibold">Correo:</p>
          <p className="text-lg text-gray-900">{user.email}</p>
        </div>
        <div className="mb-6">
          <p className="text-gray-600 font-semibold">Rol:</p>
          <p className="text-lg text-gray-900 capitalize">{user.rol}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
