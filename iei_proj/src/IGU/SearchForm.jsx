import React, { useState } from "react";
import "../index.css";


const SearchForm = ({ onSearch }) => {
  const [filters, setFilters] = useState({
    localidad: "",
    codPostal: "",
    provincia: "",
    tipo: "Yacimiento Arqueológico",
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
        <option value="Yacimiento Arqueologico">Yacimiento Arqueológico</option>
        <option value="Iglesia-Ermita">Iglesia-Ermita</option>
        <option value="Monasterio-Convento">Monasterio-Convento</option>
        <option value="Castillo-Fortaleza-Torre">Castillo-Fortaleza-Torre</option>
        <option value="Edificio Singular">Edificio Singular</option>
        <option value="Otros">Otros</option>
      </select>
      <div>
        <button type="button" className="cancel-button">Cancelar</button>
        <button type="submit" className="search-button">Buscar</button>
      </div>
    </form>
  );
};

export default SearchForm;
