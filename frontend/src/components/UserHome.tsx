
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
  CreditCard
} from 'lucide-react';
import { Map, COLOMBO_BUS_STOPS, COLOMBO_ROUTES, SAMPLE_BUSES, COLOMBO_CENTER, createStopIcon, createBusIcon } from './Map';

import { ENDPOINTS } from '../lib/api-config';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../lib/api';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [nearestStop, setNearestStop] = useState<any>(nearbyStops[0]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [fromLocationCoords, setFromLocationCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(COLOMBO_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [walkingPath, setWalkingPath] = useState<[number, number][]>([]);
  const [walkingPathToStop, setWalkingPathToStop] = useState<[number, number][]>([]);
  const [walkingPathFromStop, setWalkingPathFromStop] = useState<[number, number][]>([]);

  // Autocomplete state
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<typeof COLOMBO_BUS_STOPS>([]);
  const [toSuggestions, setToSuggestions] = useState<typeof COLOMBO_BUS_STOPS>([]);

  interface WalkingGuidanceData {
    boarding_stop: {
      stop_id: number;
      stop_name: string;
      latitude: number;
      longitude: number;
    };
    // Legacy support
    walking_path?: {
      coordinates: [number, number][];
      distance_meters: number;
      duration_seconds: number;
      steps: Array<{ instruction: string; distance: number }>;
    };
    walking_path_to_stop?: {
      coordinates: [number, number][];
      distance_meters: number;
      duration_seconds: number;
      steps: Array<{ instruction: string; distance: number }>;
    };
    walking_path_from_stop?: {
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

  // New Walking Guidance State (Clean Slate)
  const [walkingGuidanceActive, setWalkingGuidanceActive] = useState(false);
  const [walkingGuidanceData, setWalkingGuidanceData] = useState<WalkingGuidanceData | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);

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

          // Initialize nearby stops dynamically
          const nearby = getNearbyStops(coords);
          if (nearby.length > 0) {
            setNearestStop(nearby[0]);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          const fallback: [number, number] = [6.9344, 79.8428];
          setUserLocation(fallback);
          setMapCenter(fallback);
          setCurrentLocation('Fort Railway Station');

          const nearby = getNearbyStops(fallback);
          if (nearby.length > 0) {
            setNearestStop(nearby[0]);
          }
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

  const handleMapClick = (latlng: [number, number]) => {
    setDestinationCoords(latlng);
    setDestination(`Selected Position`);
    // Do NOT center map here to let user look around
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
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  };

  const handleArrivedAtStop = (data: any) => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWalkingGuidanceActive(false);
    alert(`🎉 You've arrived at ${data.boarding_stop.stop_name}! Look for Bus ${data.next_bus?.route_number || ''}`);

    // Switch to bus route selection or auto-ready
    setShowRoutes(true);
    setShowBottomSheet(true);
  };

  // Calculate actual nearby stops based on user location
  const getNearbyStops = (coords: [number, number] | null) => {
    if (!coords) return [];

    return COLOMBO_BUS_STOPS
      .map(stop => {
        const dist = calculateDistance(coords[0], coords[1], stop.lat, stop.lng);
        return {
          ...stop,
          distanceMeters: dist,
          distanceKm: (dist / 1000).toFixed(1),
          walkTime: Math.round(dist / 80) // ~5km/h = 83m/min
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 3)
      .map(s => ({
        name: s.name,
        distance: s.distanceKm,
        walkTime: s.walkTime,
        lat: s.lat,
        lng: s.lng
      }));
  };

  const handleSearch = async () => {
    if (!destination) {
      alert('Please select a destination first');
      return;
    }

    let finalFromCoords = fromLocationCoords || userLocation;

    if (!finalFromCoords) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const uLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(uLoc);
        performTripGuidance(uLoc);
      }, (error) => {
        alert('Please select a starting location or enable GPS');
        console.error(error);
      });
      return;
    }

    performTripGuidance(finalFromCoords);
  };

  const performTripGuidance = async (fromCoords: [number, number]) => {
    let dCoords = destinationCoords;
    if (!dCoords) {
      const destStop = COLOMBO_BUS_STOPS.find(s =>
        s.name.toLowerCase().trim() === destination.toLowerCase().trim()
      );
      if (destStop) dCoords = [destStop.lat, destStop.lng];
    }

    if (!dCoords) {
      alert('Destination not found. Please select from suggestions.');
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
        alert(`Error: ${data.error}`);
        return;
      }

      setWalkingGuidanceActive(true);
      setWalkingGuidanceData(data);
      setDistanceRemaining(data.distance_to_stop);

      // CLEAR previous single path
      setWalkingPath([]);

      // Update NEW map paths
      if (data.walking_path_to_stop && data.walking_path_to_stop.coordinates) {
        setWalkingPathToStop(data.walking_path_to_stop.coordinates.map((coord: any) => [coord[1], coord[0]]));
      } else {
        setWalkingPathToStop([]);
      }

      if (data.walking_path_from_stop && data.walking_path_from_stop.coordinates) {
        setWalkingPathFromStop(data.walking_path_from_stop.coordinates.map((coord: any) => [coord[1], coord[0]]));
      } else {
        setWalkingPathFromStop([]);
      }

      if (data.needs_walking_guidance) {
        startLocationTracking(data);
      } else {
        alert(data.message || 'You are already at the stop!');
        setShowRoutes(true);
        setShowBottomSheet(true);
      }
    } catch (error) {
      console.error('Trip guidance error:', error);
      alert('Failed to start guidance');
    }
  };

  const filterSuggestions = (value: string, isFrom: boolean = false) => {
    let results: any[] = [];
    if (value.length > 0) {
      results = COLOMBO_BUS_STOPS.filter(stop =>
        stop.name.toLowerCase().includes(value.toLowerCase())
      );
    }

    // Add "My Location" as first option for 'From' field
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
          showBuses={true} // Always show buses
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
          walkingPathToStop={walkingPathToStop}
          walkingPathFromStop={walkingPathFromStop}
        />
      </div>

      {/* UI Overlay Container - z-index 1000 */}
      <div className="absolute inset-x-0 top-0 z-[1000] pointer-events-none">
        <div className="pointer-events-auto" style={{ pointerEvents: 'auto' }}>
          {/* Floating Top Bar */}
          <div className="m-4 mb-0">
            <div className="bg-white rounded-[24px] shadow-xl p-4 flex items-center justify-between relative border border-gray-100">
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
                      <div className="flex items-center bg-gray-50 rounded-xl px-3 py-1 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
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
                      <div className="flex items-center bg-gray-50 rounded-xl px-3 py-1 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
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
                      <ArrowRight className="w-4 h-4 text-blue-600 rotate-90 group-hover:scale-110 transition-transform" />
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
        className="absolute bottom-32 right-4 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Locate className="w-6 h-6 text-blue-600" />
      </button>

      {/* Buy Test Ticket Button (Stripe Integration Test) */}
      <button
        onClick={async () => {
          const loadingToast = toast.loading('Checking payment method...');
          try {
            // 1. Check if payment method exists
            const statusFn = await userApi.getPaymentStatus();
            if (!statusFn.success || !statusFn.data?.has_payment_method) {
              toast.dismiss(loadingToast);
              toast.error('Payment method not in place', {
                description: 'Please add a card in your profile settings.',
                action: {
                  label: 'Go to Settings',
                  onClick: () => navigate('/user-profile')
                }
              });
              return;
            }

            // 2. Proceed with charge
            toast.dismiss(loadingToast);
            const chargeToast = toast.loading('Processing payment...');

            const chargeResponse = await userApi.testCharge();
            toast.dismiss(chargeToast);

            if (chargeResponse.success) {
              toast.success('Ticket Purchased!', {
                description: `charged ${chargeResponse.data?.amount} ${chargeResponse.data?.currency}`
              });
            } else {
              toast.error(chargeResponse.message || 'Payment failed');
            }
          } catch (err) {
            toast.dismiss(loadingToast);
            console.error(err);
            toast.error('Something went wrong');
          }
        }}
        className="absolute bottom-48 right-4 z-[1000] w-12 h-12 bg-green-600 rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors text-white"
        title="Buy Test Ticket"
      >
        <CreditCard className="w-6 h-6" />
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
            <span className="mr-2">🚶</span> Walking to Bus Stop
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
            <span><strong className="text-gray-800">⏱️ Time:</strong> ~{Math.round(distanceRemaining / 1.4 / 60)} min</span>
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
              {/* Use walking_path_to_stop if available, or fallback to walking_path */}
              {(walkingGuidanceData.walking_path_to_stop?.steps || walkingGuidanceData.walking_path?.steps || []).map((step: any, idx: number) => (
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
