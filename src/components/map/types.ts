import type { ReactNode } from "react";
import type { LatLng } from "@/lib/data";

export type { LatLng };

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: "hotel" | "poi";
  poiType?: "landmark" | "airport" | "beach" | "center";
  /** Rendered inside a Leaflet popup anchored on the marker (clicked = opens). */
  popup?: ReactNode;
};

export type MapViewProps = {
  points: MapPoint[];
  center: LatLng;
  zoom?: number;
  activeId?: string | null;
  /** When this changes, the map pans/zooms to that hotel (set on click, not hover). */
  panToId?: string | null;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
  cluster?: boolean;
  fitToPoints?: boolean;
  className?: string;
};
