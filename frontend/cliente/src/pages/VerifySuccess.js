import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export default function VerifySuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verificando tu cuenta...");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setMessage("Token de verificación no encontrado.");
      setIsLoading(false);
      return;
    }

    // Verificar el token con el backend
    const verifyAccount = async () => {
      try {
        setIsLoading(true);
        console.log("Verificando token:", token);
        
        const response = await axios.get(`${API_URL}/auth/verify?token=${token}`);
        console.log("Respuesta del backend:", response.data);
        
        if (response.data.success) {
          setMessage("¡Cuenta verificada exitosamente!");
          setIsSuccess(true);
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          setMessage(`${response.data.error || "Error al verificar la cuenta"}`);
          setIsSuccess(false);
        }
      } catch (error) {
        console.error("Error verificando cuenta:", error);
        
        // Manejo específico de diferentes tipos de error
        if (error.response) {
          // El servidor respondió con un status code fuera del rango 2xx
          const errorMsg = error.response.data?.error || error.response.data?.message;
          setMessage(`${errorMsg || "Error del servidor"}`);
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          setMessage("Error de conexión. Por favor intenta nuevamente.");
        } else {
          // Algo pasó al configurar la petición
          setMessage("Error inesperado. Por favor intenta nuevamente.");
        }
        
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAccount();
  }, [searchParams, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Verificando...</h1>
          <p className="text-gray-700">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <h1 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {isSuccess ? '¡Cuenta Verificada!' : 'Error de Verificación'}
        </h1>
        <p className="text-gray-700 mb-6">{message}</p>
        
        {isSuccess ? (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-4">Serás redirigido al login automáticamente...</p>
            <button
              onClick={() => navigate("/")}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ir al Login Ahora
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
            >
              Volver a Registrarse
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ir al Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}