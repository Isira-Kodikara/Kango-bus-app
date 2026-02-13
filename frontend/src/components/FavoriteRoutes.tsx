import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Star, MapPin, Clock, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface FavoriteRoute {
  id: number;
  name: string;
  from: string;
  to: string;
  duration: string;
  savedAt: string;
}

export function FavoriteRoutes() {
  const navigate = useNavigate();
  const toast = useToast();
  const [routes, setRoutes] = useState<FavoriteRoute[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('favoriteRoutes');
    if (saved) {
      setRoutes(JSON.parse(saved));
    }
  }, []);

  const handleDeleteRoute = (id: number) => {
    const updated = routes.filter(r => r.id !== id);
    setRoutes(updated);
    localStorage.setItem('favoriteRoutes', JSON.stringify(updated));
    toast.success('Route removed from favorites');
  };

  const handleUseRoute = (route: FavoriteRoute) => {
    navigate('/user-home', { state: { favorite: route } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full mr-3"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Favorite Routes</h1>
      </div>

      <div className="flex-1 p-4">
        {routes.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">No favorite routes yet</p>
            <p className="text-sm text-gray-500 mb-6">Save routes you use frequently for quick access</p>
            <button
              onClick={() => navigate('/user-home')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Plan a Route
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={() => handleUseRoute(route)}
                className="w-full bg-white rounded-2xl p-4 border border-gray-200 hover:border-blue-400 transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start flex-1">
                    <Star className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-800">{route.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{route.savedAt}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoute(route.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="space-y-2 ml-8">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                    {route.from}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-red-600 mr-2" />
                    {route.to}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-green-600 mr-2" />
                    {route.duration}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
