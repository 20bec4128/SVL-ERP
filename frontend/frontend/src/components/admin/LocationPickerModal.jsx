import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect({ latitude: lat, longitude: lng });
    },
  });
  return null;
}

function MapUpdater({ location }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([location.latitude, location.longitude], 13, { duration: 1.5 });
  }, [location, map]);
  return null;
}

async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`
    );
    const data = await response.json();
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: data[0].display_name,
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

export default function LocationPickerModal({
  show,
  onClose,
  onSelectLocation,
  initialLocation = null,
  radiusMeters = 50,
  onRadiusChange,
}) {
  const [location, setLocation] = useState(
    initialLocation || { latitude: 28.6139, longitude: 77.209 }
  );
  const [searchAddress, setSearchAddress] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    setSearching(true);
    try {
      const result = await geocodeAddress(searchAddress);
      if (result) {
        setLocation(result);
      } else {
        alert('Address not found');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => alert('Unable to get location')
      );
    } else {
      alert('Geolocation not supported');
    }
  };

  const handleSelect = () => {
    onSelectLocation(location);
    onClose();
  };

  if (!show) return null;
  const normalizedRadius = Number(radiusMeters) > 0 ? Number(radiusMeters) : 50;
  const handleRadiusInputChange = (e) => {
    const nextValue = e.target.value;
    if (onRadiusChange) {
      onRadiusChange(nextValue);
    }
  };

  const getMapHeight = () => {
    if (window.innerWidth < 576) return '250px';
    if (window.innerWidth < 768) return '300px';
    return '400px';
  };

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex="-1"
    >
      <style>
        {`
          .location-picker-number-input {
            -moz-appearance: textfield;
            appearance: textfield;
          }

          .location-picker-number-input::-webkit-outer-spin-button,
          .location-picker-number-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        `}
      </style>
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ margin: '10px' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-map me-2"></i>Select Location
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-3">
            <div className="mb-3">
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search address..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
                <button
                  className="btn btn-outline-info"
                  type="button"
                  onClick={handleGetMyLocation}
                  title="Get current location"
                >
                  <i className="ti ti-current-location"></i>
                </button>
              </div>
            </div>

            <div
              style={{
                height: getMapHeight(),
                marginBottom: '15px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #ddd',
              }}
            >
              <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <MapUpdater location={location} />
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    Lat: {location.latitude.toFixed(6)}<br />
                    Lng: {location.longitude.toFixed(6)}<br />
                    Radius: {normalizedRadius} m
                  </Popup>
                </Marker>
                <Circle
                  center={[location.latitude, location.longitude]}
                  radius={normalizedRadius}
                  pathOptions={{
                    color: '#0d6efd',
                    fillColor: '#0d6efd',
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
                <MapClickHandler onLocationSelect={setLocation} />
              </MapContainer>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label small fw-bold">Latitude</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={location.latitude.toFixed(6)}
                  readOnly
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label small fw-bold">Longitude</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={location.longitude.toFixed(6)}
                  readOnly
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Radius (meters)</label>
              <input
                type="number"
                min="1"
                className="form-control form-control-sm location-picker-number-input"
                value={radiusMeters}
                onChange={handleRadiusInputChange}
              />
            </div>

            {location.address && (
              <div className="alert alert-info mb-0" role="alert">
                <small>
                  <strong>Address:</strong> {location.address}
                </small>
              </div>
            )}
          </div>

          <div className="modal-footer gap-2 flex-wrap">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSelect}>
              <i className="ti ti-check me-1"></i>Select Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
