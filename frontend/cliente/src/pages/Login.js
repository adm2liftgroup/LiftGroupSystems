import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Login exitoso:", data);
        console.log("👤 Datos del usuario recibidos:", data.user); // ← DEBUG
        
        // Verificar qué campos tiene el usuario
        if (data.user) {
          console.log("🔍 Campos del usuario:");
          console.log("   - id:", data.user.id);
          console.log("   - nombre:", data.user.nombre);
          console.log("   - email:", data.user.email);
          console.log("   - rol:", data.user.rol);
        }

        // Guardar info de usuario en localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Verificar qué se guardó en localStorage
        const storedUser = localStorage.getItem("user");
        console.log("💾 Usuario guardado en localStorage:", JSON.parse(storedUser));

        navigate("/inicio");
      } else {
        alert(data.error || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h2>

        <input
          type="email"
          name="email"
          placeholder="Correo"
          className="w-full p-2 border rounded mb-3"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded mb-3"
          onChange={handleChange}
        />

        <button className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition">
          Ingresar
        </button>

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