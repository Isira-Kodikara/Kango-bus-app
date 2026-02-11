
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Menu,
  Navigation,
  MapPin,
  Search,
  Clock,
  Users,
  Bus,
  Footprints,
  ArrowRight,
  Star,
  User,
  X,
  ChevronUp,
  Locate,
  Map as MapIcon,
  ArrowUpDown
} from 'lucide-react';
import { Map } from './Map';
import { ENDPOINTS } from '../lib/api-config';
import { useAuth } from '../contexts/AuthContext';



import { useToast } from '../contexts/ToastContext';

// --- CONSTANTS ---
const COLOMBO_CENTER: [number, number] = [6.9271, 79.8612];
const DEFAULT_MAP_ZOOM = 13;
const LOCATE_ME_ZOOM = 15;
const POLLING_INTERVAL_MS = 10_000;

// Walk speed: 80m/min ~= 5km/h
const WALK_SPEED_M_PER_MIN = 80;
// Walk speed: 1.4m/s
const WALK_SPEED_M_PER_SEC = 1.4;

const ARRIVAL_THRESHOLD_M = 30;
const NEARBY_STOP_THRESHOLD_M = 50;
const CROWD_LOW_THRESHOLD = 0.5;
const CROWD_HIGH_THRESHOLD = 0.8;

// Geolocation settings
const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5_000,
  timeout: 10_000
};

// --- TYPES ---
interface BusData {
  plate_number: string;
  route_id: number;
  latitude: number;
  longitude: number;
  current_passengers?: number;
  capacity: number;
  status: string;
}

interface StopData {
  id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  distanceKm?: string;
  walkTime?: number;
}




