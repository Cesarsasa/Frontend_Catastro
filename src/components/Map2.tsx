import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { containsCoordinate } from 'ol/extent';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useEffect, useRef } from 'react';

type Props = {
  lat?: number;
  lng?: number;
  setLatLng: (coords: { lat: number; lng: number }) => void;
};

const DEFAULT_CENTER = { lat: 14.6279, lng: -90.516 }; // Guatemala

// Marcador dibujado con vector: no depende de ninguna imagen, así que
// no puede romperse en el build ni en AWS.
const markerStyle = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: '#e11d48' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

export default function MapaOpenLayers({ lat, lng, setLatLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OLMap | null>(null);
  const markerRef = useRef<Feature<Point> | null>(null);

  // Guarda siempre la versión más reciente de setLatLng sin recrear el mapa
  const setLatLngRef = useRef(setLatLng);
  useEffect(() => {
    setLatLngRef.current = setLatLng;
  }, [setLatLng]);

  // 1) Crear el mapa UNA sola vez
  useEffect(() => {
    if (!containerRef.current) return;

    const hasCoords = lat != null && lng != null;
    const start = hasCoords ? { lat, lng } : DEFAULT_CENTER;
    const startCoord = fromLonLat([start.lng, start.lat]);

    const marker = new Feature<Point>(hasCoords ? new Point(startCoord) : undefined);
    markerRef.current = marker;

    const map = new OLMap({
      target: containerRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            attributions: '© Google Maps',
            maxZoom: 20, // más allá, OpenLayers amplía el último nivel disponible
          }),
        }),
        new VectorLayer({
          source: new VectorSource({ features: [marker] }),
          style: markerStyle,
        }),
      ],
      view: new View({
        center: startCoord,
        zoom: hasCoords ? 17 : 13,
        maxZoom: 22,
      }),
    });

    map.on('click', (evt) => {
      const [clickLng, clickLat] = toLonLat(evt.coordinate);
      setLatLngRef.current({ lat: clickLat, lng: clickLng });
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      map.dispose();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Cuando cambian lat/lng: mover el marcador, sin tocar el zoom del usuario
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || lat == null || lng == null) return;

    const coord = fromLonLat([lng, lat]);
    marker.setGeometry(new Point(coord));

    // Solo desplazar la vista si el punto quedó fuera de lo que se ve
    const view = map.getView();
    const size = map.getSize();
    if (size && !containsCoordinate(view.calculateExtent(size), coord)) {
      view.animate({ center: coord, duration: 250 });
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 300, cursor: 'crosshair' }}
    />
  );
}

