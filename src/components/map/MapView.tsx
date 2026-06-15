"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./types";
import { MapSkeleton } from "./MapSkeleton";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export function MapView(props: MapViewProps) {
  return <LeafletMap {...props} />;
}
