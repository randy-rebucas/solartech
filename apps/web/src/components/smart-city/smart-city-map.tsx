'use client';

import { useMemo } from 'react';
import Map, { Layer, NavigationControl, Source } from 'react-map-gl/maplibre';
import type { CircleLayerSpecification, HeatmapLayerSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SmartCityHeatPoint } from '@/hooks/use-api';

const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';
const PH_CENTER = { longitude: 121.77, latitude: 12.88, zoom: 5.2 };

type Props = {
  heatmap: SmartCityHeatPoint[];
  geoJson?: GeoJSON.FeatureCollection;
  className?: string;
};

const heatmapLayer: HeatmapLayerSpecification = {
  id: 'solar-heat',
  type: 'heatmap',
  source: 'heatmap-points',
  maxzoom: 12,
  paint: {
    'heatmap-weight': ['get', 'weight'],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.6, 12, 2],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(0,0,0,0)',
      0.2,
      '#fef08a',
      0.5,
      '#f59e0b',
      0.8,
      '#ea580c',
      1,
      '#dc2626',
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 12, 28],
  },
};

const sitesLayer: CircleLayerSpecification = {
  id: 'solar-sites',
  type: 'circle',
  source: 'solar-sites',
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'systemKw'], 5], 1, 5, 50, 16],
    'circle-color': '#f59e0b',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
    'circle-opacity': 0.85,
  },
};

export function SmartCityMap({ heatmap, geoJson, className }: Props) {
  const heatGeoJson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: heatmap
      .filter((p) => p.lat != null && p.lng != null)
      .map((p, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        properties: { weight: p.weight, id: i },
      })),
  }), [heatmap]);

  const initialView = useMemo(() => {
    const points = heatmap.filter((p) => p.lat && p.lng);
    if (points.length === 0) return PH_CENTER;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
    const zoom = span < 0.5 ? 10 : span < 2 ? 8 : span < 6 ? 6.5 : 5.2;
    return { latitude: lat, longitude: lng, zoom };
  }, [heatmap]);

  const sitesCollection = geoJson?.features?.length ? geoJson : heatGeoJson;

  return (
    <div className={className ?? 'h-[420px] w-full rounded-xl overflow-hidden border border-border'}>
      <Map
        initialViewState={initialView}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="heatmap-points" type="geojson" data={heatGeoJson}>
          <Layer {...heatmapLayer} />
        </Source>
        <Source id="solar-sites" type="geojson" data={sitesCollection}>
          <Layer {...sitesLayer} />
        </Source>
      </Map>
    </div>
  );
}
