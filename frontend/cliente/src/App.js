import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import VerifySuccess from "./pages/VerifySuccess";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Rutas */}
        <Routes>
          {/* Ahora la raíz muestra directamente el Login */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/verify-success" element={<VerifySuccess />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
