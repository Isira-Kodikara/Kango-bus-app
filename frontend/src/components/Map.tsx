import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Colombo, Sri Lanka coordinates
export const COLOMBO_CENTER: [number, number] = [6.9271, 79.8612];

// Custom marker icons
export const createBusIcon = (color: string = '#3b82f6') => L.divIcon({
  className: 'custom-bus-marker',
  html: `
    <div style="
      background-color: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"></path>
        <path d="M15 6v6"></path>
        <path d="M2 12h19.6"></path>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
        <circle cx="7" cy="18" r="2"></circle>
        <path d="M9 18h5"></path>
        <circle cx="16" cy="18" r="2"></circle>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const createStopIcon = (isActive: boolean = false) => L.divIcon({
  className: 'custom-stop-marker',
  html: `
    <div style="
      background-color: ${isActive ? '#ef4444' : '#6b7280'};
      width: ${isActive ? 16 : 12}px;
      height: ${isActive ? 16 : 12}px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    "></div>
  `,
  iconSize: [isActive ? 16 : 12, isActive ? 16 : 12],
  iconAnchor: [isActive ? 8 : 6, isActive ? 8 : 6],
  popupAnchor: [0, -8],
});

export const createUserIcon = () => L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      background-color: #3b82f6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

export const createDestinationIcon = () => L.divIcon({
  className: 'custom-destination-marker',
  html: `
    <div style="
      background-color: #ef4444;
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

export const createFromIcon = () => L.divIcon({
  className: 'custom-from-marker',
  html: `
    <div style="
      background-color: #3b82f6;
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// Sample Colombo bus stops with real coordinates
export const COLOMBO_BUS_STOPS = [
  { id: 1, name: 'Fort Railway Station', lat: 6.9344, lng: 79.8428, code: 'FRT' },
  { id: 2, name: 'Pettah Bus Stand', lat: 6.9366, lng: 79.8500, code: 'PTH' },
  { id: 3, name: 'Kollupitiya Junction', lat: 6.9114, lng: 79.8489, code: 'KLP' },
  { id: 4, name: 'Bambalapitiya', lat: 6.8897, lng: 79.8553, code: 'BBP' },
  { id: 5, name: 'Wellawatte', lat: 6.8747, lng: 79.8594, code: 'WLW' },
  { id: 6, name: 'Dehiwala', lat: 6.8564, lng: 79.8650, code: 'DHW' },
  { id: 7, name: 'Mount Lavinia', lat: 6.8390, lng: 79.8660, code: 'MLV' },
  { id: 8, name: 'Town Hall', lat: 6.9167, lng: 79.8636, code: 'TWH' },
  { id: 9, name: 'Borella Junction', lat: 6.9147, lng: 79.8778, code: 'BRL' },
  { id: 10, name: 'Maradana', lat: 6.9289, lng: 79.8675, code: 'MRD' },
  { id: 11, name: 'Nugegoda', lat: 6.8722, lng: 79.8883, code: 'NGD' },
  { id: 12, name: 'Maharagama', lat: 6.8481, lng: 79.9267, code: 'MHR' },
];

// Sample bus routes
export const COLOMBO_ROUTES = [
  {
    id: 1,
    name: 'Coastal Line',
    number: '100',
    color: '#3b82f6',
    stops: [1, 2, 3, 4, 5, 6, 7], // Fort to Mount Lavinia
  },
  {
    id: 2,
    name: 'City Circle',
    number: '138',
    color: '#10b981',
    stops: [1, 2, 10, 9, 8, 3], // Fort - Pettah - Maradana - Borella - Town Hall - Kollupitiya
  },
  {
    id: 3,
    name: 'Southern Express',
    number: '155',
    color: '#f59e0b',
    stops: [1, 8, 9, 11, 12], // Fort - Town Hall - Borella - Nugegoda - Maharagama
  },
];

// Sample active buses
export const SAMPLE_BUSES = [
  { id: 'NA-1234', routeId: 1, lat: 6.9200, lng: 79.8520, passengers: 24, capacity: 50, heading: 180 },
  { id: 'NA-5678', routeId: 1, lat: 6.8750, lng: 79.8590, passengers: 35, capacity: 50, heading: 180 },
  { id: 'NB-9012', routeId: 2, lat: 6.9250, lng: 79.8650, passengers: 18, capacity: 40, heading: 270 },
  { id: 'NC-3456', routeId: 3, lat: 6.8900, lng: 79.8800, passengers: 42, capacity: 50, heading: 135 },
];

// Component to update map view
function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

// Component to fit map to bounds
function MapBoundsController({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [points, map]);

  return null;
}

// Get route coordinates from stop IDs
function getRouteCoordinates(stopIds: number[]): [number, number][] {
  return stopIds
    .map(id => COLOMBO_BUS_STOPS.find(stop => stop.id === id))
    .filter(Boolean)
    .map(stop => [stop!.lat, stop!.lng] as [number, number]);
}

// Props interface
interface MapProps {
  className?: string;
  showBuses?: boolean;
  showStops?: boolean;
  showRoutes?: boolean;
  selectedRoute?: number | null;
  userLocation?: [number, number] | null;
  fromLocation?: [number, number] | null;
  destination?: [number, number] | null;
  onBusClick?: (bus: typeof SAMPLE_BUSES[0]) => void;
  onStopClick?: (stop: typeof COLOMBO_BUS_STOPS[0]) => void;
  center?: [number, number];
  zoom?: number;
  walkingPath?: [number, number][];
  routePolylines?: Record<number, [number, number][]>;
  buses?: any[];
  onMapClick?: (latlng: [number, number]) => void;
}

// Component to handle map clicks
function MapEvents({ onMapClick }: { onMapClick?: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onMapClick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function Map({
  className = '',
  showBuses = true,
  showStops = true,
  showRoutes = true,
  selectedRoute = null,
  userLocation = null,
  fromLocation = null,
  destination = null,
  onBusClick,
  onStopClick,
  onMapClick,
  center = COLOMBO_CENTER,
  zoom = 13,
  walkingPath = [],
  routePolylines,
  buses,
}: MapProps) {
  const mapRef = useRef<L.Map>(null);

  // Filter routes to show
  const routesToShow = selectedRoute
    ? COLOMBO_ROUTES.filter(r => r.id === selectedRoute)
    : COLOMBO_ROUTES;

  // Filter buses to show
  // Use passed buses if available, otherwise use sample
  const sourceBuses = buses || SAMPLE_BUSES;
  const busesToShow = selectedRoute
    ? sourceBuses.filter(b => b.routeId === selectedRoute)
    : sourceBuses;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      ref={mapRef}
      zoomControl={false}
      style={{ zIndex: 0 }}
    >
      {/* OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Map controller for programmatic updates */}
      <MapController center={center} zoom={zoom} />
      <MapEvents onMapClick={onMapClick} />

      {/* Auto-fit bounds when from and to locations are set */}
      {fromLocation && destination && (
        <MapBoundsController points={[fromLocation, destination]} />
      )}

      {/* Walking Path */}
      {walkingPath && (
        <Polyline
          positions={walkingPath}
          pathOptions={{
            color: '#3b82f6', // Blue
            weight: 5,
            dashArray: '10, 15', // Dashed line
            opacity: 0.8,
            lineCap: 'round'
          }}
        />
      )}

      {/* Route polylines */}
      {showRoutes && (
        <>
          {/* Render passed polylines if available (Smooth lines) */}
          {routePolylines && Object.entries(routePolylines).map(([id, path]) => {
            const routeId = parseInt(id);
            const route = COLOMBO_ROUTES.find(r => r.id === routeId);
            if (!route) return null;

            // Only show if selected or no specific selection
            if (selectedRoute && selectedRoute !== routeId) return null;

            return (
              <Polyline
                key={`poly-${id}`}
                positions={path}
                pathOptions={{
                  color: route.color,
                  weight: 5,
                  opacity: selectedRoute === routeId ? 1 : 0.6,
                  lineJoin: 'round'
                }}
              />
            );
          })}

          {/* Fallback to straight lines if no polylines provided */}
          {!routePolylines && routesToShow.map(route => (
            <Polyline
              key={route.id}
              positions={getRouteCoordinates(route.stops)}
              pathOptions={{
                color: route.color,
                weight: 4,
                opacity: selectedRoute === route.id ? 1 : 0.6,
              }}
            />
          ))}
        </>
      )}

      {/* Bus stops */}
      {showStops && COLOMBO_BUS_STOPS.map(stop => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={createStopIcon(false)}
          eventHandlers={{
            click: () => onStopClick?.(stop),
          }}
        >
          <Popup>
            <div className="text-center">
              <strong>{stop.name}</strong>
              <br />
              <span className="text-gray-500 text-sm">Stop: {stop.code}</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Buses */}
      {showBuses && busesToShow.map(bus => {
        const route = COLOMBO_ROUTES.find(r => r.id === bus.routeId);
        return (
          <Marker
            key={bus.id}
            position={[bus.lat, bus.lng]}
            icon={createBusIcon(route?.color)}
            eventHandlers={{
              click: () => onBusClick?.(bus),
            }}
          >
            <Popup>
              <div className="text-center min-w-[120px]">
                <strong className="text-lg">{bus.id}</strong>
                <br />
                <span className="text-sm" style={{ color: route?.color }}>
                  {route?.number} - {route?.name}
                </span>
                <br />
                <span className="text-gray-600 text-sm">
                  👥 {bus.passengers}/{bus.capacity}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* User location */}
      {userLocation && (
        <Marker position={userLocation} icon={createUserIcon()}>
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>
      )}

      {/* From Location */}
      {fromLocation && (
        <Marker position={fromLocation} icon={createFromIcon()}>
          <Popup>
            <strong>Starting Location</strong>
          </Popup>
        </Marker>
      )}

      {/* Destination */}
      {destination && (
        <Marker position={destination} icon={createDestinationIcon()}>
          <Popup>
            <strong>Destination</strong>
          </Popup>
        </Marker>
      )}

      {/* Walking Path */}
      {walkingPath && walkingPath.length > 0 && (
        <Polyline
          positions={walkingPath}
          pathOptions={{
            color: '#3b82f6', // Blue
            dashArray: '10, 10', // Dashed line
            weight: 5,
            opacity: 0.8,
            lineCap: 'round'
          }}
        />
      )}
    </MapContainer>
  );
}

export default Map;
