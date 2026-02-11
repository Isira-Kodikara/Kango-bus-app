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
  TrendingUp, // Changed from Activity to TrendingUp for stats
  Activity,
  UserCheck,
  RefreshCw,
  Search,
  Check,
  X,
  Star // Added Star
} from 'lucide-react';
import { adminApi } from '@/lib/api';

// Analytics data should be fetched from API
const mockAnalytics = {
  totalTrips: 0,
  totalPassengers: 0,
  avgRating: 0,
  peakHour: '--'
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
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-slate-900 pb-20 md:pb-0">
      {/* Header - Clean White */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-blue-600 uppercase tracking-tighter leading-none">KANGO</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Admin Portal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-6 px-4 pb-24 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Mobile Tabs (Bottom Navigation style but at top for admin) */}
        <div className="md:hidden flex overflow-x-auto pb-4 gap-2 mb-4 scrollbar-hide">
          {[
            { id: 'buses', label: 'Fleet', icon: Bus },
            { id: 'routes', label: 'Routes', icon: MapPin },
            { id: 'analytics', label: 'Stats', icon: BarChart3 },
            { id: 'crew', label: 'Crew', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-none px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-white text-slate-500 border-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex space-x-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-200 mb-8 w-fit mx-auto">
          {[
            { id: 'buses', label: 'Live Fleet', icon: Bus },
            { id: 'routes', label: 'Route Network', icon: MapPin },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'crew', label: 'Crew Management', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:bg-gray-50'
                }`}
            >
              <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-slide-in-right">

          {/* BUSES TAB */}
          {activeTab === 'buses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Fleet Overview</h2>
                  <p className="text-slate-500 text-sm font-medium">Real-time bus tracking and status</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 group">
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Buses', value: buses.length, color: 'blue' },
                  { label: 'Active Now', value: buses.filter(b => b.status === 'active' || true).length, color: 'green' }, // Mock filter
                  { label: 'Avg Occupancy', value: '64%', color: 'orange' },
                  { label: 'Alerts', value: '2', color: 'red' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className={`text-${stat.color}-500 text-[10px] font-black uppercase tracking-widest mb-1`}>{stat.label}</div>
                    <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buses.length === 0 && !isLoading && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Bus className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Buses Online</h3>
                    <p className="text-gray-500 max-w-sm mt-1">There are currently no buses transmitting location data to the network.</p>
                  </div>
                )}

                {buses.map((bus) => (
                  <div
                    key={bus.id}
                    className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 p-5 group cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedBus(bus)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>

                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                          {bus.id.replace('BUS-', '')}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg leading-none">{bus.id}</div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Route {bus.routeId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        Live
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupancy</span>
                          <span className="text-xs font-bold text-slate-700">{bus.passengers}/{bus.capacity}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${bus.passengers / bus.capacity > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${(bus.passengers / bus.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <div className="flex-1 bg-gray-50 p-2 rounded-xl text-center">
                          <MapPin className="w-3 h-3 mx-auto mb-1 text-slate-400" />
                          <span className="font-bold text-slate-600">{bus.lat.toFixed(3)}, {bus.lng.toFixed(3)}</span>
                        </div>
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl font-bold transition-colors">
                          Track
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROUTES TAB */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Routes</h2>
                  <p className="text-slate-500 text-sm font-medium">Manage network paths and schedules</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 group">
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="space-y-3">
                {routes.map((route) => (
                  <div key={route.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-2xl shadow-sm border bg-gray-50 text-slate-800" style={{ borderColor: route.color || '#e2e8f0' }}>
                          <span className="text-[9px] uppercase text-slate-400 font-bold leading-none mb-0.5">Line</span>
                          {route.route_number}
                        </div>
                      </div>

                      <div className="flex-grow">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{route.route_name}</h3>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <span>{route.start_point}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span>{route.end_point}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
                        <div className="text-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Stops</div>
                          <div className="text-lg font-black text-slate-800">{route.total_stops || 0}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Time</div>
                          <div className="text-lg font-black text-slate-800">{route.avg_time_minutes}m</div>
                        </div>
                        <button className="p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-xl transition-all ml-2 text-slate-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">System Insights</h2>
                  <p className="text-slate-500 text-sm font-medium">Performance metrics and usage stats</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Total Trips</h3>
                      <p className="text-xs text-slate-500 font-medium">Daily system activity</p>
                    </div>
                  </div>
                  <div className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
                    {mockAnalytics.totalTrips.toLocaleString()}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                    <TrendingUp className="w-3 h-3" /> +12.4% vs last week
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Passengers</h3>
                      <p className="text-xs text-slate-500 font-medium">Total served today</p>
                    </div>
                  </div>
                  <div className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
                    {mockAnalytics.totalPassengers.toLocaleString()}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                    Peak: 07:45 AM
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-200">
                <h3 className="font-black text-slate-900 mb-4">Customer Satisfaction</h3>
                <div className="flex items-center gap-6">
                  <div className="text-6xl font-black text-blue-600 tracking-tighter">{mockAnalytics.avgRating}</div>
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-6 h-6 ${i < Math.floor(mockAnalytics.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Based on 8.4k reviews</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CREW TAB */}
          {activeTab === 'crew' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Crew Approvals</h2>
                  <p className="text-slate-500 text-sm font-medium">Pending driver & conductor registrations</p>
                </div>
              </div>

              {pendingCrew.length === 0 ? (
                <div className="bg-white rounded-[24px] border-2 border-dashed border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">All Clear</h3>
                  <p className="text-slate-500">No pending crew applications to review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCrew.map((crew) => (
                    <div key={crew.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-blue-400 transition-all border-l-4 border-l-orange-400">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 leading-none mb-2">{crew.full_name}</h3>
                          <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-500" /> {crew.email}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> NIC: {crew.nic}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                            Reject
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Approve ${crew.full_name}?`)) {
                                try {
                                  const response = await adminApi.approveCrew(crew.id);
                                  if (response.success) fetchData();
                                } catch (err) { alert('Failed'); }
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Helper icons
function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
