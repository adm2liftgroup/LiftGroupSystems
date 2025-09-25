import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

// URL de la API: Primero toma el .env, si no existe usa la API local como fallback 
const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.193:4000";

// Componente principal Register
export default function Register() {
  // Estados para manejar formulario, carga y mensajes 
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate(); // Hook para navegación 

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value }); // Acualiza valores del formulario

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Valida que el email tenga un formato correcto

  // BLOQUE 1: Envío del formulario de registro
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones en el cliente antes de enviar 
    if (!form.nombre.trim()) {
      setMessage({ type: "error", text: "Nombre requerido" });
      window.scrollTo(0, 0);
      return;
    }
    if (!validateEmail(form.email)) {
      setMessage({ type: "error", text: "Email inválido" });
      window.scrollTo(0, 0);
      return;
    }
    if (form.password.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      window.scrollTo(0, 0);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      window.scrollTo(0, 0);
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const res = await axios.post( // Peticiones POST al backend para registrar
        `${API_URL}/auth/register`,
        { nombre: form.nombre, email: form.email, password: form.password },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (res.data?.success) { // Registro exitoso
        setMessage({ type: "success", text: res.data.message || "Registro exitoso. Revisa tu correo." });
        window.scrollTo(0, 0);

        // redirigir a la ruta después de 2 segundos
        setTimeout(() => {
          navigate("/"); 
        }, 2000);
      } else { // Error desde el backend
        setMessage({ type: "error", text: res.data?.error || "Error inesperado al registrar." });
        window.scrollTo(0, 0);
      }
    } catch (err) { //Error de conexión o validaciones del servidor
      console.error("Register error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.map((e) => e.msg).join(", ") ||
        (err.code === "ECONNABORTED" ? "Tiempo de espera agotado" : "Error al conectar con el servidor");
      setMessage({ type: "error", text: msg });
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };
  // FIN DEL BLOQUE 1: Envío del formulario de registro

  // BLOQUE 2: Renderizado del formulario de registro
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Registro</h2>

        {/* Mensaje de error o éxito */}
        {message.text && (
          <div
            className={`mb-4 p-2 rounded text-center ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
            {/* Si es success se muestra el link inmediato al Login */}
            {message.type === "success" && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Ir al Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* Campos de entrada */}
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
          disabled={loading}
        />
        <input
          name="email"
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
          disabled={loading}
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña (min 6)"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
          disabled={loading}
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirmar contraseña"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
          disabled={loading}
        />

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          <Link to="/" className="flex-1 text-center py-2 rounded border border-gray-300 hover:bg-gray-100">
            Volver al Login
          </Link>
        </div>
      </form>
    </div>
  );
}
// FIN DEL BLOQUE: Renderizado del formulario de registro