import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // 👈 importante para cookies httpOnly
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login exitoso:", data);

        // 👇 Guardar info de usuario (id, email, rol) en localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/inicio"); // Redirige al inicio
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

        {/* Aquí va el link de registro */}
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
