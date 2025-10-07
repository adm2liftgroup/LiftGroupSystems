import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Página para mostrar el mensaje de verificación exitosa
export default function VerifySuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verificando tu cuenta...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setMessage("Token de verificación no encontrado.");
      return;
    }

    // Verificar el token con el backend
    const verifyAccount = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/verify?token=${token}`);
        
        if (response.status === 200) {
          setMessage("✅ ¡Cuenta verificada exitosamente!");
          setIsSuccess(true);
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      } catch (error) {
        console.error("Error verificando cuenta:", error);
        setMessage("❌ Error al verificar la cuenta. El token puede haber expirado.");
        setIsSuccess(false);
      }
    };

    verifyAccount();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <h1 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-green-600' : 'text-blue-600'}`}>
          {isSuccess ? '✅ ¡Cuenta Verificada!' : '🔍 Verificando...'}
        </h1>
        <p className="text-gray-700 mb-6">{message}</p>
        
        {isSuccess && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-4">Serás redirigido al login automáticamente...</p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir al Login Ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}