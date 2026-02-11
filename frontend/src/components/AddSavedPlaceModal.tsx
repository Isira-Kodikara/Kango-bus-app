import { useState, useRef, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, MapPin, Loader2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { userApi } from '../lib/api';

// Colombo center
const COLOMBO_CENTER: [number, number] = [6.9271, 79.8612];

// Custom pin icon for selected location
const createPinIcon = () => L.divIcon({
    className: 'custom-pin-marker',
    html: `
        <div style="
            position: relative;
            width: 32px;
            height: 42px;
        ">
            <div style="
                background-color: #ef4444;
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                border: 3px solid white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.35);
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
            <div style="
                width: 8px;
                height: 8px;
                background: rgba(0,0,0,0.2);
                border-radius: 50%;
                position: absolute;
                bottom: 0;
                left: 12px;
            "></div>
        </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
});

interface AddSavedPlaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPlaceAdded: () => void;
}

// Reverse geocode: lat/lng -> address via Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

// Forward geocode: address -> lat/lng via Nominatim
async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; display: string } | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=lk`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                display: data[0].display_name,
            };
        }
        return null;
    } catch {
        return null;
    }
}

// Sub-component: handle map click events
function ModalMapEvents({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

// Sub-component: fly map to a specific location
function MapFlyTo({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16, { duration: 1.2 });
        }
    }, [center, map]);
    return null;
}

export function AddSavedPlaceModal({ isOpen, onClose, onPlaceAdded }: AddSavedPlaceModalProps) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [searching, setSearching] = useState(false);
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setAddress('');
            setLocation(null);
            setFlyTarget(null);
            setGeocoding(false);
            setSearching(false);
        }
    }, [isOpen]);

    const handleMapClick = useCallback(async (latlng: [number, number]) => {
        setLocation(latlng);
        setGeocoding(true);
        toast.success('Location pinned on map');

        const addr = await reverseGeocode(latlng[0], latlng[1]);
        setAddress(addr);
        setGeocoding(false);
    }, []);

    const handleAddressSearch = useCallback(async () => {
        if (!address.trim()) {
            toast.error('Please enter an address to search');
            return;
        }

        setSearching(true);
        const result = await forwardGeocode(address.trim());
        setSearching(false);

        if (result) {
            const newLocation: [number, number] = [result.lat, result.lng];
            setLocation(newLocation);
            setAddress(result.display);
            setFlyTarget(newLocation);
            toast.success('Location found!');
        } else {
            toast.error('Address not found. Try a more specific search.');
        }
    }, [address]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Please enter a name for this place');
            return;
        }
        if (!address.trim()) {
            toast.error('Please enter an address or select on the map');
            return;
        }

        setLoading(true);
        try {
            const response = await userApi.addSavedPlace({
                name: name.trim(),
                address: address.trim(),
                latitude: location ? location[0] : undefined,
                longitude: location ? location[1] : undefined,
                icon: 'map-pin'
            });

            if (response.success) {
                toast.success('Place saved successfully!');
                onPlaceAdded();
                onClose();
            } else {
                toast.error(response.message || 'Failed to save place');
            }
        } catch (error) {
            toast.error('An error occurred while saving');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[9999] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl shadow-xl w-[92vw] max-w-2xl max-h-[90vh] overflow-hidden z-[10000] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            <h2 className="text-lg font-semibold">Add New Place</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Form Side */}
                        <div className="p-5 md:w-1/2 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Place Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Home, Office, Gym"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        autoFocus
                                    />
                                </div>

                                {/* Address Field with Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <div className="relative flex gap-2">
                                        <div className="relative flex-1">
                                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddressSearch();
                                                    }
                                                }}
                                                placeholder="Type address or click map"
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddressSearch}
                                            disabled={searching || !address.trim()}
                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shrink-0"
                                            title="Search address"
                                        >
                                            {searching ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Search className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        {geocoding ? (
                                            <span className="flex items-center gap-1 text-blue-600">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Looking up address...
                                            </span>
                                        ) : (
                                            'Search an address or tap the map to pin a location'
                                        )}
                                    </p>
                                </div>

                                {/* Pinned Location Badge */}
                                {location && (
                                    <div className="bg-green-50 border border-green-200 px-3 py-2.5 rounded-xl text-xs text-green-700 flex items-center gap-2">
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                                            <MapPin className="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Location pinned</div>
                                            <div className="text-green-600">
                                                {location[0].toFixed(6)}, {location[1].toFixed(6)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLocation(null);
                                                setAddress('');
                                            }}
                                            className="ml-auto p-1 hover:bg-green-200 rounded-full transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {/* Save Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
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

                        {/* Map Side */}
                        <div className="md:w-1/2 h-[280px] md:h-auto border-t md:border-t-0 md:border-l relative bg-gray-100">
                            <div className="absolute inset-0" style={{ zIndex: 0 }}>
                                {isOpen && (
                                    <MapContainer
                                        center={COLOMBO_CENTER}
                                        zoom={13}
                                        className="w-full h-full"
                                        zoomControl={false}
                                        style={{ zIndex: 0 }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <ModalMapEvents onMapClick={handleMapClick} />
                                        <MapFlyTo center={flyTarget} />

                                        {/* Pin marker at selected location */}
                                        {location && (
                                            <Marker position={location} icon={createPinIcon()} />
                                        )}
                                    </MapContainer>
                                )}
                            </div>
                            {!location && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg text-xs font-medium text-gray-600 z-[400] pointer-events-none flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-blue-600" />
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
