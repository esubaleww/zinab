"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  lat: number;
  lon: number;
  onPick: (lat: number, lon: number) => void;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    const targetZoom = Math.max(map.getZoom(), 7);
    map.setView([lat, lon], targetZoom, { animate: true });
  }, [lat, lon, map]);
  return null;
}

export default function EthiopiaMap({ lat, lon, onPick }: Props) {
  const ETHIOPIA_BOUNDS: [[number, number], [number, number]] = [
    [3.4, 32.9],
    [14.9, 48.0],
  ];

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={7}
      minZoom={6}
      maxZoom={12}
      maxBounds={ETHIOPIA_BOUNDS}
      maxBoundsViscosity={1.0}
      scrollWheelZoom={true}
      className="h-full w-full rounded-[22px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]} icon={icon} />
      <ClickHandler onPick={onPick} />
      <RecenterMap lat={lat} lon={lon} />
    </MapContainer>
  );
}
