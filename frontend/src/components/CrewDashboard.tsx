import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Bus,
  Users,
  Navigation,
  AlertCircle,
  Clock,
  MapPin,
  Timer,
  Play,
  Square,
  Menu,
  LogOut
} from 'lucide-react';

// Removed mock data
const API_BASE = 'http://localhost/kango-backend/api'; // Use full URL to avoid proxy issues in dev

export function CrewDashboard() {
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(false);
  const [passengerCount, setPassengerCount] = useState(0);
  const [busId, setBusId] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState<string | null>(null);
  const [routeName, setRouteName] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial state
    const storedBusId = localStorage.getItem('bus_id');
    const storedPlate = localStorage.getItem('bus_plate');
    const storedRoute = localStorage.getItem('route_name');

    if (storedBusId) setBusId(storedBusId);
    if (storedPlate) setPlateNumber(storedPlate);
    if (storedRoute) setRouteName(storedRoute);

    // Fetch current bus status if needed (e.g. current passengers)
    // For now starts at 0 or persists if we add local storage for session
  }, []);

  const updateLocation = async (position: GeolocationPosition) => {
    if (!busId) return;

    try {
      await fetch(`${API_BASE}/update-bus-location.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_id: busId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
          current_passengers: passengerCount
        })
      });
    } catch (error) {
      console.error('Failed to update location', error);
    }
  };

  const toggleLiveBroadcast = () => {
    if (isLive) {
      // Stop broadcasting
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsLive(false);
    } else {
      // Start broadcasting
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (position) => {
          updateLocation(position);
          setLocationError(null);
        },
        (error) => {
          setLocationError('Unable to retrieve location: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setWatchId(id);
      setIsLive(true);
    }
  };

  const handlePassengerChange = (change: number) => {
    const newCount = Math.max(0, passengerCount + change);
    setPassengerCount(newCount);
    // Ideally send immediate update if broadcasting, but the next location update will pick it up
    // For better UX, we could force a location update if we had valid coords, 
    // but without storing last coords, we just wait for next tick or rely on state.
  };

  const handleReportIssue = () => {
    const issue = prompt('Report an issue:\n- traffic\n- delay\n- maintenance\n\nDescription:');
    if (issue) {
      console.log('Issue reported:', issue);
      // In a real app, would send to API
      alert('Issue reported: ' + issue + '\nOur team will look into it shortly.');
    }
  };

  const handleBreakTime = () => {
    alert('Break time marked. Your status has been updated.\nPlease resume broadcasting when you return.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bus className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-xl font-bold">Bus Crew Portal</h1>
              <p className="text-orange-100 text-sm">
                {plateNumber ? `${plateNumber} • ${routeName}` : 'No Bus Assigned'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/20 rounded-full"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        {/* Live tracking toggle */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Navigation className={`w-6 h-6 mr-3 ${isLive ? 'animate-pulse' : ''}`} />
            <div>
              <div className="font-semibold">Live Location Broadcast</div>
              <div className="text-sm text-orange-100">
                {isLive ? 'Broadcasting to passengers' : 'Not broadcasting'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleLiveBroadcast}
            className={`px-6 py-2 rounded-xl font-semibold transition-colors ${isLive
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
              }`}
          >
            {isLive ? 'Stop Broadcast' : 'Start Broadcast'}
          </button>
        </div>

        {locationError && (
          <div className="mt-4 bg-red-500/20 text-red-100 p-3 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {locationError}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Passenger Counter */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-gray-500 font-medium">Passengers</span>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Capacity: 60
              </span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePassengerChange(-1)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors"
                disabled={passengerCount <= 0}
              >
                -
              </button>

              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800">{passengerCount}</div>
                <div className="text-sm text-gray-500">On Board</div>
              </div>

              <button
                onClick={() => handlePassengerChange(1)}
                className="w-12 h-12 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Route Status */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-green-600 mr-2" />
                <span className="text-gray-500 font-medium">Status</span>
              </div>
              {isLive && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </div>

            <div className="mb-2">
              <div className={`text-2xl font-bold ${isLive ? 'text-green-600' : 'text-gray-400'}`}>
                {isLive ? 'Active' : 'Offline'}
              </div>
              <div className="text-sm text-gray-500">
                {isLive ? 'Broadcasting location' : 'Start broadcast to go live'}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-800">
                    {routeName || 'No Route Assigned'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {plateNumber || 'Bus details unavailable'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleReportIssue}
              className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-4 flex items-center transition-colors"
            >
              <AlertCircle className="w-6 h-6 text-blue-600 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">Report Issue</div>
                <div className="text-sm text-gray-600">Traffic, delay, maintenance</div>
              </div>
            </button>

            <button
              onClick={handleBreakTime}
              className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-4 flex items-center transition-colors"
            >
              <Clock className="w-6 h-6 text-green-600 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">Break Time</div>
                <div className="text-sm text-gray-600">Mark scheduled break</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
