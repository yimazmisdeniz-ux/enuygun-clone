"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { MapPoint, MapViewProps } from "./types";

const FONT = "'Open Sans', ui-sans-serif, system-ui, sans-serif";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hotelIcon(label: string, active: boolean): L.DivIcon {
  const bg = active ? "#012b9a" : "#ffffff";
  const fg = active ? "#ffffff" : "#0a1633";
  const border = active ? "#012b9a" : "#e2e8f0";
  const w = Math.round(label.length * 7.5) + 26;
  const h = 30;
  const html = `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="background:${bg};color:${fg};border:1px solid ${border};border-radius:9999px;padding:4px 10px;font:700 12px/1 ${FONT};white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.25);">${esc(
      label
    )}</div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bg};"></div>
  </div>`;
  return L.divIcon({ html, className: "", iconSize: [w, h], iconAnchor: [w / 2, h] });
}

const POI_EMOJI: Record<NonNullable<MapPoint["poiType"]>, string> = {
  landmark: "🏛️",
  airport: "✈️",
  beach: "🏖️",
  center: "🏙️",
};

function poiIcon(poiType: MapPoint["poiType"]): L.DivIcon {
  const emoji = poiType ? POI_EMOJI[poiType] : "📍";
  const html = `<div style="width:28px;height:28px;border-radius:9999px;background:#ffffff;border:2px solid #1a7ad9;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 1px 3px rgba(0,0,0,.3);">${emoji}</div>`;
  return L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
}

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 38 : count < 50 ? 46 : 54;
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#1a7ad9;color:#ffffff;border:3px solid #ffffff;display:flex;align-items:center;justify-content:center;font:700 14px/1 ${FONT};box-shadow:0 2px 6px rgba(0,0,0,.35);">${count}</div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapController({
  points,
  center,
  zoom,
  fit,
}: {
  points: MapPoint[];
  center: { lat: number; lng: number };
  zoom?: number;
  fit: boolean;
}) {
  const map = useMap();
  const key = points.map((p) => p.id).join("|");
  useEffect(() => {
    const apply = () => {
      // Recompute container size first — when the map mounts inside a modal its
      // box is often 0×0 on the first frame, which makes fitBounds fall back to
      // the world view. Sizing it before fitting keeps the region in frame.
      map.invalidateSize();
      if (fit && points.length > 0) {
        const bounds = L.latLngBounds(
          points.map((p) => [p.lat, p.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
      } else {
        map.setView([center.lat, center.lng], zoom ?? 13);
      }
    };
    apply();
    const t = setTimeout(apply, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, center.lat, center.lng, zoom, fit]);
  return null;
}

/** Pans the map to a hotel so a clicked price marker is brought into view. */
function ActivePanner({
  points,
  panToId,
}: {
  points: MapPoint[];
  panToId?: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!panToId) return;
    const p = points.find((pt) => pt.id === panToId && pt.kind === "hotel");
    if (!p) return;
    const targetZoom = Math.max(map.getZoom(), 14);
    map.flyTo([p.lat, p.lng], targetZoom, { duration: 0.5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panToId]);
  return null;
}

export default function LeafletMap({
  points,
  center,
  zoom,
  activeId,
  panToId,
  onMarkerClick,
  onMarkerHover,
  cluster,
  fitToPoints,
  className,
}: MapViewProps) {
  const hotels = points.filter((p) => p.kind === "hotel");
  const pois = points.filter((p) => p.kind === "poi");

  const hotelMarkers = hotels.map((p) => (
    <Marker
      key={p.id}
      position={[p.lat, p.lng]}
      icon={hotelIcon(p.label, p.id === activeId)}
      zIndexOffset={p.id === activeId ? 1000 : 0}
      eventHandlers={{
        click: () => onMarkerClick?.(p.id),
        mouseover: () => onMarkerHover?.(p.id),
        mouseout: () => onMarkerHover?.(null),
      }}
    >
      {p.popup ? (
        <Popup closeButton={false} minWidth={240} maxWidth={260} autoPan>
          {p.popup}
        </Popup>
      ) : null}
    </Marker>
  ));

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom ?? 12}
      scrollWheelZoom
      className={className ?? "h-full w-full"}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {cluster ? (
        <MarkerClusterGroup
          iconCreateFunction={clusterIcon}
          showCoverageOnHover={false}
          maxClusterRadius={45}
          spiderfyOnMaxZoom
          chunkedLoading
        >
          {hotelMarkers}
        </MarkerClusterGroup>
      ) : (
        hotelMarkers
      )}

      {pois.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={poiIcon(p.poiType)}
          eventHandlers={{ click: () => onMarkerClick?.(p.id) }}
        />
      ))}

      <MapController
        points={points}
        center={center}
        zoom={zoom}
        fit={!!fitToPoints}
      />
      <ActivePanner points={points} panToId={panToId} />
    </MapContainer>
  );
}
