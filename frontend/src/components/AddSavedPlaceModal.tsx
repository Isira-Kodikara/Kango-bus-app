import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, MapPin, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Map } from './Map';
import { userApi } from '../lib/api';

interface AddSavedPlaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPlaceAdded: () => void;
}

export function AddSavedPlaceModal({ isOpen, onClose, onPlaceAdded }: AddSavedPlaceModalProps) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(false);

    const handleMapClick = (latlng: [number, number]) => {
        setLocation(latlng);
        toast.success('Location pinned on map');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !address) {
            toast.error('Name and Address are required');
            return;
        }

        setLoading(true);
        try {
            const response = await userApi.addSavedPlace({
                name,
                address,
                latitude: location ? location[0] : undefined,
                longitude: location ? location[1] : undefined,
                icon: 'map-pin'
            });

            if (response.success) {
                toast.success('Place saved successfully');
                onPlaceAdded();
                onClose();
                setName('');
                setAddress('');
                setLocation(null);
            } else {
                toast.error(response.message || 'Failed to save place');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[9999] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl shadow-xl w-[90vw] max-w-2xl max-h-[90vh] overflow-hidden z-[10000] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">

                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">Add New Place</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        <div className="p-6 md:w-1/2 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Home, Gym"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Enter address or click on map"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px] resize-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Click on the map to pin precise location
                                    </p>
                                </div>

                                {location && (
                                    <div className="bg-blue-50 px-3 py-2 rounded text-xs text-blue-700 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        Location pinned: {location[0].toFixed(6)}, {location[1].toFixed(6)}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : (
                                            <Save className="w-5 h-5 mr-2" />
                                        )}
                                        {loading ? 'Saving...' : 'Save Place'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="md:w-1/2 h-[300px] md:h-auto border-t md:border-t-0 md:border-l relative bg-gray-100">
                            {/* Map Container */}
                            <div className="absolute inset-0">
                                <Map
                                    className="w-full h-full"
                                    showBuses={false}
                                    showRoutes={false}
                                    showStops={true}
                                    onMapClick={handleMapClick}
                                    userLocation={location || undefined}
                                />
                            </div>
                            {!location && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-lg text-xs font-medium text-gray-600 z-[400] pointer-events-none">
                                    Tap map to set location
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
