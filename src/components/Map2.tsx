import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useEffect, useRef } from 'react';

type Props = {
  lat?: number;
  lng?: number;
  setLatLng: (coords: { lat: number; lng: number }) => void;
};

export default function MapaOpenLayers({ lat, lng, setLatLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        /*new TileLayer({
          source: new OSM(),
        })*/// Ejemplo: capa satelital de Google
new TileLayer({
            source: new XYZ({
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // "s" = satélite
                attributions: '© Google Maps',
            }),
            }),
      ],
      view: new View({
        center: fromLonLat([lng ?? -90.5160, lat ?? 14.6279]), // centro inicial Guatemala
        zoom: 13,
      }),
    });

    // Capturar clic en el mapa
    map.on('click', (evt) => {
      const [lon, lat] = toLonLat(evt.coordinate);
      setLatLng({ lat, lng: lon });
    });

    return () => map.setTarget(undefined);
  }, [lat, lng, setLatLng]);

  return <div ref={mapRef} style={{ width: '100%', height: 300 }} />;
}
