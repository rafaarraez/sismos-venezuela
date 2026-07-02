"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { magnitudeColor, magnitudeInfo } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { Quake } from "@/lib/types";

/** Radio del marcador en px según la magnitud. */
function radius(mag: number | null): number {
  if (mag == null) return 5;
  return Math.max(4, mag * mag * 0.9);
}

export default function MapView({ quakes }: { quakes: Quake[] }) {
  return (
    <MapContainer
      center={[8.0, -66.0]}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {quakes.map((q) => {
        const color = magnitudeColor(q.mag);
        return (
          <CircleMarker
            key={q.id}
            center={[q.lat, q.lon]}
            radius={radius(q.mag)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.45,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="text-sm font-semibold">{q.place}</p>
                <p>
                  Magnitud:{" "}
                  <b style={{ color }}>
                    {q.mag != null ? q.mag.toFixed(1) : "N/D"}
                  </b>{" "}
                  ({magnitudeInfo(q.mag).label})
                </p>
                <p>Profundidad: {q.depth.toFixed(0)} km</p>
                <p>{formatDateTime(q.time)}</p>
                <p className="opacity-70">Fuente: {q.source}</p>
                {q.url && (
                  <a href={q.url} target="_blank" rel="noopener noreferrer">
                    Ver detalle →
                  </a>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
