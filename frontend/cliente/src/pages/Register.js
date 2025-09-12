// src/pages/Register.js
import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

// fallback si no tienes REACT_APP_API_URL en .env
const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.193:4000";

export default function Register() {
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones cliente
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

      const res = await axios.post(
        `${API_URL}/auth/register`,
        { nombre: form.nombre, email: form.email, password: form.password },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (res.data?.success) {
        setMessage({ type: "success", text: res.data.message || "Registro exitoso. Revisa tu correo." });
        window.scrollTo(0, 0);

        // redirigir a la ruta de login que ya tienes ("/")
        setTimeout(() => {
          navigate("/"); // <- si tu Login está en "/", mantenlo así
          // si prefieres usar /login en App.js, cámbialo por navigate("/login")
        }, 2000);
      } else {
        setMessage({ type: "error", text: res.data?.error || "Error inesperado al registrar." });
        window.scrollTo(0, 0);
      }
    } catch (err) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Registro</h2>

        {message.text && (
          <div
            className={`mb-4 p-2 rounded text-center ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
            {/* Si es success mostramos link inmediato al Login */}
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
