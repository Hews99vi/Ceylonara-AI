import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import './LocationPicker.css';

const containerStyle = {
  width: '100%',
  height: '300px'
};

const defaultCenter = {
  lat: 7.8731, // Default center for Sri Lanka
  lng: 80.7718
};

const libraries = ['places'];

const LocationPicker = ({ onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyC-omA-s6rBqx1pftFih7K0PLuwP3rbv-k',
    libraries: libraries
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    // Initialize geocoder
    if (window.google) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.setCenter(userLocation);
          setSelectedLocation(userLocation);
          geocodeLocation(userLocation);
        },
        () => {
          console.log('Error getting current location');
        }
      );
    }
  }, []);

  const geocodeLocation = (location) => {
    if (geocoderRef.current && location) {
      // Create the location object regardless of geocoding success
      const locationData = {
        lat: location.lat,
        lng: location.lng,
        address: 'Finding address...'
      };
      
      // Pass location data to parent immediately
      onLocationSelect(locationData);
      
      // Then try to get the address
      geocoderRef.current.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          setAddress(results[0].formatted_address);
          
          // Update with address when available
          onLocationSelect({
            ...locationData,
            address: results[0].formatted_address
          });
        } else {
          console.log('Geocoding failed:', status);
          setAddress('Address not found');
          
          // Still update with coordinates even if address lookup fails
          onLocationSelect({
            ...locationData,
            address: 'Address not found'
          });
        }
      });
    }
  };

  const handleMapClick = (event) => {
    const clickedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setSelectedLocation(clickedLocation);
    geocodeLocation(clickedLocation);
  };

  return isLoaded ? (
    <div className="location-picker">
      <h3>Select Collection Location</h3>
      <div className="map-container">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={8}
          onClick={handleMapClick}
          onLoad={onMapLoad}
        >
          {selectedLocation && (
            <Marker
              position={selectedLocation}
            />
          )}
        </GoogleMap>
      </div>
      {selectedLocation && (
        <div className="location-info">
          <p className="confirmation-message"><span className="checkmark">✓</span> Location selected successfully</p>
          <p><strong>Selected Location:</strong> {address || 'Address not found'}</p>
          <p className="coordinates">Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
        </div>
      )}
    </div>
  ) : (
    <div className="loading-map">Loading Google Maps...</div>
  );
};

export default LocationPicker; 