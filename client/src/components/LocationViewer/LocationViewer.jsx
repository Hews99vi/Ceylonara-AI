import React, { useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import './LocationViewer.css';

const containerStyle = {
  width: '100%',
  height: '250px'
};

const libraries = ['places'];

const LocationViewer = ({ location }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyC-omA-s6rBqx1pftFih7K0PLuwP3rbv-k',
    libraries: libraries
  });

  const onMapLoad = useCallback((map) => {
    // Adjust zoom if needed
    if (location) {
      map.setZoom(15); // Closer zoom to see details
    }
  }, [location]);

  // If location is not provided, return null
  if (!location || (!location.lat && !location.lng)) {
    return (
      <div className="location-not-available">
        <p>Location data not available</p>
      </div>
    );
  }

  return isLoaded ? (
    <div className="location-viewer">
      <div className="map-container">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{ lat: location.lat, lng: location.lng }}
          zoom={14}
          onLoad={onMapLoad}
          options={{ 
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true
          }}
        >
          <Marker position={{ lat: location.lat, lng: location.lng }} />
        </GoogleMap>
      </div>
      {location.address && (
        <div className="location-address">
          <p>{location.address}</p>
        </div>
      )}
    </div>
  ) : (
    <div className="loading-map">Loading map...</div>
  );
};

export default LocationViewer; 