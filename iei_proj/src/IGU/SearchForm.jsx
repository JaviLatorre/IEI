import React, { useState } from "react";
import "../index.css";

const SearchForm = ({ onSearch, onCancel }) => {
  // Estado inicial del formulario
  const initialFilters = {
    localidad: "",
    codPostal: "",
    provincia: "",
    tipo: "Yacimiento Arqueológico",
  };

  const [filters, setFilters] = useState(initialFilters);

  // Función para actualizar los filtros cuando cambia un campo del formulario
  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters); // Llama a la función onSearch para hacer la búsqueda
  };

  // Función para manejar el cancelado (restablecer los campos y llamar a onCancel)
  const handleCancel = () => {
    setFilters(initialFilters); // Restaura el estado inicial del formulario
    onCancel(); // Llama a onCancel para vaciar los resultados y resetear el estado en el componente padre
  };

  return (
    <form
      className="search-form"
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <h2>Buscador de monumentos de interés cultural</h2>
      <input
        type="text"
        name="localidad"
        placeholder="Localidad"
        value={filters.localidad}
        onChange={handleChange}
      />
      <input
        type="text"
        name="codPostal"
        placeholder="Código Postal"
        value={filters.codPostal}
        onChange={handleChange}
      />
      <input
        type="text"
        name="provincia"
        placeholder="Provincia"
        value={filters.provincia}
        onChange={handleChange}
      />
      <select name="tipo" value={filters.tipo} onChange={handleChange}>
        <option value="Yacimiento Arqueológico">Yacimiento Arqueológico</option>
        <option value="Iglesia-Ermita">Iglesia-Ermita</option>
        <option value="Monasterio-Convento">Monasterio-Convento</option>
        <option value="Castillo-Fortaleza-Torre">Castillo-Fortaleza-Torre</option>
        <option value="Edificio Singular">Edificio Singular</option>
        <option value="Puente">Puente</option>
        <option value="Otros">Otros</option>
      </select>
      <div>
        <button type="button" className="cancel-button" onClick={handleCancel}>
          Cancelar
        </button>
        <button type="submit" className="search-button">
          Buscar
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
