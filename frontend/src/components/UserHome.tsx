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
  Map as MapIcon
} from 'lucide-react';
import { Map, COLOMBO_BUS_STOPS, COLOMBO_ROUTES, SAMPLE_BUSES, COLOMBO_CENTER, createStopIcon, createBusIcon } from './Map';
import { WalkingGuidanceOverlay } from './WalkingGuidanceOverlay';
import { ENDPOINTS } from '../lib/api-config';

// Active bus tracking data
const activeBuses = SAMPLE_BUSES.map(bus => {
  const route = COLOMBO_ROUTES.find(r => r.id === bus.routeId);
  return {
    id: bus.id,
    eta: Math.floor(Math.random() * 10) + 2,
    passengers: bus.passengers,
    capacity: bus.capacity,
    route: route?.name || 'Unknown',
    routeNumber: route?.number || '',
    color: route?.color || '#3b82f6',
    lat: bus.lat,
    lng: bus.lng,
  };
});

// Nearby stops for initialization
const nearbyStops = COLOMBO_BUS_STOPS.slice(0, 3).map((stop, index) => ({
  name: stop.name,
  distance: (0.3 + index * 0.2).toFixed(1),
  walkTime: 4 + index * 3,
  lat: stop.lat,
  lng: stop.lng,
}));

