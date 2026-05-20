import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// UMaT Tarkwa campus center
const UMAT_CENTER: [number, number] = [5.2948, -1.9870];
const DEFAULT_ZOOM = 16;

// Fix default marker icons in Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Spot {
  name: string;
  area: string;
  lat?: number;
  lng?: number;
}

interface CampusMapProps {
  spots?: Spot[];
  selectedSpot?: string;
  onSelectSpot?: (name: string) => void;
  height?: string;
  className?: string;
}

function FlyToSpot({ spot }: { spot?: Spot }) {
  const map = useMap();
  useEffect(() => {
    if (spot?.lat && spot?.lng) {
      map.flyTo([spot.lat, spot.lng], 17, { duration: 0.8 });
    }
  }, [spot]);
  return null;
}

export default function CampusMap({ spots = [], selectedSpot, onSelectSpot, height = '300px', className = '' }: CampusMapProps) {
  const selected = spots.find(s => s.name === selectedSpot);

  return (
    <div className={className} style={{ height, width: '100%', border: '3px solid var(--bulletin-border, #1a1a1a)', boxShadow: '5px 5px 0 0 var(--bulletin-shadow, #1a1a1a)' }}>
      <MapContainer
        center={UMAT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.filter(s => s.lat && s.lng).map(spot => (
          <Marker
            key={spot.name}
            position={[spot.lat!, spot.lng!]}
            icon={pinIcon}
            eventHandlers={{
              click: () => onSelectSpot?.(spot.name),
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'sans-serif' }}>
                <strong style={{ fontSize: 12, textTransform: 'uppercase' }}>{spot.name}</strong>
                <br />
                <span style={{ fontSize: 11, opacity: 0.6 }}>{spot.area}</span>
              </div>
            </Popup>
          </Marker>
        ))}
        <FlyToSpot spot={selected} />
      </MapContainer>
    </div>
  );
}
