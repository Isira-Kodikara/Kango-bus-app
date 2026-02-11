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
  UserCheck,
  RefreshCw
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900">
      {/* Header - Premium Gradient */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 shadow-lg relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mr-3 border border-white/20">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">KANGO Admin</h1>
                <p className="text-blue-100 text-xs font-medium tracking-widest opacity-80 uppercase">Network Control Center</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/')}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick stats - Glassmorphism */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-sm">
              <div className="text-xs font-bold text-blue-100 uppercase tracking-tighter opacity-70 mb-1">Fleet</div>
              <div className="text-2xl font-black">{buses.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-sm">
              <div className="text-xs font-bold text-blue-100 uppercase tracking-tighter opacity-70 mb-1">Riders</div>
              <div className="text-2xl font-black">{(mockAnalytics.totalPassengers / 1000).toFixed(1)}k</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-sm">
              <div className="text-xs font-bold text-blue-100 uppercase tracking-tighter opacity-70 mb-1">Routes</div>
              <div className="text-2xl font-black">{routes.length || 3}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Modern Minimalist */}
      <div className="bg-white border-b border-slate-200 flex px-2 overflow-x-auto sticky top-0 z-20">
        {[
          { id: 'buses', label: 'Fleet', icon: Bus },
          { id: 'routes', label: 'Network', icon: MapPin },
          { id: 'analytics', label: 'Insights', icon: BarChart3 },
          { id: 'crew', label: 'Crew', icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center justify-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-4 relative ${activeTab === tab.id
              ? 'text-blue-600 border-blue-600 bg-blue-50/50'
              : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-400 font-bold animate-pulse">Syncing Network Data...</p>
            </div>
          )}

          {/* Buses Tab */}
          {!isLoading && activeTab === 'buses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Real-time Fleet</h2>
                  <p className="text-slate-500 text-sm font-medium">Tracking live GPS positions across Colombo</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {buses.length === 0 && (
                  <div className="col-span-full bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bus className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">No active buses on the grid.</p>
                  </div>
                )}
                {buses.map((bus) => (
                  <div
                    key={bus.id}
                    className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-200 p-6 group cursor-pointer"
                    onClick={() => setSelectedBus(bus)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <Bus className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-xl tracking-tight leading-none">{bus.id}</div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Route {bus.routeId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-green-100">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</div>
                        <div className="font-bold text-slate-700 text-sm">{bus.lat.toFixed(3)}, {bus.lng.toFixed(3)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${bus.passengers / bus.capacity > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${(bus.passengers / bus.capacity) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-black text-slate-700 text-xs">{bus.passengers}/{bus.capacity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors border border-slate-200">
                        Diagnostics
                      </button>
                      <button className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-slate-200">
                        Live Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routes Tab - Improved Visibility */}
          {!isLoading && activeTab === 'routes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Route Registry</h2>
                  <p className="text-slate-500 text-sm font-medium">Configuring service lines and frequency</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100">
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {routes.map((route) => (
                  <div key={route.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl shadow-inner border" style={{ backgroundColor: (route.color || '#3b82f6') + '15', color: route.color || '#3b82f6', borderColor: (route.color || '#3b82f6') + '30' }}>
                          <span className="text-[10px] uppercase opacity-60 leading-none">Line</span>
                          {route.route_number}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{route.route_name}</h3>
                          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            {route.start_point} <ArrowRight className="w-3 h-3" /> {route.end_point}
                          </div>
                        </div>
                      </div>
                      <button className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all">
                        <Edit className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          <Clock className="w-3 h-3 text-blue-500" /> Time
                        </div>
                        <div className="text-lg font-black text-slate-800">{route.avg_time_minutes}m</div>
                      </div>
                      <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          <Activity className="w-3 h-3 text-green-500" /> Freq
                        </div>
                        <div className="text-lg font-black text-slate-800">{route.frequency_minutes}m</div>
                      </div>
                      <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          <MapPin className="w-3 h-3 text-rose-500" /> Stops
                        </div>
                        <div className="text-lg font-black text-slate-800">{route.total_stops || '--'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics - Bold & Visual */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Performance Dashboard</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 text-white">
                      <Activity className="w-8 h-8" />
                    </div>
                    <div className="bg-white/20 text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full backdrop-blur-md border border-white/20">
                      +12.4% vs Last Week
                    </div>
                  </div>
                  <div className="text-sm font-bold text-blue-100 uppercase tracking-widest opacity-80 mb-1 relative z-10">Total Network Trips</div>
                  <div className="text-6xl font-black tracking-tighter relative z-10">{mockAnalytics.totalTrips.toLocaleString()}</div>
                </div>

                <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                      <Users className="w-8 h-8" />
                    </div>
                    <div className="bg-white/20 text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full backdrop-blur-md border border-white/20">
                      Peak Performance
                    </div>
                  </div>
                  <div className="text-sm font-bold text-indigo-100 uppercase tracking-widest opacity-80 mb-1 relative z-10">Total Passenger Traffic</div>
                  <div className="text-6xl font-black tracking-tighter relative z-10">{mockAnalytics.totalPassengers.toLocaleString()}</div>
                </div>
              </div>

              {/* Service Quality Card */}
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Customer Satisfaction</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Based on 12,000+ trip ratings</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-6xl font-black text-blue-600 tracking-tighter">{mockAnalytics.avgRating}</div>
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`w-6 h-6 ${i < Math.floor(mockAnalytics.avgRating) ? 'text-yellow-400' : 'text-slate-200'}`}>
                            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Platinum Service Level</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crew Registration */}
          {!isLoading && activeTab === 'crew' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Crew Onboarding</h2>
                  <p className="text-slate-500 text-sm font-medium">Verify bus driver and conductor accounts</p>
                </div>
              </div>

              {pendingCrew.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <UserCheck className="w-10 h-10 text-blue-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Queue is Empty</h3>
                  <p className="text-slate-400 font-medium">All crew members have been verified.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingCrew.map((crew) => (
                    <div key={crew.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-blue-500 transition-all border-l-8 border-l-orange-500">
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-900 leading-none mb-2">{crew.full_name}</h3>
                        <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-500" /> {crew.email}</span>
                          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-green-500" /> NIC: {crew.nic}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {new Date(crew.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                          Reject
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Authorize ${crew.full_name} for the KANGO network?`)) {
                              try {
                                const response = await adminApi.approveCrew(crew.id);
                                if (response.success) fetchData();
                              } catch (err) { alert('Approval failed'); }
                            }
                          }}
                          className="flex-1 md:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100"
                        >
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
    </div>
  );
}

// Helper icons
function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
