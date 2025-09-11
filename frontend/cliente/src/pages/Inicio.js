import { useState, useEffect } from "react";
import { FaFolder, FaPlus, FaChevronDown, FaChevronRight } from "react-icons/fa";

export default function Inicio() {
  const [montacargas, setMontacargas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    numero: "",
    marca: "",
    modelo: "",
    serie: "",
    sistema: "",
    capacidad: ""
  });
  const [isOpen, setIsOpen] = useState(false); // controlar el desplegable

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/montacargas");
        const data = await res.json();
        setMontacargas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando montacargas:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/api/montacargas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const newMontacargas = await res.json();
        setMontacargas([...montacargas, newMontacargas]);
        setFormData({
          numero: "",
          marca: "",
          modelo: "",
          serie: "",
          sistema: "",
          capacidad: ""
        });
        setShowForm(false);
      } else {
        console.error("Error al guardar");
      }
    } catch (err) {
      console.error("Error en petición:", err);
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white h-screen p-4">
        <h2 className="text-lg font-bold mb-4">Menú</h2>

        {/* Menú Montacargas */}
        <div className="mb-2">
          <div
            className="flex items-center cursor-pointer mb-1 hover:text-purple-400"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <FaChevronDown className="mr-2" />
            ) : (
              <FaChevronRight className="mr-2" />
            )}
            <FaFolder className="mr-2" /> Montacargas
          </div>

          {/* Lista desplegable */}
          {isOpen && (
            <ul className="ml-6 mt-2">
              {/* Botón agregar solo si es admin */}
              {user?.rol === "admin" && (
                <li>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center text-sm text-purple-400 hover:text-purple-600 mb-2"
                  >
                    <FaPlus className="mr-1" /> Agregar Montacargas
                  </button>
                </li>
              )}

              {montacargas.map((m, i) => (
                <li key={i} className="flex items-center mb-1 cursor-pointer">
                  <FaFolder className="mr-2 text-yellow-400" /> {m.Marca} - {m.Modelo}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
      </div>

      {/* Modal del formulario */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white shadow-lg rounded-lg p-6 w-96 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Registrar Montacargas</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                placeholder="Número"
                className="w-full border p-2 mb-2 rounded"
                required
              />
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Marca"
                className="w-full border p-2 mb-2 rounded"
                required
              />
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Modelo"
                className="w-full border p-2 mb-2 rounded"
                required
              />
              <input
                type="text"
                name="serie"
                value={formData.serie}
                onChange={handleChange}
                placeholder="Serie"
                className="w-full border p-2 mb-2 rounded"
                required
              />
              <input
                type="text"
                name="sistema"
                value={formData.sistema}
                onChange={handleChange}
                placeholder="Sistema"
                className="w-full border p-2 mb-2 rounded"
                required
              />
              <input
                type="text"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                placeholder="Capacidad"
                className="w-full border p-2 mb-4 rounded"
                required
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="mr-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
