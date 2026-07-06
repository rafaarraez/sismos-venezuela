"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import { magnitudeColor, magnitudeInfo } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { Quake } from "@/lib/types";

/** Radio del marcador en px según la magnitud. */
function radius(mag: number | null): number {
  if (mag == null) return 5;
  return Math.max(4, mag * mag * 0.9);
}

type MarkerRefs = Map<string, LeafletCircleMarker>;

/** Vuela al sismo seleccionado en la lista y abre su popup. */
function FlyToSelected({
  quake,
  markers,
}: {
  quake: Quake | undefined;
  markers: React.RefObject<MarkerRefs>;
}) {
  const map = useMap();
  const id = quake?.id;
  const lat = quake?.lat;
  const lon = quake?.lon;

  useEffect(() => {
    if (id == null || lat == null || lon == null) return;
    map.flyTo([lat, lon], Math.max(map.getZoom(), 8), { duration: 0.8 });
    markers.current?.get(id)?.openPopup();
  }, [id, lat, lon, map, markers]);

  return null;
}

export default function MapView({
  quakes,
  highlightId,
  selectedId,
}: {
  quakes: Quake[];
  highlightId: string | null;
  selectedId: string | null;
}) {
  const markersRef = useRef<MarkerRefs>(new Map());
  const highlighted = highlightId
    ? quakes.find((q) => q.id === highlightId)
    : undefined;

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
        const active = q.id === highlightId;
        return (
          <CircleMarker
            key={q.id}
            ref={(m) => {
              if (m) markersRef.current.set(q.id, m);
              else markersRef.current.delete(q.id);
            }}
            center={[q.lat, q.lon]}
            radius={radius(q.mag)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: active ? 0.85 : 0.45,
              weight: active ? 3 : 1.5,
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

      {/* Anillo indicador sobre el sismo resaltado desde la lista. */}
      {highlighted && (
        <CircleMarker
          center={[highlighted.lat, highlighted.lon]}
          radius={radius(highlighted.mag) + 6}
          interactive={false}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fill: false,
            dashArray: "4 4",
          }}
        />
      )}

      <FlyToSelected
        quake={quakes.find((q) => q.id === selectedId)}
        markers={markersRef}
      />
    </MapContainer>
  );
}
