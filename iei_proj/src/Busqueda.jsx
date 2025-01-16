import React, { useState } from "react";
import SearchForm from "./IGU/SearchForm";
import MapComponent from "./IGU/MapComponent";
import ResultsTable from "./IGU/ResultTable";
import "./index.css";

const Busqueda = () => {
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (filters) => {
    // Datos simulados (en una aplicación real, aquí iría la consulta a la API)
    const dummyResults = [
      {
        nombre: "Puente Romano",
        tipo: "Puente",
        direccion: "Calle Mayor, 12",
        localidad: "Córdoba",
        codPostal: "14001",
        provincia: "Córdoba",
        descripcion: "Un puente histórico.",
      },
      {
        nombre: "Castillo de Almodóvar",
        tipo: "Castillo-Fortaleza-Torre",
        direccion: "Avda. Castilla, 23",
        localidad: "Almodóvar",
        codPostal: "14005",
        provincia: "Córdoba",
        descripcion: "Un castillo medieval.",
      },
      // Otros resultados simulados...
    ];

  };

  return (
    <div className="container">
      <div className="top-section">
        {/* Pasa handleSearch a SearchForm */}
        <SearchForm onSearch={handleSearch} />
        <MapComponent />
      </div>
      {/* Pasa searchResults a ResultsTable */}
      <ResultsTable results={searchResults} />
    </div>
  );
};

export default Busqueda;
