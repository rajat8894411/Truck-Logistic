import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LeafletMap = ({ center, path = [], height = '400px', order = null, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentMarkerRef = useRef(null);

  // City coordinates mapping
  const cityCoordinates = {
    'Chandigarh': { lat: 30.7333, lng: 76.7794 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Gujrat': { lat: 23.0225, lng: 72.5714 },
    'Nagpur': { lat: 21.1458, lng: 79.0882 },
    // Add more cities as needed
    'Chennai, India': { lat: 13.0827, lng: 80.2707 },
    'Pune, India': { lat: 18.5204, lng: 73.8567 },
    'Delhi, India': { lat: 28.6139, lng: 77.2090 },
    'Mumbai, India': { lat: 19.0760, lng: 72.8777 },
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 10);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Call onMapReady callback
    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng], 13);
      
      // Update current location marker
      if (currentMarkerRef.current) {
        currentMarkerRef.current.remove();
      }
      
      // Add current location marker with truck icon
      currentMarkerRef.current = L.marker([center.lat, center.lng], {
        icon: L.divIcon({
          className: 'truck-marker',
          html: '🚛',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      })
      .addTo(mapInstanceRef.current)
      .bindPopup(`Current Location<br>Lat: ${center.lat.toFixed(6)}<br>Lng: ${center.lng.toFixed(6)}`);
    }
  }, [center]);

  // Update path when prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers and polyline
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    // Add source and destination markers from order requirement
    if (order && order.requirement) {
      const fromLocation = order.requirement.from_location;
      const toLocation = order.requirement.to_location;
      
      console.log('Map - From Location:', fromLocation);
      console.log('Map - To Location:', toLocation);
      
      // Get coordinates for source and destination
      const sourceCoords = cityCoordinates[fromLocation] || cityCoordinates[fromLocation + ', India'] || { lat: 30.7333, lng: 76.7794 };
      const destCoords = cityCoordinates[toLocation] || cityCoordinates[toLocation + ', India'] || { lat: 28.6139, lng: 77.2090 };
      
      console.log('Map - Source Coords:', sourceCoords);
      console.log('Map - Dest Coords:', destCoords);
      
      // Source marker (From location)
      const sourceMarker = L.marker([sourceCoords.lat, sourceCoords.lng], {
        icon: L.divIcon({
          className: 'start-marker',
          html: '🟢',
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        })
      })
      .addTo(mapInstanceRef.current)
      .bindPopup(`Source: ${fromLocation}`);

      // Destination marker (To location)
      const destMarker = L.marker([destCoords.lat, destCoords.lng], {
        icon: L.divIcon({
          className: 'end-marker',
          html: '🔴',
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        })
      })
      .addTo(mapInstanceRef.current)
      .bindPopup(`Destination: ${toLocation}`);

      markersRef.current.push(sourceMarker, destMarker);

      // Add route line from source to destination
      const routeLine = L.polyline([
        [sourceCoords.lat, sourceCoords.lng],
        [destCoords.lat, destCoords.lng]
      ], {
        color: 'blue',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(mapInstanceRef.current);

      polylineRef.current = routeLine;

      // Fit map to show source and destination
      const group = new L.featureGroup([sourceMarker, destMarker, routeLine]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
    }

    // Add only recent path points (last 10) for performance
    if (path && path.length > 0) {
      const recentPath = path.slice(0, 10); // Only last 10 locations
      
      // Add small markers for recent locations
      recentPath.forEach((point, index) => {
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 3,
          color: 'blue',
          fillColor: 'lightblue',
          fillOpacity: 0.7
        })
        .addTo(mapInstanceRef.current)
        .bindPopup(`Location ${index + 1}<br>Time: ${new Date(point.timestamp).toLocaleTimeString()}`);
        
        markersRef.current.push(marker);
      });

      // Add path line for recent locations only
      if (recentPath.length > 1) {
        const latLngs = recentPath.map(point => [point.lat, point.lng]);
        const pathLine = L.polyline(latLngs, {
          color: 'green',
          weight: 2,
          opacity: 0.6
        }).addTo(mapInstanceRef.current);
        
        if (!polylineRef.current) {
          polylineRef.current = pathLine;
        }
      }
    }
  }, [path, order, center]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: height, 
        width: '100%',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }} 
    />
  );
};

export default LeafletMap;