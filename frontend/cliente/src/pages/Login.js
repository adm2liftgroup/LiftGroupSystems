import { useState } from "react";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos de login:", formData);
    // Aquí después se conectará al backend
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
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
        <button className="bg-green-500 text-white w-full py-2 rounded hover:bg-green-600">
          Ingresar
        </button>
      </form>
    </div>
  );
}
