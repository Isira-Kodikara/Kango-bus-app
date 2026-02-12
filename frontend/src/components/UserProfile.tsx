import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  User,
  MapPin,
  Clock,
  CreditCard,
  Settings,
  LogOut,
  Home,
  Briefcase,
  Star,
  ChevronRight,
  Plus,
  Edit2,
  Check,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { authApi, userApi, SavedPlace, User as ApiUser } from '../lib/api';

import { AddSavedPlaceModal } from './AddSavedPlaceModal';





export function UserProfile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'locations' | 'settings'>('history');
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  // Saved Places State
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'locations') {
      fetchSavedPlaces();
    }
  }, [activeTab]);

  const fetchSavedPlaces = async () => {
    setIsLoadingPlaces(true);
    try {
      const response = await userApi.getSavedPlaces();
      if (response.success && response.data) {
        setSavedPlaces(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch saved places', error);
      toast.error('Failed to load saved places');
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleDeletePlace = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this place?')) return;

    try {
      const response = await userApi.deleteSavedPlace(id);
      if (response.success) {
        toast.success('Place deleted');
        fetchSavedPlaces();
      } else {
        toast.error('Failed to delete place');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const startEditing = () => {
    setEditFullName(user?.full_name || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFullName('');
  };

  const saveFullName = async () => {
    if (!editFullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    if (editFullName === user?.full_name) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.updateProfile({ full_name: editFullName });
      if (response.success && response.data) {
        // Use login to update both user and token (since token is regenerated)
        // Check if user is returned properly
        const updatedUser = response.data.user as ApiUser; // Cast if needed or use type assertion
        login(response.data.token, updatedUser);
        toast.success('Name updated successfully');
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Failed to update name');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/user-home')}
            className="p-2 hover:bg-white/20 rounded-full mr-3"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>

        {/* User info */}
        <div className="flex items-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mr-4">
            <User className="w-10 h-10" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="bg-white/10 border border-white/30 text-white rounded px-2 py-1 text-xl font-bold focus:outline-none focus:border-white w-full max-w-[200px]"
                  placeholder="Full Name"
                  autoFocus
                />
                <button
                  onClick={saveFullName}
                  disabled={isLoading}
                  className="p-1 hover:bg-white/20 rounded-full text-green-300 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={isLoading}
                  className="p-1 hover:bg-white/20 rounded-full text-red-300 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{user?.full_name || 'Guest User'}</h2>
                <button
                  onClick={startEditing}
                  className="p-1 hover:bg-white/20 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                  title="Edit Name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

              </div>
            )}
            <p className="text-blue-100">{user?.email || 'No email registered'}</p>
            <div className="flex items-center mt-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="text-sm">4.8 Average Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm flex">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 text-center font-semibold transition-colors border-b-2 ${activeTab === 'history'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent'
            }`}
        >
          Trip History
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex-1 py-4 text-center font-semibold transition-colors border-b-2 ${activeTab === 'locations'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent'
            }`}
        >
          Saved Places
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 text-center font-semibold transition-colors border-b-2 ${activeTab === 'settings'
            ? 'text-blue-600 border-blue-600'
            : 'text-gray-500 border-transparent'
            }`}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Trip History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Trips</h3>
            <div className="text-center p-8 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No recent trips yet.</p>
              <p className="text-sm mt-1">Your trip history will appear here once you start travelling.</p>
            </div>
          </div>
        )}

        {/* Saved Locations */}
        {activeTab === 'locations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Saved Places</h3>
              <button
                className="text-blue-600 font-semibold text-sm flex items-center hover:bg-blue-50 px-2 py-1 rounded"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add New
              </button>
            </div>

            {isLoadingPlaces ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : savedPlaces.length === 0 ? (
              <div className="text-center p-8 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No saved places yet.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-blue-600 font-medium mt-2 hover:underline"
                >
                  Add your first place
                </button>
              </div>
            ) : (
              savedPlaces.map((location) => (
                <div
                  key={location.id}
                  className="bg-white rounded-2xl shadow-md p-5 flex items-center active:scale-95 transition-transform cursor-pointer group"
                  onClick={() => navigate('/user-home', {
                    state: {
                      destination: {
                        lat: location.latitude,
                        lng: location.longitude,
                        name: location.name
                      }
                    }
                  })}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{location.name}</div>
                    <div className="text-sm text-gray-600">{location.address}</div>
                  </div>
                  <button
                    onClick={(e) => handleDeletePlace(e, location.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete place"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}

            {/* Offline mode info */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mt-6">
              <div className="font-semibold text-blue-900 mb-1">Offline Mode Available</div>
              <div className="text-sm text-blue-800">
                Last known routes and cached bus schedules are available when offline
              </div>
            </div>

            <AddSavedPlaceModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onPlaceAdded={fetchSavedPlaces}
            />
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Settings</h3>

            {/* Payment Methods */}
            <div
              className="bg-white rounded-2xl shadow-md p-5 cursor-pointer active:scale-95 transition-transform"
              onClick={() => toast.info("Payment Methods integration coming soon!")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-800">Payment Methods</div>
                    <div className="text-sm text-gray-600">Manage cards & wallets</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Emergency Contacts */}
            <div
              className="bg-white rounded-2xl shadow-md p-5 cursor-pointer active:scale-95 transition-transform"
              onClick={() => toast.info("Emergency Contacts feature coming soon!")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-800">Emergency Contacts</div>
                    <div className="text-sm text-gray-600">1 contact saved</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Notifications */}
            <div
              className="bg-white rounded-2xl shadow-md p-5 cursor-pointer active:scale-95 transition-transform"
              onClick={() => toast.info("Notification settings coming soon!")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-800">Notifications</div>
                    <div className="text-sm text-gray-600">Alerts & updates</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Privacy */}
            <div
              className="bg-white rounded-2xl shadow-md p-5 cursor-pointer active:scale-95 transition-transform"
              onClick={() => toast.info("Privacy Settings coming soon!")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-800">Privacy & Data</div>
                    <div className="text-sm text-gray-600">Location, tracking</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-red-50 hover:bg-red-100 rounded-2xl shadow-md p-5 flex items-center justify-center mt-6 transition-colors"
            >
              <LogOut className="w-6 h-6 text-red-600 mr-3" />
              <span className="font-semibold text-red-600">Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
