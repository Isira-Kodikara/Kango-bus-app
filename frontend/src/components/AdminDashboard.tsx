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
// Analytics state structure
interface AnalyticsData {
  totalTrips: number;
  totalPassengers: number;
  avgRating: number;
  peakHour: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'buses' | 'routes' | 'analytics' | 'crew'>('buses');
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [pendingCrew, setPendingCrew] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTrips: 0,
    totalPassengers: 0,
    avgRating: 0,
    peakHour: '--'
  });
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
      } else if (activeTab === 'analytics') {
        const res = await adminApi.getAnalytics();
        if (res.success && res.data) setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [busFormData, setBusFormData] = useState({
    id: 0,
    plate_number: '',
    route_id: '',
    capacity: 60,
    status: 'active'
  });

  const handleOpenAddBus = () => {
    setIsEditMode(false);
    setBusFormData({ id: 0, plate_number: '', route_id: '', capacity: 60, status: 'active' });
    setIsBusModalOpen(true);
  };

  const handleOpenEditBus = (bus: any) => {
    setIsEditMode(true);
    setBusFormData({
      id: bus.id,
      plate_number: bus.plate_number,
      route_id: bus.route_id || '',
      capacity: bus.capacity,
      status: bus.status
    });
    setIsBusModalOpen(true);
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await adminApi.updateBus(busFormData);
      } else {
        await adminApi.createBus(busFormData);
      }
      setIsBusModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to save bus');
    }
  };

  const handleDeleteBus = async (id: number) => {
    if (confirm('Are you sure you want to delete this bus?')) {
      try {
        await adminApi.deleteBus(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete bus');
      }
    }
  };
  /* Route State */
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeFormData, setRouteFormData] = useState({
    id: 0,
    route_number: '',
    route_name: '',
    start_point: '',
    end_point: '',
    avg_time_minutes: 60,
    color: '#3b82f6',
    status: 'active'
  });

  const handleOpenAddRoute = () => {
    setIsEditMode(false);
    setRouteFormData({
      id: 0,
      route_number: '',
      route_name: '',
      start_point: '',
      end_point: '',
      avg_time_minutes: 60,
      color: '#3b82f6',
      status: 'active'
    });
    setIsRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route: any) => {
    setIsEditMode(true);
    setRouteFormData({
      id: route.id,
      route_number: route.route_number,
      route_name: route.route_name,
      start_point: route.start_point,
      end_point: route.end_point,
      avg_time_minutes: route.avg_time_minutes,
      color: route.color || '#3b82f6',
      status: route.status || 'active'
    });
    setIsRouteModalOpen(true);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await adminApi.updateRoute(routeFormData);
      } else {
        await adminApi.createRoute(routeFormData);
      }
      setIsRouteModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to save route');
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (confirm('Are you sure you want to delete this route? This may affect buses assigned to it.')) {
      try {
        await adminApi.deleteRoute(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete route');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 pb-20 md:pb-0">
      {/* Header - Purple */}
      <div className="bg-[#9333ea] text-white pt-6 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white leading-none">Admin Portal</h1>
                <p className="text-xs font-medium text-white/80">System Management</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-4xl font-black text-white mb-1">{buses.filter(b => b.status === 'active').length}</div>
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider">Active Buses</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-4xl font-black text-white mb-1">{analytics.totalPassengers}</div>
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Passengers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-4xl font-black text-white mb-1">{routes.length}</div>
              <div className="text-xs font-bold text-white/70 uppercase tracking-wider">Active Routes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 -mt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">

        {/* Tabs */}
        <div className="bg-white rounded-t-3xl shadow-sm border-b border-gray-100 mb-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'buses', label: 'Buses' },
              { id: 'routes', label: 'Routes' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'crew', label: 'Crew' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[100px] py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id
                  ? 'text-[#9333ea] border-[#9333ea]'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-slide-in-right">

          {activeTab === 'buses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Live Bus Tracking</h2>
                <button
                  onClick={handleOpenAddBus}
                  className="bg-[#9333ea] hover:bg-[#7e22ce] text-white px-4 py-2 rounded-full font-bold transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Bus
                </button>
              </div>

              <div className="space-y-4">
                {buses.length === 0 && !isLoading && (
                  <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <Bus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Buses Online</h3>
                    <p className="text-slate-500 max-w-sm mt-1">There are currently no buses transmitting location data.</p>
                  </div>
                )}

                {buses.map((bus) => (
                  <div
                    key={bus.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <Bus className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-black text-lg text-slate-900">{bus.plate_number || bus.id}</div>
                          <div className="text-sm font-bold text-slate-500">{bus.route_name || 'Unassigned'}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5 max-w-[200px] truncate">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {bus.current_location || 'Depot'}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${bus.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {bus.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Driver</div>
                        <div className="font-bold text-slate-900">{bus.driver_name || 'Not assigned'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passengers</div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-slate-900">{bus.passengers || 0}/{bus.capacity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleOpenEditBus(bus)}
                        className="flex-1 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBus(bus.id)}
                        className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
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
                <button
                  onClick={handleOpenAddRoute}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 group"
                >
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
                        <button
                          onClick={() => handleOpenEditRoute(route)}
                          className="p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-300 rounded-xl transition-all ml-2 text-slate-400 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(route.id)}
                          className="p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-red-300 rounded-xl transition-all ml-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
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
                    {analytics.totalTrips.toLocaleString()}
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
                    {analytics.totalPassengers.toLocaleString()}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                    Peak: 07:45 AM
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-200">
                <h3 className="font-black text-slate-900 mb-4">Customer Satisfaction</h3>
                <div className="flex items-center gap-6">
                  <div className="text-6xl font-black text-blue-600 tracking-tighter">{analytics.avgRating}</div>
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-6 h-6 ${i < Math.floor(analytics.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
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

      {/* Bus Modal */}
      {isBusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">{isEditMode ? 'Edit Bus' : 'Add New Bus'}</h3>
              <button onClick={() => setIsBusModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Plate Number</label>
                <input
                  type="text"
                  required
                  value={busFormData.plate_number}
                  onChange={(e) => setBusFormData({ ...busFormData, plate_number: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                  placeholder="NB-1234"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Route</label>
                <select
                  value={busFormData.route_id}
                  onChange={(e) => setBusFormData({ ...busFormData, route_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                >
                  <option value="">Select Route (Optional)</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>Route {r.route_number} - {r.route_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={busFormData.capacity}
                    onChange={(e) => setBusFormData({ ...busFormData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status</label>
                  <select
                    value={busFormData.status}
                    onChange={(e) => setBusFormData({ ...busFormData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBusModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-200"
                >
                  {isEditMode ? 'Save Changes' : 'Create Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">{isEditMode ? 'Edit Route' : 'Add New Route'}</h3>
              <button onClick={() => setIsRouteModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Route No.</label>
                  <input
                    type="text"
                    required
                    value={routeFormData.route_number}
                    onChange={(e) => setRouteFormData({ ...routeFormData, route_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                    placeholder="138"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Avg Time (min)</label>
                  <input
                    type="number"
                    required
                    value={routeFormData.avg_time_minutes}
                    onChange={(e) => setRouteFormData({ ...routeFormData, avg_time_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Route Name (opt)</label>
                <input
                  type="text"
                  value={routeFormData.route_name}
                  onChange={(e) => setRouteFormData({ ...routeFormData, route_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                  placeholder="Colombo - Homagama"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Start Point</label>
                  <input
                    type="text"
                    required
                    value={routeFormData.start_point}
                    onChange={(e) => setRouteFormData({ ...routeFormData, start_point: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                    placeholder="Pettah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">End Point</label>
                  <input
                    type="text"
                    required
                    value={routeFormData.end_point}
                    onChange={(e) => setRouteFormData({ ...routeFormData, end_point: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                    placeholder="Homagama"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Color Code</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={routeFormData.color}
                    onChange={(e) => setRouteFormData({ ...routeFormData, color: e.target.value })}
                    className="h-12 w-12 rounded-xl border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={routeFormData.color}
                    onChange={(e) => setRouteFormData({ ...routeFormData, color: e.target.value })}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9333ea]/20 focus:border-[#9333ea]"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-200"
                >
                  {isEditMode ? 'Save Changes' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
