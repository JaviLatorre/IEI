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
        selectAll: false, // Si se selecciona individualmente, desmarca "Seleccionar todas"
      }));
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
    setError(null); // Limpiar cualquier error previo

    try {
      const responses = await Promise.all(
        sources.map((fuente) =>
          fetch(`api/extractores?fuente=${encodeURIComponent(fuente)}`, {  
            method: "GET",
          })
            .then((res) => res.json())
            .catch((err) => {
              console.error(`Error al cargar datos desde ${fuente}:`, err);
              return { message: `Error al cargar datos desde ${fuente}.` };
            })
        )
      );

      // Combinar resultados de las fuentes
      const combinedResults = responses.reduce(
        (acc, current) => {
          if (current.resultados) {
            acc.loadedCount += current.resultados.registrosCargados || 0;
            acc.repaired.push(...current.resultados.registrosReparados);
            acc.rejected.push(...current.resultados.registrosRechazados);
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
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      setError("Error al cargar los datos. Consulte la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    const sources = [];
    if (selectedSources.castillaLeon) sources.push("Castilla y León");
    if (selectedSources.comunitatValenciana) sources.push("Comunitat Valenciana");
    if (selectedSources.euskadi) sources.push("Euskadi");
    if (selectedSources.selectAll) sources.push("Seleccionar todas");

    if (sources.length === 0) {
      alert("Seleccione al menos una fuente de datos.");
      return;
    }

    try {
      const responses = await Promise.all(
        sources.map((fuente) =>
          fetch(`/api/borrar-datos`, { method: "DELETE" })
            .then((res) => res.json())
            .catch((err) => {
              console.error("Error al borrar los datos:", err);
              return { message: "Error al borrar los datos." };
            })
        )
      );

      // Informar al usuario sobre la eliminación exitosa
      const errorOccurred = responses.some((response) => response.error);
      if (errorOccurred) {
        alert("Error al borrar los datos. Consulte la consola.");
      } else {
        alert("Datos borrados exitosamente.");
        setResults(null); // Limpiar resultados tras el borrado
      }
    } catch (error) {
      console.error("Error al borrar los datos:", error);
      alert("Error al borrar los datos. Consulte la consola.");
    }
  };

  const handleCancel = () => {
    setSelectedSources({
      selectAll: false,
      castillaLeon: false,
      comunitatValenciana: false,
      euskadi: false,
    });
    setResults(null); // Limpiar resultados al cancelar
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
        </label>{" "}
        <br />
        <label>
          <input
            type="checkbox"
            name="castillaLeon"
            checked={selectedSources.castillaLeon}
            onChange={handleCheckboxChange}
          />
          Castilla y León
        </label>{" "}
        <br />
        <label>
          <input
            type="checkbox"
            name="comunitatValenciana"
            checked={selectedSources.comunitatValenciana}
            onChange={handleCheckboxChange}
          />
          Comunitat Valenciana
        </label>{" "}
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
        <button
          type="button"
          className="cancel2-button"
          onClick={handleCancel}
        >
          Cancelar
        </button>
        <button
          onClick={handleLoadData}
          type="button"
          className="load-button"
          disabled={loading} // Deshabilitar el botón mientras carga
        >
          {loading ? "Cargando..." : "Cargar"}
        </button>
        <button
          onClick={handleClearData}
          type="button"
          className="reset-button"
        >
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
                    {`Fuente: ${item.fuente}, Nombre: ${item.nombre}, Localidad: ${item.localidad}, Motivo del error: ${item.motivoError}, Operación: ${item.operacion}`}
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
                    {`Fuente: ${item.fuente}, Nombre: ${item.nombre}, Localidad: ${item.localidad}, Motivo del error: ${item.motivoError}`}
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
