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

const mockRoute = {
  name: 'Downtown Express',
  busId: 'BUS-45',
  stops: [
    { name: 'Main Street Station', status: 'completed' },
    { name: 'Park Avenue', status: 'completed' },
    { name: 'Central Plaza', status: 'current' },
    { name: 'Business District', status: 'upcoming' },
    { name: 'Harbor Terminal', status: 'upcoming' },
  ]
};

const mockWaitRequests = [
  { id: 1, passenger: 'User #4521', location: 'Central Plaza', timeLeft: 8 },
  { id: 2, passenger: 'User #7823', location: 'Business District', timeLeft: 10 },
];

export function CrewDashboard() {
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(false);
  const [passengerCount, setPassengerCount] = useState(12);
  const [waitRequests, setWaitRequests] = useState(mockWaitRequests);

  useEffect(() => {
    if (waitRequests.length > 0) {
      const interval = setInterval(() => {
        setWaitRequests(prev => 
          prev.map(req => ({
            ...req,
            timeLeft: req.timeLeft - 1
          })).filter(req => req.timeLeft > 0)
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [waitRequests]);

  const handleExtendWait = (id: number) => {
    setWaitRequests(prev =>
      prev.map(req => req.id === id ? { ...req, timeLeft: req.timeLeft + 10 } : req)
    );
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
              <p className="text-orange-100 text-sm">{mockRoute.busId}</p>
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
            onClick={() => setIsLive(!isLive)}
            className={`px-6 py-2 rounded-xl font-semibold transition-colors ${
              isLive 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isLive ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-xs text-gray-500">Current</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{passengerCount}</div>
            <div className="text-sm text-gray-600">Passengers</div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 text-green-600" />
              <span className="text-xs text-gray-500">Status</span>
            </div>
            <div className="text-lg font-bold text-green-600">On Time</div>
            <div className="text-sm text-gray-600">Route Status</div>
          </div>
        </div>

        {/* Current Route */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Route</h2>
          <div className="bg-orange-50 border-l-4 border-orange-600 p-3 rounded-lg mb-4">
            <div className="font-semibold text-orange-900">{mockRoute.name}</div>
            <div className="text-sm text-orange-700">Route ID: {mockRoute.busId}</div>
          </div>

          <div className="space-y-3">
            {mockRoute.stops.map((stop, index) => (
              <div key={index} className="flex items-start">
                <div className="mr-4 mt-1">
                  {stop.status === 'completed' ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  ) : stop.status === 'current' ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    stop.status === 'current' ? 'text-blue-600' : 'text-gray-800'
                  }`}>
                    {stop.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stop.status === 'completed' && '✓ Completed'}
                    {stop.status === 'current' && '→ Current Stop'}
                    {stop.status === 'upcoming' && 'Upcoming'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wait Requests */}
        {waitRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center mb-4">
              <Timer className="w-6 h-6 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Wait Requests</h2>
            </div>

            <div className="space-y-3">
              {waitRequests.map((request) => (
                <div key={request.id} className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-800">{request.passenger}</div>
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {request.location}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{request.timeLeft}s</div>
                      <div className="text-xs text-gray-600">remaining</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExtendWait(request.id)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                  >
                    + Extend 10 seconds
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-4 flex items-center transition-colors">
              <AlertCircle className="w-6 h-6 text-blue-600 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">Report Issue</div>
                <div className="text-sm text-gray-600">Traffic, delay, maintenance</div>
              </div>
            </button>

            <button className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-4 flex items-center transition-colors">
              <Clock className="w-6 h-6 text-green-600 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">Break Time</div>
                <div className="text-sm text-gray-600">Mark scheduled break</div>
              </div>
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-3 gap-2 pb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow">
            <div className="text-xs text-gray-500 mb-1">Capacity</div>
            <div className="font-bold text-gray-800">40</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow">
            <div className="text-xs text-gray-500 mb-1">On Board</div>
            <div className="font-bold text-blue-600">{passengerCount}</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow">
            <div className="text-xs text-gray-500 mb-1">Available</div>
            <div className="font-bold text-green-600">{40 - passengerCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
