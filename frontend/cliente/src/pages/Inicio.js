import { useState, useEffect } from "react";

import {
  FaFolder,
  FaPlus,
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaEdit,
  FaBars,
  FaSearch,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";

import InformacionEquipo from "./views/InformacionEquipo";
import ServiciosHistorial from "./views/ServiciosHistorial";
import InversionInicial from "./views/InversionHabilitar";
import InversionHabilitar from "./views/InversionInicial";
import RefaccionesCargo from "./views/RefaccionesCargo";
import ProgramasPreventivos from "./views/ProgramasPreventivos";
import Perfil from "./views/Perfil";

const API_URL = process.env.REACT_APP_API_URL;

// BLOQUE 1: Componente principal Inicio
export default function Inicio() {
  const [montacargas, setMontacargas] = useState([]);
  const [filteredMontacargas, setFilteredMontacargas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNumero, setEditingNumero] = useState(null);
  const [formData, setFormData] = useState({
    numero: "",
    Marca: "",
    Modelo: "",
    Serie: "",
    Sistema: "",
    Capacidad: "",
    Ubicacion: "",
    Planta: ""
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMontacargas, setSelectedMontacargas] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [user, setUser] = useState(null);

  // BLOQUE 2: Cargar usuario desde localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error al obtener el usuario de localStorage:", error);
      setUser(null);
    }
  }, []);
  // FIN DEL BLOQUE 2: Cargar usuario desde localStorage 

  // BLOQUE 3: Cargar montacargas desde API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/montacargas`);
        const data = await res.json();
        setMontacargas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando Montacargas:", err);
      }
    };
    fetchData();
  }, []);
  // FIN DEL BLOQUE 3: Cargar montacargas desde API 

  // BLOQUE 4: Filtrado de montacargas 
  useEffect(() => {
    const filtered = montacargas.filter(m =>
      m.numero.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.Marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.Modelo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMontacargas(filtered);

    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm, montacargas]);
  // FIN DEL BLOQUE 4: Filtrado de montacargas

  // BLOQUE 5: Paginación 
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMontacargas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMontacargas.length / itemsPerPage);
  // FIN DEL BLOQUE 5: Paginación 

  //  BLOQUE 6: Funciones de manejo de formulario y eventos
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // BLOQUE 7: Manejo de formulario (crear/editar)
 const handleSubmit = async (e) => {
  e.preventDefault();

  const currentSelected = selectedMontacargas;
  const currentActiveTab = activeTab;
  const currentPageBeforeEdit = currentPage;

  try {
    if (editingNumero) {
      // actualizar montacargas existente 
      const res = await fetch(`${API_URL}/api/montacargas/${encodeURIComponent(editingNumero)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Marca: formData.Marca,
          Modelo: formData.Modelo,
          Serie: formData.Serie,
          Sistema: formData.Sistema,
          Capacidad: formData.Capacidad,
          Ubicacion: formData.Ubicacion,
          Planta: formData.Planta
        })
      });

      if (res.ok) {
        const updated = await res.json();
        console.log('✅ Montacargas actualizado:', updated);
        
        setMontacargas(prev =>
          prev.map(m => (String(m.numero) === String(editingNumero) ? updated : m))
        );
        
        // MANTENER LA SELECCIÓN ACTUAL después de editar
        if (currentSelected && String(currentSelected.numero) === String(editingNumero)) {
          setSelectedMontacargas(updated);
          setActiveTab(currentActiveTab);
          setCurrentPage(currentPageBeforeEdit);
        }
        
        setEditingNumero(null);
        setShowForm(false);
        
        // LIMPIAR FORMULARIO después de editar exitosamente
        setFormData({
          numero: "",
          Marca: "",
          Modelo: "",
          Serie: "",
          Sistema: "",
          Capacidad: "",
          Ubicacion: "",
          Planta: ""
        });
      }
    } else {
      // Crear nuevo montacargas
      const res = await fetch(`${API_URL}/api/montacargas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const created = await res.json();
        console.log('✅ Montacargas creado:', created);
        setMontacargas(prev => [...prev, created]);
        setShowForm(false);
        
        // LIMPIAR FORMULARIO después de crear exitosamente
        setFormData({
          numero: "",
          Marca: "",
          Modelo: "",
          Serie: "",
          Sistema: "",
          Capacidad: "",
          Ubicacion: "",
          Planta: ""
        });
      }
    }
  } catch (err) {
    console.error("Error en petición:", err);
    
    // En caso de error, mantener la selección
    setSelectedMontacargas(currentSelected);
    setActiveTab(currentActiveTab);
    setCurrentPage(currentPageBeforeEdit);
  }
};
  // FIN DEL BLOQUE 7: Manejo de formulario 

  // BLOQUE 8: Eliminar montacargas
  const handleDelete = async (numero) => {
    if (!window.confirm("¿Seguro que quieres eliminar este Montacargas?")) return;

    try {
      const res = await fetch(`${API_URL}/api/montacargas/${encodeURIComponent(numero)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setMontacargas(prev =>
          prev.filter(m => String(m.numero) !== String(numero))
        );
        // Si el eliminado estaba seleccionado, limpiar selección
        if (selectedMontacargas && String(selectedMontacargas.numero) === String(numero)) {
          setSelectedMontacargas(null);
          setActiveTab(null);
        }
      } else {
        console.error("Error borrando montacargas");
      }
    } catch (err) {
      console.error("Error eliminando Montacargas:", err);
    }
  };
  // FIN DEL BLOQUE 8: Eliminar montacargas

  // BLOQUE 9: Preparar edición y funciones de formulario
  const handleEdit = (m) => {
    setFormData({
      numero: m.numero,
      Marca: m.Marca,
      Modelo: m.Modelo,
      Serie: m.Serie,
      Sistema: m.Sistema,
      Capacidad: m.Capacidad,
      Ubicacion: m.Ubicacion || "",
      Planta: m.Planta || ""
    });
    setEditingNumero(m.numero);
    setShowForm(true);
  };

  // FUNCIÓN: Preparar formulario para NUEVO montacargas
  const handleNewMontacargas = () => {
    setFormData({
      numero: "",
      Marca: "",
      Modelo: "",
      Serie: "",
      Sistema: "",
      Capacidad: "",
      Ubicacion: "",
      Planta: ""
    });
    setEditingNumero(null);
    setShowForm(true);
  };

  // FUNCIÓN MEJORADA: Cancelar formulario
  const handleCancelForm = () => {
    setShowForm(false);
    // Limpiar el formulario después de cerrar el modal
    setTimeout(() => {
      setFormData({
        numero: "",
        Marca: "",
        Modelo: "",
        Serie: "",
        Sistema: "",
        Capacidad: "",
        Ubicacion: "",
        Planta: ""
      });
      setEditingNumero(null);
    }, 300);
  };
  // FIN DEL BLOQUE 9: Preparar edición y funciones de formulario

  // BLOQUE 11: Función para actualizar montacargas seleccionado
  const actualizarMontacargasSeleccionado = (nuevosDatos) => {
    console.log('🔄 Actualizando montacargas seleccionado:', nuevosDatos);
    setSelectedMontacargas(nuevosDatos);
    
    // También actualizar en la lista general
    setMontacargas(prev => 
      prev.map(m => 
        String(m.numero) === String(nuevosDatos.numero) ? nuevosDatos : m
      )
    );
  };

  // ⭐⭐ BLOQUE 12: Debug useEffect
  useEffect(() => {
    console.log('📥 selectedMontacargas actualizado:', selectedMontacargas);
  }, [selectedMontacargas]);

  // BLOQUE 10: Return UI principal
  return (
    <div className="flex flex-col md:flex-row">
      {/* Botón de menú móvil */}
      <div className="md:hidden bg-gray-900 p-2 flex justify-between items-center">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2"
        >
          <FaBars />
        </button>
        <h1 className="text-white text-lg font-bold">Sistema Montacargas</h1>
      </div>

      {/* Sidebar */}
      <div 
        className={`w-full md:w-80 bg-gray-900 text-white md:h-screen p-4 fixed md:relative z-10 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ height: '100vh', overflowY: 'auto' }}
      >
        <button 
          className="md:hidden absolute top-4 right-4 text-white"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ✕
        </button>
        
        <h2 className="text-lg font-bold mb-4">Menú</h2>

        {/* Icono de usuario y nombre */}
        {user && (
          <div
            className="flex items-center space-x-2 mb-4 p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => {
              setActiveTab("Perfil");
              setSelectedMontacargas(null);
              setIsMobileMenuOpen(false);
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-8 h-8 text-purple-400"
            >
              <path 
                fillRule="evenodd" 
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 1.331.29 2.613.832 3.815A8.694 8.694 0 0012 21.75c1.233 0 2.408-.344 3.465-.957a1.652 1.652 0 002.668 1.054c.677-.853.585-1.583.486-1.748.163-.092.327-.19.491-.29A9.723 9.723 0 0018.685 19.097zM12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5zm-2.25-6a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0z" 
                clipRule="evenodd" 
              />
            </svg>
            <div>
              <span className="text-sm font-semibold">
                {user.nombre || user.email}
              </span>
              <span className="block text-xs text-gray-400">
                {user.rol}
              </span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar montacargas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            />
            <FaSearch className="absolute left-2 top-3 text-gray-400" />
          </div>
        </div>

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
            <span className="ml-2 text-sm text-gray-400">({filteredMontacargas.length})</span>
          </div>

          {isOpen && (
            <div>
              {user?.rol === "admin" && (
                <button
                  onClick={handleNewMontacargas}
                  className="flex items-center text-sm text-purple-400 hover:text-purple-600 mb-2 ml-6"
                >
                  <FaPlus className="mr-1" /> Agregar Montacargas
                </button>
              )}

              <div className="mb-2 ml-4 flex items-center">
                <span className="text-sm text-gray-400 mr-2">Mostrar:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-gray-800 text-white p-1 rounded text-sm"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <ul className="ml-4 mt-2">
                {currentItems.map((m) => (
                  <li
                    key={String(m.numero)}
                    className="flex items-center justify-between mb-1 group"
                  >
                    <button
                      className="flex items-center text-left w-full hover:bg-gray-800 p-1 rounded"
                      onClick={() => {
                        setSelectedMontacargas(m);
                        setActiveTab(null);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <FaFolder className="mr-2 text-yellow-400" /> {m.numero} -{" "}
                      {m.Marca}
                    </button>

                    {user?.rol === "admin" && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                        <FaEdit
                          className="text-blue-400 cursor-pointer hover:text-blue-600"
                          onClick={() => handleEdit(m)}
                        />
                        <FaTrash
                          className="text-red-400 cursor-pointer hover:text-red-600"
                          onClick={() => handleDelete(m.numero)}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-4 space-x-2 ml-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="p-1 rounded bg-gray-800 disabled:opacity-50"
                  >
                    <FaAngleLeft />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Mostrar páginas alrededor de la actual
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`w-8 h-8 rounded ${
                          currentPage === pageNum
                            ? "bg-purple-600 text-white"
                            : "bg-gray-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded bg-gray-800 disabled:opacity-50"
                  >
                    <FaAngleRight />
                  </button>
                  
                  <span className="text-sm text-gray-400">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay para móviles */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Panel principal */}
      <div className="flex-1 p-4 md:p-6">
        {!selectedMontacargas && activeTab !== "Perfil" ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Bienvenido</h1>
            <p className="text-gray-600 text-center">
              Selecciona un montacargas del menú para ver su información
            </p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {activeTab === "Perfil" ? "Perfil de Usuario" : `${selectedMontacargas.numero} - ${selectedMontacargas.Marca}`}
              </h2>
              <button
                className="md:hidden bg-gray-200 p-2 rounded"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <FaBars />
              </button>
            </div>

            {/* Submenú - Solo muestra las pestañas relacionadas con montacargas cuando hay uno seleccionado */}
{selectedMontacargas && (
  <div className="flex gap-2 mb-4 flex-wrap">
    {user?.rol === "admin" ? (
      // TODAS LAS OPCIONES PARA ADMIN
      [
        "Información del equipo",
        "Servicios Preventivos Historial", 
        "Inversión Habilitar",
        "Inversión Inicial",
        "Refacciones con Cargo",
        "Programas Preventivos"
      ].map((tab) => (
        <button
          key={tab}
          className={`px-3 py-1 text-sm md:px-4 md:py-2 md:text-base rounded ${
            activeTab === tab
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))
    ) : (
      // SOLO 3 OPCIONES PARA USUARIOS NORMALES
      [
        "Servicios Preventivos Historial",
        "Refacciones con Cargo", 
        "Programas Preventivos"
      ].map((tab) => (
        <button
          key={tab}
          className={`px-3 py-1 text-sm md:px-4 md:py-2 md:text-base rounded ${
            activeTab === tab
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))
    )}
  </div>
)}

            {/* Contenido dinámico */}
            <div className="p-4 border rounded bg-gray-100 overflow-x-auto">
              {activeTab === "Información del equipo" && (
                <InformacionEquipo 
                 montacargas={selectedMontacargas}
                 onMontacargasUpdate={actualizarMontacargasSeleccionado}
               />
              )}
              {activeTab === "Servicios Preventivos Historial" && (
                <ServiciosHistorial montacargas={selectedMontacargas} />
              )}
              {activeTab === "Inversión Inicial" && (
                selectedMontacargas ? (
                <InversionInicial montacargasId={selectedMontacargas.numero} />
              ) : (
                <div className="p-6 text-center text-gray-500">
                No se ha seleccionado un montacargas
                </div>
                )
              )}
              {activeTab === "Inversión Habilitar" && (
                selectedMontacargas ? (
                <InversionHabilitar montacargasId={selectedMontacargas.numero} />
                ) : (
                <div className="p-6 text-center text-gray-500">
                No se ha seleccionado un montacargas
                </div>
                )
              )}
              
              {activeTab === "Refacciones con Cargo" && (
                <RefaccionesCargo montacargas={selectedMontacargas}/>
              )}
              {activeTab === "Programas Preventivos" && (
                <ProgramasPreventivos id={selectedMontacargas.numero} />
              )}
              {activeTab === "Perfil" && <Perfil />}
              
              {!activeTab && selectedMontacargas && (
                <div className="text-center text-gray-500 py-8">
                  Selecciona una pestaña para ver la información
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 w-11/12 md:w-96 max-h-screen overflow-y-auto animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">
              {editingNumero ? "Editar Montacargas" : "Registrar Montacargas"}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                placeholder="Número"
                className="w-full border p-2 mb-2 rounded"
                required
                disabled={!!editingNumero}
              />

              <input
                type="text"
                name="Marca"
                value={formData.Marca}
                onChange={handleChange}
                placeholder="Marca"
                className="w-full border p-2 mb-2 rounded"
                required
              />

              <input
                type="text"
                name="Modelo"
                value={formData.Modelo}
                onChange={handleChange}
                placeholder="Modelo"
                className="w-full border p-2 mb-2 rounded"
                required
              />

              <input
                type="text"
                name="Serie"
                value={formData.Serie}
                onChange={handleChange}
                placeholder="Serie"
                className="w-full border p-2 mb-2 rounded"
                required
              />

              <input
                type="text"
                name="Sistema"
                value={formData.Sistema}
                onChange={handleChange}
                placeholder="Sistema"
                className="w-full border p-2 mb-2 rounded"
                required
              />

              <input
                type="text"
                name="Capacidad"
                value={formData.Capacidad}
                onChange={handleChange}
                placeholder="Capacidad"
                className="w-full border p-2 mb-2 rounded"
                required
              />

              <input
                type="text"
                name="Ubicacion"
                value={formData.Ubicacion}
                onChange={handleChange}
                placeholder="Ubicación"
                className="w-full border p-2 mb-2 rounded"
                required
              />

              <input
                type="text"
                name="Planta"
                value={formData.Planta}
                onChange={handleChange}
                placeholder="Planta"
                className="w-full border p-2 mb-4 rounded"
                required
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="mr-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  {editingNumero ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  // FIN DEL BLOQUE 10: Return UI principal
}
// FIN DEL BLOQUE 1: Componente Inicio