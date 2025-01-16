import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../index.css"; // Asegúrate de tener este archivo para estilos adicionales si es necesario

const MapComponent = ({ results }) => {
  const mapRef = useRef(null); // Referencia para almacenar el mapa
  const markersRef = useRef([]); // Referencia para almacenar los marcadores
  const safeResults = Array.isArray(results) ? results : [];

  useEffect(() => {
    if (!mapRef.current) {
      // Inicializa el mapa solo si aún no ha sido creado
      mapRef.current = L.map("map").setView([40.416775, -3.703790], 5); // Centro de España

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      // Elimina el mapa al desmontar el componente
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Elimina marcadores existentes antes de agregar nuevos
    markersRef.current.forEach((marker) => mapRef.current.removeLayer(marker));
    markersRef.current = [];

    // Define un ícono personalizado
    const customIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // URL del ícono
      iconSize: [20, 20], // Tamaño del ícono
      iconAnchor: [10, 20], // Punto del ícono que se alinea con la posición del marcador
      popupAnchor: [0, -20], // Punto desde donde se abre el popup relativo al ícono
    });

    // Agrega marcadores para cada resultado con coordenadas
    safeResults.forEach((result) => {
      if (result.latitud && result.longitud) {
        const marker = L.marker([result.latitud, result.longitud], { icon: customIcon })
          .addTo(mapRef.current)
          .bindPopup(`<strong>${result.nombre}</strong>`);
        markersRef.current.push(marker);
      }
    });
  }, [safeResults]);

  return <div id="map" style={{ width: "1000px", height: "470px" }}></div>;
};

export default MapComponent;
