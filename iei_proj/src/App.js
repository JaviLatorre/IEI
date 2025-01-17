import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Busqueda from "./Busqueda";
import DataLoad from "./DataLoad";
import "./App.css"; // Importar estilos

function App() {
  const [activePage, setActivePage] = useState("search"); // Estado inicial "search"
  const navigate = useNavigate();

  const togglePage = () => {
    const newPage = activePage === "search" ? "data-load" : "search";
    setActivePage(newPage);
    navigate(`/${newPage}`);
  };

  return (
    <div>
      {/* Contenedor del botón deslizante */}
      <div className="slider-container">
        <div
          className={`slider ${activePage === "search" ? "left" : "right"}`}
          onClick={togglePage}
        >
          <span className="slider-label">Busqueda</span>
          <span className="slider-label">Data Load</span>
        </div>
      </div>

      {/* Define las rutas */}
      <Routes>
        {/* Redirige la ruta base ("/") a "search" */}
        <Route path="/" element={<Navigate to="/search" />} />
        <Route path="/search" element={<Busqueda />} />
        <Route path="/data-load" element={<DataLoad />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
