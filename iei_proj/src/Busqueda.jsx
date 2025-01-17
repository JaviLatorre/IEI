import React, { useState } from "react";
import SearchForm from "./IGU/SearchForm";
import MapComponent from "./IGU/MapComponent";
import ResultsTable from "./IGU/ResultTable";
import "./index.css";
import { map } from "leaflet";

const Busqueda = () => {
  const initialFilters = { campo1: "", campo2: "" }; // Estado inicial del formulario

  const [searchResults, setSearchResults] = useState([]);
  const [mapResults, setMapResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters); // Almacena los valores del formulario

  const handleSearch = async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams(filters).toString();
      console.log(queryParams);

      const response = await fetch(`http://localhost:3005/search?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Respuesta de la API: ", data);

      setSearchResults(data);
    } catch (err) {
      console.error("Error al realizar la búsqueda:", err);
      setError("No se pudo realizar la búsqueda. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };


  const handleCancel = () => {
    setSearchResults([]); // Vacía los resultados de búsqueda
    setError(null); // Limpia el mensaje de error
    setLoading(false); // Detiene cualquier estado de carga
    setFilters(initialFilters); // Restaura los filtros a su estado inicial
  };

  

  console.log('datos para el mapa:',mapResults);
  return (
    <div className="container">
      <div className="top-section">
        {/* Pasa filtros, handleSearch y handleCancel al formulario */}
        <SearchForm
          onSearch={handleSearch}
          onCancel={handleCancel}
          filters={filters}
          setFilters={setFilters}
        />
        <MapComponent/>
      </div>
      {error && <div className="error-message">{error}</div>}
      <ResultsTable results={searchResults} />
    </div>
  );
};

export default Busqueda;