export function UserHome() {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [nearestStop, setNearestStop] = useState(nearbyStops[0]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(COLOMBO_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [walkingPath, setWalkingPath] = useState<[number, number][]>([]);

  // Autocomplete state
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<typeof COLOMBO_BUS_STOPS>([]);
  const [toSuggestions, setToSuggestions] = useState<typeof COLOMBO_BUS_STOPS>([]);

  // Walking Guidance State
  const [walkingGuidance, setWalkingGuidance] = useState<{
    isActive: boolean;
    data: any;
  }>({ isActive: false, data: null });
  const watchIdRef = useRef<number | null>(null);


  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setCurrentLocation('My Location');
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to Colombo Fort if location access denied
          setUserLocation([6.9344, 79.8428]);
          setCurrentLocation('Fort Railway Station');
        }
      );
    }
  }, []);



  const handleLocateMe = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setMapZoom(15);
    }
  };

  const handleBusClick = (bus: any) => {
    const route = COLOMBO_ROUTES.find(r => r.id === bus.routeId);
    setSelectedRouteId(bus.routeId);
    setSelectedRoute({
      ...bus,
      route: route?.name,
      routeNumber: route?.number,
      color: route?.color,
    });
  };

  const getCrowdLevel = (passengers: number, capacity: number) => {
    const ratio = passengers / capacity;
    if (ratio < 0.5) return { level: 'Low', color: 'bg-green-500', text: 'text-green-700' };
    if (ratio < 0.8) return { level: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-700' };
    return { level: 'High', color: 'bg-red-500', text: 'text-red-700' };
  };

  const handleBoardBus = (bus: any) => {
    navigate('/trip-active', { state: { bus, destination } });
  };

  // Calculate distance between two points (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const startWalkingGuidance = (guidanceData: any) => {
    setWalkingGuidance({ isActive: true, data: guidanceData });

    // Set walking path for map
    if (guidanceData.walking_path && guidanceData.walking_path.steps) {
      // Convert steps to coordinates for polyline
      // Note: steps usually contain end locations. We might need a full geometry if available.
      // For now, let's construct a path from user location -> steps -> station
      const path: [number, number][] = [];
      if (userLocation) path.push(userLocation);
      guidanceData.walking_path.steps.forEach((step: any) => {
        path.push([step.location[0], step.location[1]]);
      });
      setWalkingPath(path);
    }

    setShowBottomSheet(false); // Hide routes sheet

    // Start watching position
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          // Calculate distance to stop
          const dist = calculateDistance(
            latitude, longitude,
            guidanceData.boarding_stop.lat,
            guidanceData.boarding_stop.lng
          );

          // Update guidance data with new distance
          setWalkingGuidance(prev => ({
            ...prev,
            data: {
              ...prev.data,
              current_distance_to_stop: dist
            }
          }));

          // Auto-arrival check (within 30m)
          if (dist < 30) {
            handleArrivedAtStop();
          }
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );

      // TODO: Implement isOffRoute() check to recalculate path if user deviates significantly
      // if (isOffRoute(latitude, longitude, guidanceData.walking_path)) {
      //   recalculateRoute();
      // }
    }
  };

  const handleArrivedAtStop = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setWalkingGuidance({ isActive: false, data: null });
    setWalkingPath([]); // Clear path

    // Proceed to bus boarding flow
    // Automatically select the route we were guiding for
    // Check if we have a next bus in the guidance data
    // Note regarding access to latest state inside callback:
    // We should ideally use a ref or check the current state if available.
    // For now, we'll just show the routes sheet.

    setShowRoutes(true);
    setShowBottomSheet(true);
    // Removed alert for smoother transition
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Timer for Bus ETA updates during walking
  useEffect(() => {
    let interval: any;
    if (walkingGuidance.isActive && walkingGuidance.data?.next_bus) {
      interval = setInterval(() => {
        setWalkingGuidance(prev => {
          if (!prev.data || !prev.data.next_bus) return prev;

          const newEta = Math.max(0, prev.data.next_bus.eta_minutes - 1);
          return {
            ...prev,
            data: {
              ...prev.data,
              next_bus: {
                ...prev.data.next_bus,
                eta_minutes: newEta
              }
            }
          };
        });
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [walkingGuidance.isActive]);

  const handleSearch = async () => {
    if (destination) {
      // Find a matching stop for destination
      const destStop = COLOMBO_BUS_STOPS.find(s =>
        s.name.toLowerCase().includes(destination.toLowerCase())
      ) || COLOMBO_BUS_STOPS[6]; // Default to Mount Lavinia

      const destCoords: [number, number] = [destStop.lat, destStop.lng];
      setDestinationCoords(destCoords);
      setMapZoom(12);

      // Check for walking guidance
      if (userLocation) {
        try {
          const response = await fetch(ENDPOINTS.CHECK_GUIDANCE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin_lat: userLocation[0],
              origin_lng: userLocation[1],
              destination_lat: destCoords[0],
              destination_lng: destCoords[1],
              user_id: 1
            })
          });

          const data = await response.json();

          if (data.needs_walking_guidance) {
            startWalkingGuidance(data);
          } else {
            // Already at stop
            setShowRoutes(true);
            setShowBottomSheet(true);
          }
        } catch (error) {
          console.error("Error checking guidance:", error);
          // Fallback to normal flow
          setShowRoutes(true);
          setShowBottomSheet(true);
        }
      } else {
        // No user location, standard flow
        setShowRoutes(true);
        setShowBottomSheet(true);
      }
    }
  };

  const filterSuggestions = (value: string) => {
    if (value.length > 0) {
      const filtered = COLOMBO_BUS_STOPS.filter(stop =>
        stop.name.toLowerCase().includes(value.toLowerCase())
      );
      return filtered;
    }
    return [];
  };

  const handleFromChange = (value: string) => {
    setCurrentLocation(value);
    const filtered = filterSuggestions(value);
    setFromSuggestions(filtered);
    setShowFromSuggestions(filtered.length > 0);
  };

  const handleToChange = (value: string) => {
    setDestination(value);
    if (value.length > 0) {
      const filtered = COLOMBO_BUS_STOPS.filter(stop =>
        stop.name.toLowerCase().includes(value.toLowerCase())
      );
      setToSuggestions(filtered);
      setShowToSuggestions(filtered.length > 0);
    } else {
      setShowToSuggestions(false);
    }
  };

  const selectFromSuggestion = (stop: typeof COLOMBO_BUS_STOPS[0]) => {
    setCurrentLocation(stop.name);
    setShowFromSuggestions(false);
    setUserLocation([stop.lat, stop.lng]);
    setMapCenter([stop.lat, stop.lng]);
  };

  const selectToSuggestion = (stop: typeof COLOMBO_BUS_STOPS[0]) => {
    setDestination(stop.name);
    setShowToSuggestions(false);
    setDestinationCoords([stop.lat, stop.lng]);
  };

  // Close suggestions when clicking outside
  const handleBlur = () => {
    // Delay to allow click on suggestion to register
    setTimeout(() => {
      setShowFromSuggestions(false);
      setShowToSuggestions(false);
    }, 200);
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
          destination={destinationCoords}
          onBusClick={handleBusClick}
          center={mapCenter}
          zoom={mapZoom}
          walkingPath={walkingPath}
        />
      </div>

      {/* UI Overlay Container - z-index 1000 - NO pointer-events-none */}
      <div className="absolute inset-x-0 top-0 z-[1000]">
        {/* Floating Top Bar */}
        <div className="m-4 mb-0">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-3 flex items-center justify-between relative">
            <button
              onClick={() => navigate('/user-profile')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <User className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-blue-600 absolute left-1/2 -translate-x-1/2">KANGO</h1>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/journey-planner')}
                className="p-2 hover:bg-gray-100 rounded-full mr-1"
                title="Journey Planner"
              >
                <MapIcon className="w-6 h-6 text-blue-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Search Card */}
        {!showRoutes && (
          <>
            <div className="route-input-card shadow-2xl p-5">
              {/* Current Location */}
              <div className="flex items-center mb-4 pb-4 border-b border-gray-200 relative">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Navigation className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 relative">
                  <div className="text-xs text-gray-500 mb-1">From</div>
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => handleFromChange(e.target.value)}
                    onFocus={() => currentLocation.length > 0 && handleFromChange(currentLocation)}
                    onBlur={handleBlur}
                    className="w-full font-medium text-gray-800 outline-none bg-white"
                    placeholder="Current location"
                  />
                  {/* From Suggestions */}
                  {showFromSuggestions && (
                    <div className="absolute left-0 right-0 top-full z-50 bg-white rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto border border-gray-200">
                      {fromSuggestions.map((stop) => (
                        <div
                          key={stop.id}
                          onClick={() => selectFromSuggestion(stop)}
                          className="px-4 py-3 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center"
                        >
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          {stop.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center mb-4 relative">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 relative">
                  <div className="text-xs text-gray-500 mb-1">To</div>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => handleToChange(e.target.value)}
                    onFocus={() => {
                      // Show all stops when focusing on empty field
                      if (destination.length === 0) {
                        setToSuggestions(COLOMBO_BUS_STOPS);
                        setShowToSuggestions(true);
                      } else {
                        handleToChange(destination);
                      }
                    }}
                    onBlur={handleBlur}
                    className="w-full font-medium text-gray-800 outline-none bg-white"
                    placeholder="Where to?"
                  />
                  {/* To Suggestions */}
                  {showToSuggestions && (
                    <div className="absolute left-0 right-0 top-full z-50 bg-white rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto border border-gray-200">
                      {toSuggestions.map((stop) => (
                        <div
                          key={stop.id}
                          onClick={() => selectToSuggestion(stop)}
                          className="px-4 py-3 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center"
                        >
                          <MapPin className="w-4 h-4 text-red-400 mr-2" />
                          {stop.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={!destination}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center shadow-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Find Best Route
              </button>
            </div>

            {/* Nearest Stop Info */}
            <div className="nearest-stop-section">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Nearest Bus Stop</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{nearestStop.name}</div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Footprints className="w-4 h-4 mr-1" />
                    {nearestStop.walkTime} min walk • {nearestStop.distance} km
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Distance</div>
                  <div className="text-lg font-bold text-blue-600">{nearestStop.distance} km</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Locate Me Button - Separate element */}
      <button
        onClick={handleLocateMe}
        className="absolute bottom-32 right-4 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Locate className="w-6 h-6 text-blue-600" />
      </button>

      {/* Bottom Sheet with Routes - Outside overlay, has its own z-index */}
      {showRoutes && showBottomSheet && (
        <div className="fixed inset-x-0 bottom-0 z-[1001] flex flex-col pointer-events-auto" style={{ maxHeight: '65vh' }}>
          {/* Handle */}
          <div className="flex justify-center py-2 bg-white rounded-t-3xl">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Content */}
          <div className="bg-white flex-1 overflow-y-auto px-5 pb-6">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pt-2 pb-3">
              <h2 className="text-xl font-bold text-gray-800">Available Routes</h2>
              <button
                onClick={() => {
                  setShowRoutes(false);
                  setShowBottomSheet(false);
                  setDestination('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Route instruction */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <Footprints className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-blue-900">Walk to {nearestStop.name}</div>
                  <div className="text-sm text-blue-700">{nearestStop.walkTime} minutes • {nearestStop.distance} km</div>
                </div>
              </div>
            </div>

            {/* Upcoming Buses */}
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
                    {/* Bus Header */}
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

                    {/* Crowd Indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">{bus.passengers}/{bus.capacity} passengers</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${crowd.color} ${crowd.text} bg-opacity-20`}>
                        {crowd.level} Crowd
                      </div>
                    </div>

                    {/* Catchable indicator */}
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
      {walkingGuidance.isActive && walkingGuidance.data && (
        <WalkingGuidanceOverlay
          guidanceData={walkingGuidance.data}
          userLocation={userLocation}
          onArrived={handleArrivedAtStop}
        />
      )}
    </div>
  );
}