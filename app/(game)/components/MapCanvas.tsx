"use client";
import React from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl';

type Props = {
  mapboxToken: string;
  initialViewState: any;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onMove?: (e: any) => void;
  mapRef?: React.RefObject<MapRef>;
} & Record<string, any>;

export default function MapCanvas({ mapboxToken, initialViewState, style, children, onMove, mapRef, ...rest }: Props) {
  return (
    <Map
      ref={mapRef as any}
      mapboxAccessToken={mapboxToken}
      initialViewState={initialViewState}
      style={style}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      onMove={onMove}
      {...rest}
    >
      {children}
    </Map>
  );
}

export { Marker, Source, Layer };


