import React from "react";
import "../index.css";

const ResultsTable = ({ results }) => {
  console.log(results);
  const data = results?.data || []; 
  return (
      <div className="results-table">
        <h3>Resultados de la búsqueda:</h3>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Dirección</th>
              <th>Localidad</th>
              <th>Código Postal</th>
              <th>Provincia</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((result, index) => (
                <tr key={index}>
                  <td>{result.nombre}</td>
                  <td>{result.tipo}</td>
                  <td>{result.direccion}</td>
                  <td>{result.localidad}</td>
                  <td>{result.codPostal}</td>
                  <td>{result.provincia}</td>
                  <td>{result.descripcion}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No se encontraron resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

export default ResultsTable;
