import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../index.css"; // Asegúrate de tener este archivo para estilos adicionales si es necesario

const MapComponent = () => {
  const mapRef = useRef(null); // Referencia para almacenar el mapa

  useEffect(() => {
    if (!mapRef.current) {
      // Inicializa el mapa solo si aún no ha sido creado
      mapRef.current = L.map("map").setView([40.416775, -3.703790], 5); // Centro de España

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Define un ícono personalizado
      const customIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // URL del ícono (puedes usar uno local o externo)
        iconSize: [20, 20], // Tamaño del ícono [ancho, alto]
        iconAnchor: [10, 20], // Punto del ícono que se alinea con la posición del marcador
        popupAnchor: [0, 0], // Punto desde donde se abre el popup relativo al ícono
      });

      // Agrega un marcador con el ícono personalizado
      L.marker([40.416775, -3.703790], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup("Madrid")
    }

    return () => {
      // Elimina el mapa al desmontar el componente
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div id="map" style={{ width: "500px", height: "300px" }}></div>;
};

export default MapComponent;
