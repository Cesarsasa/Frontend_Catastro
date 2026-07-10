import { MapContainer, TileLayer, Marker, useMapEvents, FeatureGroup, Polygon  } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';


function LocationPicker({ setLatLng }) {
  useMapEvents({
    click(e) {
      setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapaUbicacion({ lat, lng, setLatLng }) {
  // lat: 14.63194, lng: -90.92659
    // <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    /*  <TileLayer
  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" // "s" = satélite, "m" = mapa
  attribution="© Google Maps"
/>*/
  const position: LatLngExpression = lat && lng ? [lat, lng] : [14.63194, -90.92659]; // centro inicial Guatemala

  return (
    <MapContainer
      center={position}
      zoom={15}
      maxZoom={22} 

      style={{ height: 300, width: '100%' }}
    >
  <TileLayer
  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
  attribution="© Google Maps"
  maxZoom={22}
/>

      {lat && lng && <Marker position={[lat, lng]} />}
      <LocationPicker setLatLng={setLatLng} />
    </MapContainer>
  );
}
export function MapaUbicacionPol({ lat, lng, setLatLng, setPoligono, poligono }) {
  const position: LatLngExpression = lat && lng ? [lat, lng] : [14.63194, -90.92659];

  const handleCreated = (e) => {
    const layer = e.layer;
    if (layer.getLatLngs) {
      const puntos = layer.getLatLngs()[0].map((p) => ({
        lat: p.lat,
        lng: p.lng,
      }));
      setPoligono(puntos);
    }
  };

  const handleEdited = (e) => {
    e.layers.eachLayer((layer) => {
      if (layer.getLatLngs) {
        const puntos = layer.getLatLngs()[0].map((p) => ({
          lat: p.lat,
          lng: p.lng,
        }));
        setPoligono(puntos);
      }
    });
  };

  return (
    <MapContainer center={position} zoom={15} style={{ height: 400, width: '100%' }}>
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        attribution="© Google Maps"
        maxZoom={22}
      />
      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          onEdited={handleEdited}   // 👈 capturar edición
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: true,
          }}
        />

        {/* Polígono inicial dentro del FeatureGroup */}
        {poligono && Array.isArray(poligono) && poligono.length > 0 && (
  <Polygon positions={poligono} />  
)}

          {/* Polígono inicial dentro del FeatureGroup
          
              {poligono && poligono.length > 0 && (
          <Polygon positions={poligono} />
        )}
          */}
    
      </FeatureGroup>

      {lat && lng && <Marker position={[lat, lng]} />}
    </MapContainer>
  );
}
