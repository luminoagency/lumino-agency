'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapcnMap — mappa interattiva (MapLibre) con i punti del business. Self-contained,
 * nessuna API key (tile OpenStreetMap). Per location ristoranti/hotel/uffici.
 *
 * Props:
 * - title?/description?: intestazione.
 * - locations (required): Array<{ lat, lng, name, address?, phone?, hours? }>.
 * - defaultZoom? (default 13). showRoute? (collega i punti con una linea).
 * - styleUrl?: stile MapLibre custom (altrimenti raster OSM). layout?: 'standard' (default) | 'split'.
 * - size?, tone?, palette?.
 *
 * @example
 * <MapcnMap title="Dove siamo" locations={[{lat:45.45,lng:9.17,name:'Sede',address:'...'}]}
 *   palette={{bg:'#fff',ink:'#111',accent:'#A0522D',muted:'#f5f5f5'}} layout="split" />
 */

type Palette = { bg: string; ink: string; accent: string; muted: string };
type Loc = { lat: number; lng: number; name: string; address?: string; phone?: string; hours?: string };

export interface MapcnMapProps {
  title?: string;
  description?: string;
  locations: Loc[];
  defaultZoom?: number;
  showRoute?: boolean;
  styleUrl?: string;
  layout?: 'standard' | 'split';
  size?: 'compact' | 'normal' | 'spacious';
  tone?: 'modern' | 'classic' | 'editorial' | 'playful';
  palette?: Palette;
  className?: string;
}

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(' ');
function paletteVars(p?: Palette): React.CSSProperties {
  return p ? ({ '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted } as React.CSSProperties) : {};
}

const RASTER_STYLE: any = {
  version: 8,
  sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap' } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

export function MapcnMap({
  title,
  description,
  locations,
  defaultZoom = 13,
  showRoute = false,
  styleUrl,
  layout = 'standard',
  size = 'normal',
  tone = 'modern',
  palette,
  className,
}: MapcnMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const serif = tone === 'classic' || tone === 'editorial';
  const accent = palette?.accent || '#8b5cf6';
  const locs = (locations || []).filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number');

  useEffect(() => {
    if (!containerRef.current || locs.length === 0) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl || RASTER_STYLE,
      center: [locs[0].lng, locs[0].lat],
      zoom: defaultZoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      const bounds = new maplibregl.LngLatBounds();
      locs.forEach((l) => {
        bounds.extend([l.lng, l.lat]);
        const html = `<strong>${l.name}</strong>${l.address ? `<br/>${l.address}` : ''}${l.phone ? `<br/>📞 ${l.phone}` : ''}${l.hours ? `<br/>🕒 ${l.hours}` : ''}`;
        new maplibregl.Marker({ color: accent })
          .setLngLat([l.lng, l.lat])
          .setPopup(new maplibregl.Popup({ offset: 24 }).setHTML(`<div style="font-size:13px;line-height:1.4">${html}</div>`))
          .addTo(map);
      });
      if (locs.length > 1) {
        map.fitBounds(bounds, { padding: 64, maxZoom: 15 });
        if (showRoute) {
          map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: locs.map((l) => [l.lng, l.lat]) } } });
          map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': accent, 'line-width': 3, 'line-dasharray': [2, 1] } });
        }
      }
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [locs, defaultZoom, showRoute, styleUrl, accent]);

  const rootStyle: React.CSSProperties = { ...paletteVars(palette), background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)' };
  const mapH = size === 'compact' ? 'h-[320px]' : size === 'spacious' ? 'h-[600px]' : 'h-[460px]';

  const Heading = (title || description) && (
    <div className={cx(layout === 'split' ? 'mb-6' : 'mx-auto mb-8 max-w-3xl text-center')}>
      {title && <h2 className={cx('text-3xl md:text-4xl font-bold tracking-tight', serif && 'font-serif')}>{title}</h2>}
      {description && <p className="mt-3 text-base" style={{ opacity: 0.7 }}>{description}</p>}
    </div>
  );

  const Map = <div ref={containerRef} className={cx('w-full overflow-hidden rounded-2xl border', mapH)} style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }} />;

  if (layout === 'split') {
    return (
      <section className="w-full py-16 md:py-24" style={rootStyle}>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1fr_1.6fr] md:px-8">
          <div>
            {Heading}
            <ul className="space-y-5">
              {locs.map((l, i) => (
                <li key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
                  <div className="font-semibold">{l.name}</div>
                  {l.address && <div className="mt-1 text-sm" style={{ opacity: 0.7 }}>{l.address}</div>}
                  {l.phone && <div className="text-sm" style={{ opacity: 0.7 }}>📞 {l.phone}</div>}
                  {l.hours && <div className="text-sm" style={{ opacity: 0.7 }}>🕒 {l.hours}</div>}
                </li>
              ))}
            </ul>
          </div>
          {Map}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 md:py-24" style={rootStyle}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        {Heading}
        {Map}
      </div>
    </section>
  );
}

export default MapcnMap;
