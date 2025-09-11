import { useState, useEffect } from "react";
import {
  FaFolder,
  FaPlus,
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaEdit,
} from "react-icons/fa";

export default function Inicio() {
  const [montacargas, setMontacargas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNumero, setEditingNumero] = useState(null); // guardamos "Número"
  const [formData, setFormData] = useState({
    "Número": "",
    "Marca": "",
    "Modelo": "",
    "Serie": "",
    "Sistema": "",
    "Capacidad": ""
  });
  const [isOpen, setIsOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/montacargas");
        const data = await res.json();
        setMontacargas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando Montacargas:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    // e.target.name puede ser "Número" (con tilde) — usamos bracket name dinámico
    const name = e.target.name;
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingNumero) {
        // actualizar (no cambiamos "Número")
        const res = await fetch(`http://localhost:4000/api/montacargas/${encodeURIComponent(editingNumero)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "Marca": formData["Marca"],
            "Modelo": formData["Modelo"],
            "Serie": formData["Serie"],
            "Sistema": formData["Sistema"],
            "Capacidad": formData["Capacidad"]
          })
        });

        if (res.ok) {
          const updated = await res.json();
          setMontacargas(prev => prev.map(m => (String(m["Número"]) === String(editingNumero) ? updated : m)));
          setEditingNumero(null);
        } else {
          console.error("Error al actualizar montacargas");
        }
      } else {
        // crear
        const res = await fetch("http://localhost:4000/api/montacargas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          const created = await res.json();
          setMontacargas(prev => [...prev, created]);
        } else {
          console.error("Error al crear montacargas");
        }
      }

      // reset
      setFormData({
        "Número": "",
        "Marca": "",
        "Modelo": "",
        "Serie": "",
        "Sistema": "",
        "Capacidad": ""
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error en petición:", err);
    }
  };

  const handleDelete = async (numero) => {
    if (!window.confirm("¿Seguro que quieres eliminar este Montacargas?")) return;

    try {
      const res = await fetch(`http://localhost:4000/api/montacargas/${encodeURIComponent(numero)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setMontacargas(prev => prev.filter(m => String(m["Número"]) !== String(numero)));
      } else {
        console.error("Error borrando montacargas");
      }
    } catch (err) {
      console.error("Error eliminando Montacargas:", err);
    }
  };

  const handleEdit = (m) => {
    setFormData({
      "Número": m["Número"],
      "Marca": m["Marca"],
      "Modelo": m["Modelo"],
      "Serie": m["Serie"],
      "Sistema": m["Sistema"],
      "Capacidad": m["Capacidad"]
    });
    setEditingNumero(m["Número"]);
    setShowForm(true);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 text-white h-screen p-4">
        <h2 className="text-lg font-bold mb-4">Menú</h2>

        <div className="mb-2">
          <div className="flex items-center cursor-pointer mb-1 hover:text-purple-400" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FaChevronDown className="mr-2" /> : <FaChevronRight className="mr-2" />}
            <FaFolder className="mr-2" /> Montacargas
          </div>

          {isOpen && (
            <ul className="ml-6 mt-2">
              {user?.rol === "admin" && (
                <li>
                  <button onClick={() => { setEditingNumero(null); setShowForm(true); }} className="flex items-center text-sm text-purple-400 hover:text-purple-600 mb-2">
                    <FaPlus className="mr-1" /> Agregar Montacargas
                  </button>
                </li>
              )}

              {montacargas.map((m) => (
                <li key={String(m["Número"])} className="flex items-center justify-between mb-1 group">
                  <button className="flex items-center text-left w-full hover:bg-gray-800 p-1 rounded">
                    <FaFolder className="mr-2 text-yellow-400" /> {m["Número"]} - {m["Marca"]}
                  </button>

                  {user?.rol === "admin" && (
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                      <FaEdit className="text-blue-400 cursor-pointer hover:text-blue-600" onClick={() => handleEdit(m)} />
                      <FaTrash className="text-red-400 cursor-pointer hover:text-red-600" onClick={() => handleDelete(m["Número"])} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
      </div>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white shadow-lg rounded-lg p-6 w-96 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">{editingNumero ? "Editar Montacargas" : "Registrar Montacargas"}</h2>

            <form onSubmit={handleSubmit}>
              <input type="text" name="Número" value={formData["Número"]} onChange={handleChange} placeholder="Número" className="w-full border p-2 mb-2 rounded" required disabled={!!editingNumero} />

              <input type="text" name="Marca" value={formData["Marca"]} onChange={handleChange} placeholder="Marca" className="w-full border p-2 mb-2 rounded" required />

              <input type="text" name="Modelo" value={formData["Modelo"]} onChange={handleChange} placeholder="Modelo" className="w-full border p-2 mb-2 rounded" required />

              <input type="text" name="Serie" value={formData["Serie"]} onChange={handleChange} placeholder="Serie" className="w-full border p-2 mb-2 rounded" required />

              <input type="text" name="Sistema" value={formData["Sistema"]} onChange={handleChange} placeholder="Sistema" className="w-full border p-2 mb-2 rounded" required />

              <input type="text" name="Capacidad" value={formData["Capacidad"]} onChange={handleChange} placeholder="Capacidad" className="w-full border p-2 mb-4 rounded" required />

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="mr-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">{editingNumero ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

