import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// Se obtiene la URL de la API desde variables de entorno
const API_URL = 'https://liftgroupsystems.onrender.com';

// DEBUG: Verificar que la variable se carga
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('URL completa login:', `${process.env.REACT_APP_API_URL}/auth/login`);

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Hook para redirigir después del login 
  const navigate = useNavigate();

  // BLOQUE 1: Manejo de cambios en inputs
  const handleChange = (e) => { // Actualiza dinámicamente email o password según el input
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  // FIN DEL BLOQUE 1: Manejo de cambios en inputs 

  // BLOQUE 2: Manejo del envío del formulario (login)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita recargar la página

    try { // Se envían credenciales al backend
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // para cookies/sesiones
      });

      const data = await response.json();

      if (response.ok) { // login exitoso
        console.log("Login exitoso:", data);
        console.log("Datos del usuario recibidos:", data.user);
        console.log("Token recibido:", data.token); // DEBUG del token
        
        // GUARDAR EL TOKEN EN LOCALSTORAGE 
        if (data.token) {
          localStorage.setItem("token", data.token);
          console.log("Token guardado en localStorage");
        }
        
        // Guardar info de usuario en localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Verificar qué se guardó en localStorage
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        console.log("Usuario guardado en localStorage:", JSON.parse(storedUser));
        console.log("Token guardado en localStorage:", storedToken);

        // Redirigir a la página principal
        navigate("/inicio");
      } else {
        alert(data.error || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("Error de conexión");
    }
  };
  // FIN DEL BLOQUE 2: Manejo del envío del formulario (login)

  // BLOQUE 3: Renderizado del formulario de login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h2>

        {/* Campo de correo */}
        <input
          type="email"
          name="email"
          placeholder="Correo"
          className="w-full p-2 border rounded mb-3"
          onChange={handleChange}
        />

        {/* Campo de contraseña */}
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded mb-3"
          onChange={handleChange}
        />

        {/* Botón de enviar */}
        <button className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition">
          Ingresar
        </button>

        {/* Enlace a registro */}
        <p className="text-sm text-center mt-4">
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
  // FIN DEL BLOQUE 3: Renderizado del formulario de login