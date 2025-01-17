import React, { useState } from "react";
import "./index.css";

const DataLoad = () => {
  const [selectedSources, setSelectedSources] = useState({
    selectAll: false,
    castillaLeon: false,
    comunitatValenciana: false,
    euskadi: false,
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (name === "selectAll") {
      setSelectedSources({
        selectAll: checked,
        castillaLeon: checked,
        comunitatValenciana: checked,
        euskadi: checked,
      });
    } else {
      setSelectedSources((prev) => ({
        ...prev,
        [name]: checked,
        selectAll: false, // Desmarca "Seleccionar todas" si se selecciona individualmente
      }));
    }
  };

  const fetchDataFromSources = async (source) => {
    try {
      const response = await fetch(`http://localhost:3004/api/extractores?fuente=${encodeURIComponent(source)}`, {method: 'POST'});
      if (!response.ok) {
        throw new Error(`Error al cargar datos desde ${source}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error(err);
      throw new Error(`No se pudo cargar datos desde ${source}.`);
    }
  };

  const handleLoadData = async () => {
    const sources = [];
    if (selectedSources.castillaLeon) sources.push("Castilla y León");
    if (selectedSources.comunitatValenciana) sources.push("Comunitat Valenciana");
    if (selectedSources.euskadi) sources.push("Euskadi");
    if (selectedSources.selectAll) sources.push("Seleccionar todas");

    if (sources.length === 0) {
      alert("Seleccione al menos una fuente de datos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(sources.map(fetchDataFromSources));
      const combinedResults = responses.reduce(
        (acc, current) => {
          if (current.resultados) {
            acc.loadedCount += current.resultados.registrosCargadosCorrectamente || 0;
            acc.repaired = acc.repaired.concat(current.resultados.registrosReparados || []);
            acc.rejected = acc.rejected.concat(current.resultados.registrosRechazados || []);
          }
          return acc;
        },
        { loadedCount: 0, repaired: [], rejected: [] }
      );

      setResults({
        loadedCount: combinedResults.loadedCount,
        repaired: combinedResults.repaired,
        rejected: combinedResults.rejected,
      });
    } catch (err) {
      console.error("Error al cargar los datos:", err);
      setError("No se pudieron cargar los datos. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3004/api/borrar-datos`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error al borrar los datos: ${response.statusText}`);
      }

      const data = await response.json();
      alert(data.message || "Datos borrados exitosamente.");
      setResults(null);
    } catch (err) {
      console.error("Error al borrar los datos:", err);
      setError("No se pudieron borrar los datos. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedSources({
      selectAll: false,
      castillaLeon: false,
      comunitatValenciana: false,
      euskadi: false,
    });
    setResults(null);
  };

  return (
    <div className="load-form">
      <h2>Carga del almacén de datos</h2>
      <div className="data-source-selection">
        <h3>Seleccione fuente:</h3>
        <label>
          <input
            type="checkbox"
            name="selectAll"
            checked={selectedSources.selectAll}
            onChange={handleCheckboxChange}
          />
          Seleccionar todas
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            name="castillaLeon"
            checked={selectedSources.castillaLeon}
            onChange={handleCheckboxChange}
          />
          Castilla y León
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            name="comunitatValenciana"
            checked={selectedSources.comunitatValenciana}
            onChange={handleCheckboxChange}
          />
          Comunitat Valenciana
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            name="euskadi"
            checked={selectedSources.euskadi}
            onChange={handleCheckboxChange}
          />
          Euskadi
        </label>
      </div>
      <div className="data-load-buttons">
        <button type="button" className="cancel2-button" onClick={handleCancel}>
          Cancelar
        </button>
        <button
          onClick={handleLoadData}
          type="button"
          className="load-button"
          disabled={loading}
        >
          {loading ? "Cargando..." : "Cargar"}
        </button>
        <button onClick={handleClearData} type="button" className="reset-button">
          Borrar almacén de datos
        </button>
      </div>
      <div className="data-load-results">
        <h3>Resultados de la carga:</h3>
        {error && <p className="error">{error}</p>}
        {results ? (
          <div>
            <p>Número de registros cargados correctamente: {results.loadedCount}</p>
            <p>Registros con errores y reparados:</p>
            <ul>
              {results.repaired.length > 0 ? (
                results.repaired.map((item, index) => (
                  <li key={index}>
                    {`Fuente: ${item.fuente}, Nombre: ${item.nombre}, Localidad: ${item.localidad}, Motivo Error: ${item.motivoError}, Modificaciones: ${item.operacion}`}
                  </li>
                ))
              ) : (
                <li>No hay registros reparados</li>
              )}
            </ul>
            <p>Registros con errores y rechazados:</p>
            <ul>
              {results.rejected.length > 0 ? (
                results.rejected.map((item, index) => (
                  <li key={index}>
                    {`Fuente: ${item.fuente}, Nombre: ${item.nombre}, Localidad: ${item.localidad}, Motivo Error: ${item.motivoError}`}
                  </li>
                ))
              ) : (
                <li>No hay registros rechazados</li>
              )}
            </ul>
          </div>
        ) : (
          <p>No hay resultados</p>
        )}
      </div>
    </div>
  );
};

export default DataLoad;