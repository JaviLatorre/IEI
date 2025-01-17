import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Index } from "./index.css";

// Importa los componentes
import Busqueda from "./Busqueda";
import DataLoad from "./DataLoad";

function App() {
  return (
    <Router>
      <div>
        {/* Barra de navegación */}
        <nav>
          <ul>
            <li>
              <Link class="link" to="/search">Busqueda</Link>
            </li>
            <li>
              <Link class="link" to="/data-load">Data Load</Link>
            </li>
          </ul>
        </nav>

        {/* Define las rutas */}
        <Routes>
          <Route path="/search" element={<Busqueda />} />
          <Route path="/data-load" element={<DataLoad />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
