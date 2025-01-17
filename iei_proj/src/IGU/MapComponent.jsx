import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../index.css"; // Asegúrate de tener este archivo para estilos adicionales si es necesario

const MapComponent = () => {
  const mapRef = useRef(null); // Referencia para almacenar el mapa
  const markersRef = useRef([]); // Referencia para almacenar los marcadores
  const results = [];
  const [mapResults, setMapResults] = useState([]);
  const data = mapResults?.data || []; 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initialFilters = { campo1: "", campo2: "" };
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const queryParams = new URLSearchParams(filters).toString();
     
  
        const response = await fetch(`http://localhost:3005/mapa?${queryParams}`);
        if (!response.ok) {
          throw new Error(`Error en la API: ${response.statusText}`);
        }
  
        const data = await response.json();
       
  
        setMapResults(data);
      } catch (err) {
        console.error("Error al realizar la búsqueda:", err);
        setError("No se pudo realizar la búsqueda. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    
    
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
    data.forEach((result) => {
      if (result.latitud && result.longitud) {
        const marker = L.marker([result.latitud, result.longitud], { icon: customIcon })
          .addTo(mapRef.current)
          .bindPopup(`<strong>${result.nombre}</strong>`);
        markersRef.current.push(marker);
      }
    });
  }, [data]);

  return <div id="map" style={{ width: "1000px", height: "470px" }}></div>;
};

export default MapComponent;
