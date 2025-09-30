import React, { useEffect, useRef, useState } from 'react';

// Lightweight Google Maps wrapper using JS API. Requires REACT_APP_GOOGLE_MAPS_API_KEY.
// Props:
// - center: { lat, lng }
// - path: [{ lat, lng }]
// - height: CSS height (e.g., '320px')
export default function GoogleMapView({ center, path = [], height = '320px', onApiError }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [apiLoaded, setApiLoaded] = useState(!!window.google?.maps);

  useEffect(() => {
    if (apiLoaded) return;
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return; // allow fallback
    // Load script once
    const existing = document.querySelector('#gmaps-script');
    if (existing) {
      existing.addEventListener('load', () => setApiLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'gmaps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setApiLoaded(true);
    script.onerror = () => {
      if (onApiError) onApiError(new Error('Failed to load Google Maps JS API'));
    };
    document.body.appendChild(script);
  }, [apiLoaded]);

  useEffect(() => {
    if (!apiLoaded || !containerRef.current || !center) return;
    const { google } = window;
    let map;
    try {
      map = new google.maps.Map(containerRef.current, {
      center: { lat: Number(center.lat), lng: Number(center.lng) },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      });
    } catch (err) {
      if (onApiError) onApiError(err);
      return;
    }
    mapRef.current = map;

    const bounds = new google.maps.LatLngBounds();
    const currentMarker = new google.maps.Marker({
      position: { lat: Number(center.lat), lng: Number(center.lng) },
      map,
      title: 'Current Location',
    });
    bounds.extend(currentMarker.getPosition());

    if (Array.isArray(path) && path.length > 0) {
      const poly = new google.maps.Polyline({
        path: path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });
      poly.setMap(map);
      path.forEach((p) => bounds.extend(new google.maps.LatLng(Number(p.lat), Number(p.lng))));
    }

    map.fitBounds(bounds);

    return () => {
      // basic cleanup
      mapRef.current = null;
    };
  }, [apiLoaded, center, path]);

  return (
    <div ref={containerRef} style={{ width: '100%', height }} />
  );
}