export function UserHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [nearestStop, setNearestStop] = useState<any>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [fromLocationCoords, setFromLocationCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(COLOMBO_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [walkingPath, setWalkingPath] = useState<[number, number][]>([]);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [busPath, setBusPath] = useState<[number, number][]>([]);
  const [destWalkPath, setDestWalkPath] = useState<[number, number][]>([]);

  // Autocomplete state
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);


  interface WalkingGuidanceData {
    boarding_stop: {
      stop_id: number;
      stop_name: string;
      latitude: number;
      longitude: number;
    };
    walking_path: {
      coordinates: [number, number][];
      distance_meters: number;
      duration_seconds: number;
      steps: Array<{ instruction: string; distance: number }>;
    };
    next_bus: {
      route_number: string;
      eta_minutes: number;
    } | null;
    can_catch_next_bus: boolean;
  }

  const [currentLocation, setCurrentLocation] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  // New Walking Guidance State (Clean Slate)
  const [walkingGuidanceActive, setWalkingGuidanceActive] = useState(false);
  const [walkingGuidanceData, setWalkingGuidanceData] = useState<WalkingGuidanceData | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);
  const [activeBuses, setActiveBuses] = useState<any[]>([]);



  const watchIdRef = useRef<number | null>(null);

  // Fetch road-following route from OSRM (free, no API key needed)
  const fetchRouteFromOSRM = async (
    from: [number, number],
    to: [number, number],
    profile: 'driving' | 'foot' = 'driving'
  ): Promise<[number, number][]> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // OSRM returns [lng, lat], convert to [lat, lng] for Leaflet
        return data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
      }
    } catch (err) {
      console.error('OSRM route fetch failed:', err);
    }
    return [];
  };

  // Get user's current location and Fetch real data
  useEffect(() => {
    // 1. Get Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setCurrentLocation('My Location');
        },
        (error) => {
          console.warn('Geolocation access denied or failed:', error.message);
          const fallback: [number, number] = [6.9344, 79.8428];
          setUserLocation(fallback);
          setMapCenter(fallback);
          setCurrentLocation('Fort Railway Station');
          toast.info('Using default location (Fort). Enable GPS for better experience.');
        }
      );
    }

    // 2. Fetch Data from API
    const fetchData = async () => {
      try {
        const [busRes, routeRes, stopRes] = await Promise.all([
          fetch(ENDPOINTS.GET_LIVE_BUSES),
          fetch(ENDPOINTS.GET_ROUTES),
          fetch(ENDPOINTS.GET_STOPS)
        ]);
        const busData = await busRes.json();
        const routeData = await routeRes.json();
        const stopData = await stopRes.json();

        if (busData.success) setBuses(busData.buses || []);
        if (routeData.success) setRoutes(routeData.data || []);
        if (stopData.success) setAllStops(stopData.stops || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Auto-fetch road-following route preview when both locations are set
  useEffect(() => {
    const fromCoords = fromLocationCoords || userLocation;
    if (fromCoords && destinationCoords) {
      fetchRouteFromOSRM(fromCoords, destinationCoords, 'driving').then(path => {
        if (path.length > 0) {
          setRoutePath(path);
        }
      });
    } else {
      setRoutePath([]);
    }
  }, [fromLocationCoords, destinationCoords, userLocation]);

  const [allStops, setAllStops] = useState<any[]>([]);


  // Update nearby stops whenever buses or user location changes
  useEffect(() => {
    if (userLocation && allStops.length > 0) {
      const stops = getNearbyStops(userLocation);
      setNearbyStops(stops);
      if (stops.length > 0 && !nearestStop) setNearestStop(stops[0]);
    }

    if (buses.length > 0) {
      const mappedBuses = buses.map(bus => {
        const route = routes.find(r => r.id === bus.route_id);
        return {
          id: bus.plate_number,
          // Use real passengers if available, else 0
          passengers: bus.current_passengers || 0,
          capacity: bus.capacity,
          // Calculate ETA based on distance to user (simplified linear distance)
          // In production, this should come from the backend or OSRM
          eta: Math.ceil(calculateDistance(userLocation[0], userLocation[1], bus.latitude, bus.longitude) / 1000 * 3) + 2, // Approx 3 mins per km + buffer
          route: route?.route_name || 'Generic Route',
          routeNumber: route?.route_number || bus.route_id,
          color: route?.color || '#3b82f6',
          lat: bus.latitude,
          lng: bus.longitude,
        };
      });
      setActiveBuses(mappedBuses);
    }
  }, [userLocation, buses, routes, allStops]);

  const handleLocateMe = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setMapZoom(LOCATE_ME_ZOOM);
    } else {
      toast.error('Location not available yet.');
    }
  };

  const handleMapClick = (latlng: [number, number]) => {
    setDestinationCoords(latlng);
    setDestination(`Selected Position`);
    setMapCenter(latlng);
  };

  const handleBusClick = (bus: any) => {
    const route = routes.find((r: any) => r.id === bus.route_id);
    setSelectedRouteId(bus.route_id);
    setSelectedRoute({
      ...bus,
      route: route?.route_name,
      routeNumber: route?.route_number,
      color: route?.color,
    });
  };


  const getCrowdLevel = (passengers: number, capacity: number) => {
    const ratio = capacity > 0 ? passengers / capacity : 0;
    if (ratio < CROWD_LOW_THRESHOLD) return { level: 'Low', color: 'bg-green-500', text: 'text-green-700' };
    if (ratio < CROWD_HIGH_THRESHOLD) return { level: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-700' };
    return { level: 'High', color: 'bg-red-500', text: 'text-red-700' };
  };

  const handleBoardBus = (bus: any) => {
    navigate('/trip-active', { state: { bus, destination } });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const startLocationTracking = (guidanceData: any) => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        const newUserLoc: [number, number] = [currentLat, currentLng];
        setUserLocation(newUserLoc);

        if (guidanceData) {
          const remaining = calculateDistance(
            currentLat, currentLng,
            guidanceData.boarding_stop.latitude,
            guidanceData.boarding_stop.longitude
          );
          setDistanceRemaining(remaining);

          if (remaining < 30) {
            handleArrivedAtStop(guidanceData);
          }
        }
      },
      (error) => console.error('Location tracking error:', error),
      GEO_OPTIONS
    );
  };

  const handleArrivedAtStop = (data: any) => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWalkingGuidanceActive(false);
    toast.success(`🎉 You've arrived at ${data.boarding_stop.stop_name}! Look for Bus ${data.next_bus?.route_number || ''}`);

    // Switch to bus route selection or auto-ready
    setShowRoutes(true);
    setShowBottomSheet(true);
  };

  // Calculate actual nearby stops based on actual database stops
  const getNearbyStops = (coords: [number, number] | null) => {
    if (!coords || !allStops.length) return [];

    return allStops
      .map(stop => {
        const dist = calculateDistance(coords[0], coords[1], stop.latitude, stop.longitude);
        return {
          ...stop,
          distanceMeters: dist,
          distanceKm: (dist / 1000).toFixed(1),
          walkTime: Math.round(dist / WALK_SPEED_M_PER_MIN)
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 3)
      .map(s => ({
        name: s.stop_name,
        distance: s.distanceKm,
        walkTime: s.walkTime,
        lat: s.latitude,
        lng: s.longitude
      }));
  };

  const handleSearch = async () => {
    if (!destination) {
      toast.warning('Please select a destination first');
      return;
    }

    let finalFromCoords = fromLocationCoords || userLocation;

    if (!finalFromCoords) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const uLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(uLoc);
        performTripGuidance(uLoc);
      }, (error) => {
        toast.error('Please select a starting location or enable GPS');
        console.error(error);
      });
      return;
    }

    performTripGuidance(finalFromCoords);
  };

  const performTripGuidance = async (fromCoords: [number, number]) => {
    let dCoords = destinationCoords;
    if (!dCoords) {
      const destStop = allStops.find(s =>
        s.stop_name.toLowerCase().trim() === destination.toLowerCase().trim()
      );
      if (destStop) dCoords = [destStop.latitude, destStop.longitude];
    }


    if (!dCoords) {
      toast.error('Destination not found. Please select from suggestions.');
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.TRIP_GUIDANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          origin_lat: fromCoords[0],
          origin_lng: fromCoords[1],
          destination_lat: dCoords[0],
          destination_lng: dCoords[1],
          user_id: user?.id || 0
        })
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(`Trip Error: ${data.error}`);
        return;
      }

      // Always activate guidance, even if at stop (distance ~0)
      setWalkingGuidanceActive(true);
      setWalkingGuidanceData(data);
      setDistanceRemaining(data.distance_to_stop);

      // Clear the route preview since we now have detailed segments
      setRoutePath([]);

      // Update walking path to boarding stop
      if (data.walking_path && data.walking_path.coordinates) {
        setWalkingPath(data.walking_path.coordinates.map((coord: any) => [coord[1], coord[0]]));
      }

      // Fetch bus route path (boarding stop → alighting stop) using OSRM
      if (data.boarding_stop && data.alighting_stop) {
        const boardingCoords: [number, number] = [
          data.boarding_stop.latitude,
          data.boarding_stop.longitude
        ];
        const alightingCoords: [number, number] = [
          data.alighting_stop.latitude,
          data.alighting_stop.longitude
        ];

        // Fetch bus path geometry (driving route)
        const busGeometry = await fetchRouteFromOSRM(boardingCoords, alightingCoords, 'driving');
        if (busGeometry.length > 0) {
          setBusPath(busGeometry);
        } else {
          // Fallback: straight line between stops
          setBusPath([boardingCoords, alightingCoords]);
        }

        // Fetch walking path from alighting stop to final destination
        const destWalkGeometry = await fetchRouteFromOSRM(alightingCoords, dCoords, 'foot');
        if (destWalkGeometry.length > 0) {
          setDestWalkPath(destWalkGeometry);
        } else {
          setDestWalkPath([alightingCoords, dCoords]);
        }
      }

      startLocationTracking(data);

      if (!data.needs_walking_guidance) {
        // Just started and already there? Great!
        // Maybe auto-trigger "arrived" logic or just show "You are here"
        // For now, let the UI handle the "0m" display
      }

    } catch (error) {
      console.error('Trip guidance error:', error);
      toast.error('Failed to start guidance. Please try again.');
    }
  };

  const filterSuggestions = (value: string, isFrom: boolean = false) => {
    let results: any[] = [];
    if (value.length > 0) {
      results = allStops
        .filter(stop => stop.stop_name.toLowerCase().includes(value.toLowerCase()))
        .map(stop => ({
          id: stop.id,
          name: stop.stop_name,
          lat: stop.latitude,
          lng: stop.longitude
        }));
    }

    if (isFrom && value.length === 0) {
      return [{ id: 'current', name: 'My Location', lat: 0, lng: 0 }];
    }

    return results;
  };

  const handleFromChange = (value: string) => {
    setCurrentLocation(value);
    const filtered = filterSuggestions(value, true);
    setFromSuggestions(filtered);
    setShowFromSuggestions(true);
  };

  const handleToChange = (value: string) => {
    setDestination(value);
    const filtered = filterSuggestions(value);
    setToSuggestions(filtered);
    setShowToSuggestions(true);
  };

  const selectFromSuggestion = (stop: any) => {
    if (stop.id === 'current') {
      setCurrentLocation('My Location');
      setFromLocationCoords(null);
    } else {
      setCurrentLocation(stop.name);
      setFromLocationCoords([stop.lat, stop.lng]);
      setMapCenter([stop.lat, stop.lng]);
    }
    setShowFromSuggestions(false);
  };

  const selectToSuggestion = (stop: any) => {
    setDestination(stop.name);
    setShowToSuggestions(false);
    setDestinationCoords([stop.lat, stop.lng]);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowFromSuggestions(false);
      setShowToSuggestions(false);
    }, 200);
  };

  const swapLocations = () => {
    const tempLoc = currentLocation;
    const tempCoords = fromLocationCoords;

    setCurrentLocation(destination);
    setFromLocationCoords(destinationCoords);

    setDestination(tempLoc);
    setDestinationCoords(tempCoords);

    // If we swapped and destination became 'My Location', ensure coords are handled
    if (tempLoc === 'My Location' || tempLoc === 'Current Location') {
      setDestinationCoords(null); // Will be resolved to userLocation in search
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 relative overflow-hidden">
      {/* Real Map Background - z-index 0 */}
      <div className="absolute inset-0 z-0">
        <Map
          showBuses={true}
          showStops={true}
          showRoutes={showRoutes}
          selectedRoute={selectedRouteId}
          userLocation={userLocation}
          fromLocation={fromLocationCoords}
          destination={destinationCoords}
          onBusClick={handleBusClick}
          onMapClick={handleMapClick}
          center={mapCenter}
          zoom={mapZoom}
          walkingPath={walkingPath}
          routePath={routePath}
          busPath={busPath}
          destWalkPath={destWalkPath}
          buses={activeBuses}
          stops={allStops}
          routes={routes}
        />
      </div>

      {/* UI Overlay Container - z-index 1000 */}
      <div className="absolute inset-x-0 top-0 z-[1000] pointer-events-none">
        <div className="pointer-events-auto" style={{ pointerEvents: 'auto' }}>
          {/* Floating Top Bar */}
          <div className="mx-4 mt-4 mb-0 max-w-xl md:mx-auto">
            <div className="bg-white rounded-[24px] shadow-2xl p-4 flex items-center justify-between relative border border-gray-100">
              <button
                onClick={() => navigate('/user-profile')}
                className="p-2 hover:bg-gray-100 rounded-full z-10"
              >
                <User className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-xl font-black text-blue-600 absolute left-1/2 -translate-x-1/2 uppercase tracking-tighter">KANGO</h1>
              <div className="flex items-center z-10">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {!showRoutes && (
            <div className="mx-4 mt-2 max-w-xl md:mx-auto">
              <div className="bg-white rounded-[24px] shadow-2xl p-5 border border-gray-100 relative">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 space-y-3">
                    {/* From Input Group */}
                    <div className="relative z-[1010]">
                      <div className="flex items-center bg-gray-50 rounded-full px-3 py-1 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
                        <MapPin className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          value={currentLocation}
                          onChange={(e) => handleFromChange(e.target.value)}
                          onFocus={() => handleFromChange(currentLocation)}
                          onBlur={handleBlur}
                          className="w-full py-2.5 text-sm font-semibold text-gray-800 outline-none bg-transparent"
                          placeholder="Current Location"
                          style={{ pointerEvents: 'auto' }}
                        />
                        {currentLocation && (
                          <button
                            onClick={() => {
                              setCurrentLocation('');
                              setFromLocationCoords(null);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full ml-1"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>

                      {showFromSuggestions && fromSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-[1100] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 mt-2 max-h-60 overflow-y-auto">
                          {fromSuggestions.map((stop) => (
                            <div
                              key={stop.id}
                              onClick={() => selectFromSuggestion(stop)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-50 last:border-0"
                            >
                              {String(stop.id) === 'current' ? (
                                <Navigation className="w-4 h-4 text-blue-600 mr-3" />
                              ) : (
                                <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                              )}
                              <span className="text-sm font-medium text-gray-700">{stop.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* To Input Group */}
                    <div className="relative z-[1000]">
                      <div className="flex items-center bg-gray-50 rounded-full px-3 py-1 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
                        <MapPin className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => handleToChange(e.target.value)}
                          onFocus={() => handleToChange(destination)}
                          onBlur={handleBlur}
                          className="w-full py-2.5 text-sm font-semibold text-gray-800 outline-none bg-transparent"
                          placeholder="Where to?"
                          style={{ pointerEvents: 'auto' }}
                        />
                        {destination && (
                          <button
                            onClick={() => {
                              setDestination('');
                              setDestinationCoords(null);
                              setRoutePath([]);
                              setWalkingPath([]);
                              setBusPath([]);
                              setDestWalkPath([]);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full ml-1"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>

                      {showToSuggestions && toSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-[1100] bg-white rounded-xl shadow-[0_10px_40_rgba(0,0,0,0.1)] border border-gray-100 mt-2 max-h-60 overflow-y-auto">
                          {toSuggestions.map((stop) => (
                            <div
                              key={stop.id}
                              onClick={() => selectToSuggestion(stop)}
                              className="px-4 py-3 hover:bg-red-50 cursor-pointer flex items-center border-b border-gray-50 last:border-0"
                            >
                              <MapPin className="w-4 h-4 text-red-500 mr-3" />
                              <span className="text-sm font-medium text-gray-700">{stop.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Swap Button Column - Positioned between inputs in desktop or absolute centered in mobile */}
                  <div className="absolute right-[-10px] top-[50%] -translate-y-[50%] z-[1015]">
                    <button
                      onClick={swapLocations}
                      className="bg-white border border-gray-200 p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-90 hover:bg-blue-50 group"
                      title="Swap locations"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <ArrowUpDown className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={!destination}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all active:scale-[0.98] mt-4 group"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Find Best Route</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Locate Me Button */}
      <button
        onClick={handleLocateMe}
        className="fixed bottom-24 right-4 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Locate className="w-6 h-6 text-blue-600" />
      </button>

      {/* Bottom Sheet with Routes */}
      {showRoutes && showBottomSheet && (
        <div className="fixed inset-x-0 bottom-0 z-[1001] flex flex-col pointer-events-auto" style={{ maxHeight: '65vh' }}>
          {/* Handle */}
          <div className="flex justify-center py-2 bg-white rounded-t-3xl">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          <div className="bg-white flex-1 overflow-y-auto px-5 pb-6">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pt-2 pb-3">
              <h2 className="text-xl font-bold text-gray-800">Available Routes</h2>
              <button
                onClick={() => {
                  setShowRoutes(false);
                  setShowBottomSheet(false);
                  setDestination('');
                  setRoutePath([]);
                  setWalkingPath([]);
                  setBusPath([]);
                  setDestWalkPath([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <Footprints className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-blue-900">Walk to {nearestStop.name}</div>
                  <div className="text-sm text-blue-700">{nearestStop.walkTime} minutes • {nearestStop.distance} km</div>
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-700 mb-3">Upcoming Buses</h3>
            <div className="space-y-3">
              {activeBuses.map((bus) => {
                const crowd = getCrowdLevel(bus.passengers, bus.capacity);
                const canCatch = nearestStop.walkTime <= bus.eta + 2;

                return (
                  <div
                    key={bus.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-blue-400 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mr-3 flex-shrink-0"
                          style={{ backgroundColor: bus.color + '20' }}
                        >
                          <Bus className="w-6 h-6" style={{ color: bus.color }} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{bus.id}</div>
                          <div className="text-sm text-gray-600">{bus.route}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{bus.eta} min</div>
                        <div className="text-xs text-gray-500">ETA</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">{bus.passengers}/{bus.capacity} passengers</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${crowd.color} ${crowd.text} bg-opacity-20`}>
                        {crowd.level} Crowd
                      </div>
                    </div>

                    {canCatch ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium">✓ You can catch this bus</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBoardBus(bus);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 shadow-md"
                        >
                          Board
                        </button>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <span className="text-sm text-yellow-700 font-medium">
                          ⏱ Next bus recommended
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Walking Guidance Overlay */}
      {walkingGuidanceActive && walkingGuidanceData && (
        <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 bg-white p-6 rounded-2xl shadow-2xl z-[1002] min-w-[350px] max-w-[95vw] md:max-w-md max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 pointer-events-auto custom-scrollbar">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">
              {(!walkingGuidanceData.can_catch_next_bus && distanceRemaining < 50) ? '🏁' : '🚶'}
            </span>
            {distanceRemaining < 50 ? 'You are at the bus stop!' : 'Walking to Bus Stop'}
          </h3>

          <div className="mb-3 text-sm text-gray-600">
            <strong className="text-gray-800">📍 Destination:</strong> {walkingGuidanceData.boarding_stop.stop_name}
            {walkingGuidanceData.boarding_stop.stop_name.toLowerCase().includes('station') && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Bus Stop</span>
            )}
          </div>
          <div className="mb-4 text-sm text-gray-600 flex items-center gap-3">
            <span><strong className="text-gray-800">📏 Distance:</strong> {Math.round(distanceRemaining)}m</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span><strong className="text-gray-800">⏱️ Time:</strong> ~{Math.round(distanceRemaining / WALK_SPEED_M_PER_SEC / 60)} min</span>
          </div>

          {walkingGuidanceData.next_bus && (
            <div className={`p-4 rounded-xl mb-4 ${walkingGuidanceData.can_catch_next_bus ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-orange-50 border border-orange-100 text-orange-800'}`}>
              <div className="flex items-center justify-between font-bold text-sm">
                <span className="flex items-center">
                  <span className="mr-2">🚌</span> Bus {walkingGuidanceData.next_bus.route_number}
                </span>
                <span>Arrives in {walkingGuidanceData.next_bus.eta_minutes} min</span>
              </div>
              <div className="text-xs mt-1 opacity-80 font-medium">
                {walkingGuidanceData.can_catch_next_bus ? '✅ You can catch it!' : '⚠️ Might be tight - try to hurry!'}
              </div>
            </div>
          )}

          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-bold text-blue-600 hover:text-blue-700 outline-none">
              Turn-by-Turn Directions
            </summary>
            <div className="mt-3 space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {walkingGuidanceData.walking_path.steps.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-800 font-medium leading-snug">{step.instruction}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{Math.round(step.distance)}m</div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <button
            onClick={() => handleArrivedAtStop(walkingGuidanceData)}
            className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 rounded-xl transition-colors text-xs uppercase"
          >
            I'm at the stop
          </button>
        </div>
      )}
    </div>
  );
}
