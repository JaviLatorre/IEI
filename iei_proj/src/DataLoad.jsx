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

  const handleLoadData = () => {
    // Aquí puedes añadir la lógica de carga de datos
    setResults({
      loadedCount: "NN",
      repaired: [
        {
          fuente: "Fuente ejemplo",
          nombre: "Nombre ejemplo",
          localidad: "Localidad ejemplo",
          motivoError: "Motivo ejemplo",
          operacion: "Operación ejemplo",
        },
      ],
      rejected: [
        {
          fuente: "Fuente ejemplo 2",
          nombre: "Nombre ejemplo 2",
          localidad: "Localidad ejemplo 2",
          motivoError: "Motivo ejemplo 2",
        },
      ],
    });
  };

  const handleClearData = () => {
    // Aquí puedes añadir la lógica para borrar el almacén de datos
    setResults(null);
    alert("Almacén de datos borrado");
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
        </label> <br/>
        <label>
          <input
            type="checkbox"
            name="castillaLeon"
            checked={selectedSources.castillaLeon}
            onChange={handleCheckboxChange}
          />
          Castilla y León
        </label> <br/>
        <label>
          <input
            type="checkbox"
            name="comunitatValenciana"
            checked={selectedSources.comunitatValenciana}
            onChange={handleCheckboxChange}
          />
          Comunitat Valenciana
        </label> <br/>
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
        <button type="button" className="cancel2-button">Cancelar</button>
        <button onClick={handleLoadData} type="button" className="load-button">Cargar</button>
        <button onClick={handleClearData} type="button" className="reset-button">Borrar almacén de datos</button>
      </div>
      <div className="data-load-results">
        <h3>Resultados de la carga:</h3>
        {results ? (
          <div>
            <p>Número de registros cargados correctamente: {results.loadedCount}</p>
            <p>Registros con errores y reparados:</p>
            <ul>
              {results.repaired.map((item, index) => (
                <li key={index}>
                  {`Fuente: ${item.fuente}, Nombre: ${item.nombre}, Localidad: ${item.localidad}, Motivo del error: ${item.motivoError}, Operación: ${item.operacion}`}
                </li>
              ))}
            </ul>
            <p>Registros con errores y rechazados:</p>
            <ul>
              {results.rejected.map((item, index) => (
                <li key={index}>
                  {`Fuente: ${item.fuente}, Nombre: ${item.nombre}, Localidad: ${item.localidad}, Motivo del error: ${item.motivoError}`}
                </li>
              ))}
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
