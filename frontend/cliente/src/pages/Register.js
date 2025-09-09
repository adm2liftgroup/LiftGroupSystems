import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
      return;
    }
    if (!validateEmail(form.email)) {
      setMessage({ type: "error", text: "Email inválido" });
      return;
    }
    if (form.password.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      const res = await axios.post(
        "http://localhost:4000/auth/register",
        { nombre: form.nombre, email: form.email, password: form.password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: res.data.message });
        setTimeout(() => navigate("/login"), 2000); // Redirige después de 2 segundos
      } else {
        setMessage({ type: "error", text: res.data.error || "Error inesperado" });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.map((e) => e.msg).join(", ") ||
        "Error al registrar";
      setMessage({ type: "error", text: msg });
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
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña (min 6)"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirmar contraseña"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
        </form>
    </div>
  );
}