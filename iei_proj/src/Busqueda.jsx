import React, { useState } from "react";
import SearchForm from "./IGU/SearchForm";
import MapComponent from "./IGU/MapComponent";
import ResultsTable from "./IGU/ResultTable";
import "./index.css";

const Busqueda = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (filters) => {
    setLoading(true);
    setError(null);

    try {
      // Construye los parámetros de consulta a partir de los filtros
      const queryParams = new URLSearchParams(filters).toString();

      // Realiza la petición a la API (reemplaza la URL con tu endpoint real)
      const response = await fetch(`https://tu-api.com/monumentos?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      const data = await response.json();

      // Actualiza los resultados con los datos obtenidos de la API
      setSearchResults(data);
    } catch (err) {
      console.error("Error al realizar la búsqueda:", err);
      setError("No se pudo realizar la búsqueda. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="container">
      <div className="top-section">
        {/* Pasa handleSearch a SearchForm */}
        <SearchForm onSearch={handleSearch} />
        <MapComponent results={searchResults} />
      </div>
      {/* Pasa searchResults a ResultsTable */}
      <ResultsTable results={searchResults} />
    </div>
  );
};

export default Busqueda;
