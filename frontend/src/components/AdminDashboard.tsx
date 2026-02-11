import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Bus,
  Users,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  Activity,
  UserCheck
} from 'lucide-react';
import { adminApi } from '@/lib/api';

const mockAnalytics = {
  totalTrips: 1247,
  totalPassengers: 8942,
  avgRating: 4.8,
  peakHour: '7:30 AM - 9:00 AM'
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'buses' | 'routes' | 'analytics' | 'crew'>('buses');
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [pendingCrew, setPendingCrew] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'buses') {
        const res = await adminApi.getBuses();
        if (res.success && res.data) setBuses(res.data);
      } else if (activeTab === 'routes') {
        const res = await adminApi.getRoutes();
        if (res.success && res.data) setRoutes(res.data);
      } else if (activeTab === 'crew') {
        const res = await adminApi.getPendingCrew();
        if (res.success && res.data) setPendingCrew(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">KANGO Management</h1>
              <p className="text-blue-100 text-sm">Sri Lanka Bus Network Control</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/20 rounded-full"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="text-2xl font-bold">{buses.length}</div>
            <div className="text-sm text-blue-100">Active Buses</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="text-2xl font-bold">{mockAnalytics.totalPassengers}</div>
            <div className="text-sm text-blue-100">Total Riders</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="text-2xl font-bold">{routes.length || 3}</div>
            <div className="text-sm text-blue-100">Main Routes</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm flex overflow-x-auto">
        <button
          onClick={() => setActiveTab('buses')}
          className={`flex-1 min-w-[100px] py-4 text-center font-semibold transition-colors border-b-2 ${activeTab === 'buses'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent'
            }`}
        >
          Fleet
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex-1 min-w-[100px] py-4 text-center font-semibold transition-colors border-b-2 ${activeTab === 'routes'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent'
            }`}
        >
          Routes
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 min-w-[100px] py-4 text-center font-semibold transition-colors border-b-2 ${activeTab === 'analytics'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent'
            }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('crew')}
          className={`flex-1 min-w-[100px] py-4 text-center font-semibold transition-colors border-b-2 ${activeTab === 'crew'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent'
            }`}
        >
          Registration
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Buses Tab */}
        {!isLoading && activeTab === 'buses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Live Bus Tracking</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center transition-colors">
                <Plus className="w-5 h-5 mr-2" />
                Add Bus
              </button>
            </div>

            <div className="space-y-3">
              {buses.length === 0 && <p className="text-center text-gray-500 py-10">No live buses detected.</p>}
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className="bg-white rounded-2xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
                  onClick={() => setSelectedBus(bus)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-3 bg-blue-50">
                        <Bus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{bus.id}</div>
                        <div className="text-sm text-gray-600">Route ID: {bus.routeId}</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      LIVE
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-600">Location</div>
                      <div className="font-semibold text-sm truncate">{bus.lat.toFixed(4)}, {bus.lng.toFixed(4)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-600">Occupancy</div>
                      <div className="font-semibold text-sm flex items-center">
                        <Users className="w-4 h-4 mr-1 text-blue-600" />
                        {bus.passengers || 0}/{bus.capacity || 60}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-bold transition-colors">
                      Details
                    </button>
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                      Live View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {!isLoading && activeTab === 'routes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Manage Colombo Routes</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center transition-colors">
                <Plus className="w-5 h-5 mr-2" />
                New Route
              </button>
            </div>

            <div className="space-y-3">
              {routes.map((route) => (
                <div key={route.id} className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: (route.color || '#3b82f6') + '20' }}>
                        <span className="font-bold text-sm" style={{ color: route.color || '#3b82f6' }}>{route.route_number}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{route.route_name}</h3>
                        <p className="text-xs text-gray-500">{route.start_point} ↔ {route.end_point}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
                        <Edit className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="text-[10px] text-blue-600 uppercase font-bold mb-1">Duration</div>
                      <div className="font-bold text-blue-900">{route.avg_time_minutes} min</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="text-[10px] text-green-600 uppercase font-bold mb-1">Interval</div>
                      <div className="font-bold text-green-900">{route.frequency_minutes} min</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Analytics & Insights</h2>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{mockAnalytics.totalTrips}</div>
                <div className="text-sm text-gray-600">Total Trips Today</div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">{mockAnalytics.totalPassengers}</div>
                <div className="text-sm text-gray-600">Total Passengers</div>
              </div>
            </div>

            {/* Rating and peak time */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Service Quality</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Average Rating</div>
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-yellow-500 mr-2">{mockAnalytics.avgRating}</div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-5 h-5 ${i < Math.floor(mockAnalytics.avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peak hours */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Peak Travel Times</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-600 mr-3" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Morning Peak</div>
                    <div className="text-sm text-gray-600">{mockAnalytics.peakHour}</div>
                  </div>
                  <div className="font-bold text-orange-600">High</div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Evening Peak</div>
                    <div className="text-sm text-gray-600">5:00 PM - 7:00 PM</div>
                  </div>
                  <div className="font-bold text-yellow-600">Medium</div>
                </div>
              </div>
            </div>

            {/* Route usage chart (mock) */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Route Usage</h3>
              <div className="space-y-3">
                {routes.map((route: any, i: number) => {
                  const usage = [85, 72, 68, 45, 55, 40][i % 6];
                  return (
                    <div key={route.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{route.route_name}</span>
                        <span className="text-sm font-bold text-blue-600">{usage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${usage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* Crew Tab */}
        {activeTab === 'crew' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Pending Crew Access</h2>
            {pendingCrew.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending crew requests found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCrew.map((crew) => (
                  <div key={crew.id} className="bg-white rounded-2xl shadow-md p-5 border-l-4 border-orange-500">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{crew.full_name}</h3>
                        <p className="text-sm text-gray-600">{crew.email}</p>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                          <div>NIC: {crew.nic}</div>
                          <div>Requested: {crew.created_at}</div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`Approve ${crew.full_name} as crew member?`)) {
                            try {
                              const response = await adminApi.approveCrew(crew.id);
                              if (response.success) {
                                setPendingCrew(prev => prev.filter(p => p.id !== crew.id));
                              } else {
                                alert(response.message || 'Failed to approve');
                              }
                            } catch (err) {
                              alert('Connection error');
                            }
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center transition-colors"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
