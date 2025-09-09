import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Barra de navegación */}
        <nav className="bg-blue-600 text-white p-4 flex justify-between">
          <h1 className="font-bold">LiftGroup Systems</h1>
          <div>
            <Link to="/register" className="px-3 hover:underline">Registro</Link>
            <Link to="/login" className="px-3 hover:underline">Iniciar Sesión</Link>
          </div>
        </nav>

        {/* Rutas */}
        <Routes>
          <Route path="/" element={<h2 className="p-4">Bienvenido 🚀</h2>} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
