'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatToiletStatus } from '@/lib/openingHours';

export interface MapToiletItem {
  toilet_id: number;
  name: string;
  description?: string | null;
  building_name?: string | null;
  floor?: number | null;
  location_lat: number;
  location_lng: number;
  location_text?: string | null;
  toilet_type?: string | null;
  status: string;
  facilities?: string[] | null;
  avg_rating?: number | string | null;
  review_count?: number | string | null;
  distance_m: number;
}

interface LeafletMapProps {
  userLat: number;
  userLng: number;
  userLabel: string;
  radiusM: number;
  toilets: MapToiletItem[];
  selectedToiletId: number | null;
  isDarkMode: boolean;
  onSelectToilet: (toilet: MapToiletItem) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

interface LeafletMapInstance {
  setView: (center: [number, number], zoom?: number, options?: Record<string, unknown>) => void;
  flyTo: (center: [number, number], zoom?: number, options?: Record<string, unknown>) => void;
  remove: () => void;
  invalidateSize: () => void;
  on: (
    event: string,
    handler: (e: { latlng?: { lat: number; lng: number } }) => void
  ) => void;
}

interface LeafletLayerGroup {
  clearLayers: () => void;
  addTo: (map: LeafletMapInstance) => LeafletLayerGroup;
}

interface LeafletMarkerInstance {
  addTo: (target: LeafletLayerGroup | LeafletMapInstance) => LeafletMarkerInstance;
  bindPopup: (html: string, options?: Record<string, unknown>) => LeafletMarkerInstance;
  openPopup: () => LeafletMarkerInstance;
  on: (event: string, handler: () => void) => LeafletMarkerInstance;
}

interface LeafletNamespace {
  map: (el: HTMLElement, options?: Record<string, unknown>) => LeafletMapInstance;
  tileLayer: (
    urlTemplate: string,
    options?: Record<string, unknown>
  ) => { addTo: (map: LeafletMapInstance) => void };
  layerGroup: () => LeafletLayerGroup;
  circle: (
    latlng: [number, number],
    options?: Record<string, unknown>
  ) => { addTo: (target: LeafletLayerGroup) => void };
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (
    latlng: [number, number],
    options?: Record<string, unknown>
  ) => LeafletMarkerInstance;
}

declare global {
  interface Window {
    L?: LeafletNamespace;
  }
}

const DEFAULT_OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function formatDistanceLabel(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} ม.`;
  return `${(distanceM / 1000).toFixed(2)} กม.`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function LeafletMap({
  userLat,
  userLng,
  userLabel,
  radiusM,
  toilets,
  selectedToiletId,
  isDarkMode,
  onSelectToilet,
  onMapClick,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const markersLayerRef = useRef<LeafletLayerGroup | null>(null);
  const markerMapRef = useRef<Map<number, LeafletMarkerInstance>>(new Map());
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_OSM_TILE_URL;

  // 1. Load Leaflet 1.9.4 CSS + JS via CDN safely on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-cdn-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const existingScript = document.getElementById('leaflet-cdn-js') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => setLeafletLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-cdn-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.crossOrigin = '';
    script.onload = () => setLeafletLoaded(true);
    document.body.appendChild(script);
  }, []);

  // 2. Initialize Leaflet Map instance once loaded
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || !window.L) return;
    if (mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      center: [userLat, userLng],
      zoom: 17,
      zoomControl: true,
    });

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    map.on('click', (e) => {
      if (e?.latlng && onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletLoaded, tileUrl]);

  // 3. Re-center map smoothly when user coordinates or radius change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const zoomByRadius = radiusM <= 300 ? 17 : radiusM <= 500 ? 16 : radiusM <= 1000 ? 15 : 14;
    mapInstanceRef.current.flyTo([userLat, userLng], zoomByRadius, {
      duration: 0.6,
    });
  }, [userLat, userLng, radiusM]);

  // 4. Render User Position Pin, Search Radius Circle, and Toilet Markers + Popups (No Emojis)
  useEffect(() => {
    if (!leafletLoaded || !window.L || !markersLayerRef.current || !mapInstanceRef.current) return;

    const L = window.L;
    const layerGroup = markersLayerRef.current;
    layerGroup.clearLayers();
    markerMapRef.current.clear();

    // 4.1 Search Radius Circle
    L.circle([userLat, userLng], {
      radius: radiusM,
      color: '#000066',
      weight: 1.5,
      dashArray: '6 4',
      fillColor: '#000066',
      fillOpacity: 0.06,
    }).addTo(layerGroup);

    // 4.2 User Current Position Marker
    const userIcon = L.divIcon({
      className: 'plodploi-user-pin',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #EF4444;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.24), 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    L.marker([userLat, userLng], { icon: userIcon })
      .addTo(layerGroup)
      .bindPopup(
        `<div style="font-family: 'Noto Sans Thai', sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #000066;">ตำแหน่งค้นหาของคุณ</strong><br/>
          <span>${escapeHtml(userLabel)}</span><br/>
          <span style="color: #64748B; font-size: 11px;">(${userLat.toFixed(4)}, ${userLng.toFixed(4)}) • รัศมี ${radiusM} ม.</span>
        </div>`
      );

    // 4.3 Toilet Markers with Minimalist Capsule Pins & Popups
    toilets.forEach((toilet, idx) => {
      const isSelected = toilet.toilet_id === selectedToiletId;
      const bg = isSelected ? '#000066' : '#FFFFFF';
      const textColor = isSelected ? '#FFFFFF' : '#000066';
      const border = '#000066';
      const scale = isSelected ? 'scale(1.12)' : 'scale(1)';

      const toiletIcon = L.divIcon({
        className: 'plodploi-toilet-pin',
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: ${bg};
            color: ${textColor};
            border: 1.5px solid ${border};
            border-radius: 9999px;
            padding: 3px 9px;
            font-family: 'Noto Sans Thai', sans-serif;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            transform: ${scale};
            box-shadow: 0 3px 10px rgba(0, 0, 102, 0.22);
          ">
            #${idx + 1}
          </div>
        `,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
        popupAnchor: [0, -12],
      });

      const numRating = Number(toilet.avg_rating || 0);
      const revCount = Number(toilet.review_count || 0);
      const effectiveRating = revCount <= 0 ? 5.0 : numRating;
      const starText = `★ ${effectiveRating.toFixed(1)} (${revCount} รีวิว)`;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${toilet.location_lat},${toilet.location_lng}&travelmode=walking`;
      const facilities = Array.isArray(toilet.facilities) ? toilet.facilities.slice(0, 3) : [];
      const badgesHtml = facilities
        .slice(0, 4)
        .map(
          (b) =>
            `<span style="background:#F1F5F9;color:#0F172A;font-size:10px;font-weight:600;padding:2px 7px;border-radius:9999px;border:1px solid #E2E8F0;display:inline-block;">${escapeHtml(
              b
            )}</span>`
        )
        .join(' ');

      const buildingFloorLabel = toilet.floor
        ? `${toilet.building_name || 'มธ. ท่าพระจันทร์'} F${toilet.floor}`
        : toilet.building_name || 'มธ. ท่าพระจันทร์';

      const currentStatusLabel = formatToiletStatus(toilet.status, true);
      const statusColor = currentStatusLabel === 'เปิด' ? '#16A34A' : '#DC2626';

      const popupHtml = `
        <div style="font-family: 'Noto Sans Thai', sans-serif; min-width: 215px; max-width: 245px; line-height: 1.35;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="background:#000066;color:#FFF;font-size:10px;font-weight:700;padding:2px 7px;border-radius:9999px;">
              #${idx + 1} • ${escapeHtml(buildingFloorLabel)}
            </span>
            <span style="color:#000066;font-size:11px;font-weight:800;">
              ${formatDistanceLabel(toilet.distance_m)}
            </span>
          </div>
          <div style="font-weight:800;font-size:13px;color:#0F172A;margin-bottom:2px;">
            ${escapeHtml(toilet.name || toilet.location_text || `ห้องน้ำ #${toilet.toilet_id}`)}
          </div>
          <div style="font-size:11px;color:#64748B;margin-bottom:6px;">
            ${starText} • <span style="color:${statusColor};font-weight:700;">${escapeHtml(
              currentStatusLabel
            )}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
            ${badgesHtml}
          </div>
          <div style="display:flex;gap:6px;">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer"
               style="flex:1;background:#000066;color:#FFF;text-decoration:none;text-align:center;padding:7px 8px;border-radius:9999px;font-size:11px;font-weight:700;">
              นำทาง
            </a>
            <a href="/liff/toilet/${toilet.toilet_id}"
               style="flex:1;background:#FFFFFF;color:#000066;text-decoration:none;text-align:center;padding:7px 8px;border-radius:9999px;font-size:11px;font-weight:700;border:1px solid #000066;">
              ดูรายละเอียด
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([toilet.location_lat, toilet.location_lng], {
        icon: toiletIcon,
      })
        .addTo(layerGroup)
        .bindPopup(popupHtml, { maxWidth: 260 });

      marker.on('click', () => {
        onSelectToilet(toilet);
      });

      markerMapRef.current.set(toilet.toilet_id, marker);
    });
  }, [leafletLoaded, userLat, userLng, userLabel, radiusM, toilets, selectedToiletId, onSelectToilet]);

  // 5. Pan/Zoom & Open popup when `selectedToiletId` changes
  useEffect(() => {
    if (!selectedToiletId || !mapInstanceRef.current) return;
    const marker = markerMapRef.current.get(selectedToiletId);
    const target = toilets.find((t) => t.toilet_id === selectedToiletId);
    if (marker && target) {
      mapInstanceRef.current.flyTo([target.location_lat, target.location_lng], 18, {
        animate: true,
        duration: 0.8,
      });
      setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }, [selectedToiletId, toilets]);

  const cardBorder = isDarkMode ? '#334155' : '#E2E8F0';

  return (
    <div
      style={{
        position: 'relative',
        height: '310px',
        borderRadius: '18px',
        overflow: 'hidden',
        border: `1px solid ${cardBorder}`,
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      }}
    >
      {!leafletLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: isDarkMode ? '#94A3B8' : '#000066',
            zIndex: 5,
          }}
        >
          กำลังโหลดแผนที่ OpenStreetMap...
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          zIndex: 1,
          filter: isDarkMode ? 'brightness(0.92) contrast(1.05)' : 'none',
        }}
      />

      {/* Explicit OpenStreetMap Copyright Attribution Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '6px',
          zIndex: 400,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: '#1E293B',
          padding: '2px 6px',
          borderRadius: '6px',
          fontSize: '10px',
          pointerEvents: 'auto',
        }}
      >
        ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#000066', textDecoration: 'underline', fontWeight: 600 }}
        >
          OpenStreetMap
        </a>{' '}
        contributors
      </div>
    </div>
  );
}
