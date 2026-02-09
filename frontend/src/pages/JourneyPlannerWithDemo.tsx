import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DemoModeControl, { DEMO_SCENARIOS } from '../components/JourneyPlanner/DemoModeControl';
import { GPSSimulator } from '../services/GPSSimulator';

// Marker Icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png', // User avatar
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Bus icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const busStopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const destinationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to update map center
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

// Map Click Handler for Interactive Selection
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    const map = useMap();
    useEffect(() => {
        const handleClick = (e: L.LeafletMouseEvent) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        };
        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [map, onMapClick]);
    return null;
}

const JourneyPlannerWithDemo: React.FC = () => {
    // State
    const [userLocation, setUserLocation] = useState<[number, number]>([6.9271, 79.8612]); // Default Colombo
    const [destination, setDestination] = useState<[number, number] | null>(null);
    const [journeyPlan, setJourneyPlan] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [demoModeEnabled, setDemoModeEnabled] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(2);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | null>(null);
    const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
    const [busSpeedMultiplier, setBusSpeedMultiplier] = useState(1); // 1 = normal, >1 = fast (miss bus)

    // Refs
    const simulatorRef = useRef<GPSSimulator | null>(null);
    const busSimulatorRef = useRef<GPSSimulator | null>(null);

    // Initialize Simulator
    useEffect(() => {
        simulatorRef.current = new GPSSimulator();
        simulatorRef.current.setPosition(userLocation[0], userLocation[1]);

        busSimulatorRef.current = new GPSSimulator();

        return () => {
            simulatorRef.current?.stop();
            busSimulatorRef.current?.stop();
        };
    }, []);

    // Handle map click to set destination
    // Note: Since we use MapContainer, clicking the map needs a specific handler component or implementation.
    // However, for this demo, destinations are preset or fixed.
    const handleMapClick = (lat: number, lng: number) => {
        if (selectionMode === 'origin') {
            setUserLocation([lat, lng]);
            simulatorRef.current?.setPosition(lat, lng);
            setSelectionMode(null);
            setStatusMessage(`📍 Origin set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else if (selectionMode === 'destination') {
            setDestination([lat, lng]);
            setSelectionMode(null);
            setStatusMessage(`🏁 Destination set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
    };

    // Auto-plan when both are set? Or wait for button?
    // Let's add a "Plan Journey" button in the UI.

    const handleScenarioSelect = (scenario: any) => {
        if (scenario) {
            // Reset state
            setJourneyPlan(null);
            setIsSimulating(false);
            simulatorRef.current?.stop();

            // Set locations
            setUserLocation([scenario.origin[0], scenario.origin[1]]);
            setDestination([scenario.destination[0], scenario.destination[1]]);
            simulatorRef.current?.setPosition(scenario.origin[0], scenario.origin[1]);

            // Auto-plan journey
            // Scenario uses [lat, lng] arrays
            fetchJourneyPlan(
                { lat: scenario.origin[0], lng: scenario.origin[1] },
                { lat: scenario.destination[0], lng: scenario.destination[1] }
            );
        }
    };

    // Mock Data for Fallback
    const MOCK_JOURNEY_PLAN = {
        boarding_stop: { latitude: 6.9344, longitude: 79.8428, stop_name: "Fort Railway Station", id: 1 },
        alighting_stop: { latitude: 6.9147, longitude: 79.8612, stop_name: "Bambalapitiya Junction", id: 5 },
        route: { route_number: "100", route_name: "Colombo - Panadura" },
        next_bus: { eta_minutes: 4 },
        can_catch_next_bus: true,
        walking_to_boarding: {
            distance_meters: 120,
            duration_seconds: 100,
            geometry_geojson: {
                coordinates: [
                    [79.8428, 6.9344], // Note: GeoJSON is [lng, lat]
                    [79.8430, 6.9340],
                    [79.8432, 6.9338]
                ]
            }
        },
        bus_travel_time_seconds: 900,
        total_journey_time_seconds: 1200
    };

    const fetchJourneyPlan = async (origin: { lat: number, lng: number }, dest: { lat: number, lng: number }) => {
        setStatusMessage('🔄 Planning journey...');
        try {
            const response = await fetch('/api/journey-planner.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin_lat: origin.lat,
                    origin_lng: origin.lng,
                    destination_lat: dest.lat,
                    destination_lng: dest.lng,
                    user_id: 1
                })
            });

            if (!response.ok) throw new Error('Journey planning failed');

            const data = await response.json();

            // Adjust for API wrapper structure if present
            if (data.success && data.journey) {
                setJourneyPlan(data.journey);
            } else {
                setJourneyPlan(data);
            }

            setStatusMessage('✅ Journey Found! Ready to start.');
        } catch (error) {
            console.error(error);
            // Fallback to Mock Data for Demo
            console.warn("Backend failed, using mock data for demo.");
            setJourneyPlan(MOCK_JOURNEY_PLAN);
            setStatusMessage('⚠️ Offline Demo Mode (Backend Unavailable)');
        }
    };

    const startSimulation = () => {
        if (!journeyPlan || !simulatorRef.current || !busSimulatorRef.current) return;

        // 1. User Path (Walking)
        const pathData = journeyPlan.walking_path || journeyPlan.walking_to_boarding;
        if (!pathData?.geometry_geojson) return;

        const walkingPath = pathData.geometry_geojson.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );

        // 2. Bus Path (Simulated: Boarding -> Alighting)
        // In a real app, we'd have the full bus route shape. 
        // For demo, we'll create a straight line with intermediate points for smoothness
        // Create an "Approaching" path for the bus
        // We start it ~200m away from the boarding stop
        const approachingBusStart: [number, number] = [
            journeyPlan.boarding_stop.latitude + 0.002,
            journeyPlan.boarding_stop.longitude + 0.002
        ];

        const busPath: [number, number][] = [
            approachingBusStart,
            [journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude],
            [journeyPlan.alighting_stop.latitude, journeyPlan.alighting_stop.longitude]
        ];

        setIsSimulating(true);
        setStatusMessage('🏃 Simulation Started! Walk to the stop!');

        // Start User (Walking)
        // ... (user simulation start code remains)
        simulatorRef.current.startPathSimulation(
            walkingPath,
            (pos) => setUserLocation(pos),
            speedMultiplier
        );

        // Reset bus to start of approaching path
        setBusLocation(approachingBusStart);

        busSimulatorRef.current.startPathSimulation(
            busPath,
            (pos) => setBusLocation(pos),
            busSpeedMultiplier * 3 // Adjusted speed for drama
        );
    };

    // Check for "Catch" or "Miss" during simulation
    useEffect(() => {
        if (isSimulating && userLocation && busLocation && journeyPlan) {
            // Distance Check
            const userDistToStop = simulatorRef.current.haversineDistance(
                userLocation[0], userLocation[1],
                journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude
            );

            const busDistToStop = simulatorRef.current.haversineDistance(
                busLocation[0], busLocation[1],
                journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude
            );

            // Logic to prevent immediate success at start:
            // 1. If we just started (indices are 0), don't check for end yet?
            // Actually let's just check if we are VERY close to the stop

            // Miss: Bus reached stop, user still far
            if (busDistToStop < 20 && userDistToStop > 70) {
                setStatusMessage('❌ You missed the bus! The bus arrived while you were still away.');
                setIsSimulating(false);
                simulatorRef.current?.stop();
                busSimulatorRef.current?.stop();
            }
            // Catch: User reached stop, then bus arrives
            else if (userDistToStop < 20) {
                if (busDistToStop < 40) {
                    setStatusMessage('🎉 SUCCESS! You reached the stop and boarded the bus!');
                    setIsSimulating(false);
                    simulatorRef.current?.stop();
                    busSimulatorRef.current?.stop();
                } else {
                    setStatusMessage('✅ You reached the stop! Waiting for the bus to arrive...');
                }
            }
        }
    }, [isSimulating, userLocation, busLocation, journeyPlan]);

    return (
        <div className="relative h-screen w-full flex flex-col md:flex-row">
            {/* Map Area */}
            <div className="flex-grow relative h-full">
                <MapContainer center={userLocation} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapUpdater center={userLocation} />
                    <MapEvents onMapClick={handleMapClick} />

                    {/* User Marker */}
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>You (User)</Popup>
                    </Marker>

                    {/* Bus Marker (Simulated) */}
                    {busLocation && (
                        <Marker position={busLocation} icon={busIcon}>
                            <Popup>Bus (Route 100)</Popup>
                        </Marker>
                    )}

                    {/* Destination Marker */}
                    {destination && (
                        <Marker position={destination} icon={destinationIcon}>
                            <Popup>Destination</Popup>
                        </Marker>
                    )}

                    {/* Journey Plan Visualization */}
                    {journeyPlan && (
                        <>
                            {/* Boarding Stop */}
                            <Marker
                                position={[journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude]}
                                icon={busStopIcon}
                            >
                                <Popup>
                                    <strong>Board: {journeyPlan.boarding_stop.stop_name}</strong><br />
                                    Bus {journeyPlan.route.route_number} arrives in {journeyPlan.next_bus?.eta_minutes || '?'} min
                                </Popup>
                            </Marker>

                            {/* Alighting Stop */}
                            <Marker
                                position={[journeyPlan.alighting_stop.latitude, journeyPlan.alighting_stop.longitude]}
                                icon={busStopIcon}
                            >
                                <Popup>Get off: {journeyPlan.alighting_stop.stop_name}</Popup>
                            </Marker>

                            {/* Walking Path (Blue Dashed) */}
                            <Polyline
                                positions={(journeyPlan.walking_path || journeyPlan.walking_to_boarding).geometry_geojson.coordinates.map((c: any) => [c[1], c[0]])}
                                color="#3b82f6"
                                dashArray="10, 10"
                                weight={4}
                            />

                            {/* Bus Route (Solid Red - Estimated straight line for demo) */}
                            <Polyline
                                positions={[
                                    [journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude],
                                    [journeyPlan.alighting_stop.latitude, journeyPlan.alighting_stop.longitude]
                                ]}
                                color="#ef4444"
                                weight={4}
                            />
                        </>
                    )}
                </MapContainer>

                {/* Status Overlay */}
                {statusMessage && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg z-[99999] font-medium text-gray-800 border border-gray-200">
                        {statusMessage}
                    </div>
                )}
            </div>

            {/* Info Panel (Overlay on mobile, sidebar on desktop) */}
            {journeyPlan && (
                <div className="absolute top-4 right-4 w-96 max-w-full bg-white rounded-xl shadow-2xl z-[99999] overflow-hidden border border-gray-100 journey-info-card m-4 md:m-0">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            🚌 Journey Plan
                        </h2>
                        <div className="text-blue-100 text-sm mt-1">
                            {journeyPlan.route.route_number} - {journeyPlan.route.route_name}
                        </div>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Status Banner */}
                        <div className={`flex items-start gap-3 p-3 rounded-lg border ${journeyPlan.can_catch_next_bus
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-orange-50 border-orange-200 text-orange-800'
                            }`}>
                            <span className="text-xl mt-0.5">
                                {journeyPlan.can_catch_next_bus ? '✅' : '⚠️'}
                            </span>
                            <div>
                                <strong className="block text-sm font-bold">
                                    {journeyPlan.can_catch_next_bus ? 'You can catch the bus!' : 'You might miss the next bus'}
                                </strong>
                                <span className="text-xs opacity-90">
                                    {journeyPlan.can_catch_next_bus
                                        ? `Bus arrives in ${journeyPlan.next_bus?.eta_minutes} mins.`
                                        : 'Consider walking faster or waiting for the next one.'}
                                </span>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative border-l-2 border-gray-200 ml-3 pl-6 space-y-6 py-2">
                            {/* Walk */}
                            <div className="relative">
                                <span className="absolute -left-[31px] bg-blue-100 text-blue-600 p-1.5 rounded-full ring-4 ring-white">
                                    🏃
                                </span>
                                <div className="text-sm font-semibold text-gray-900">Walk to {journeyPlan.boarding_stop.stop_name}</div>
                                <div className="text-xs text-gray-500">
                                    {Math.round(journeyPlan.walking_to_boarding.distance_meters)}m • {Math.round(journeyPlan.walking_to_boarding.duration_seconds / 60)} min
                                </div>
                            </div>

                            {/* Bus */}
                            <div className="relative">
                                <span className="absolute -left-[31px] bg-red-100 text-red-600 p-1.5 rounded-full ring-4 ring-white">
                                    🚌
                                </span>
                                <div className="text-sm font-semibold text-gray-900">Bus Ride</div>
                                <div className="text-xs text-gray-500">
                                    {Math.round(journeyPlan.bus_travel_time_seconds / 60)} min travel time
                                </div>
                            </div>

                            {/* Arrive */}
                            <div className="relative">
                                <span className="absolute -left-[31px] bg-green-100 text-green-600 p-1.5 rounded-full ring-4 ring-white">
                                    🏁
                                </span>
                                <div className="text-sm font-semibold text-gray-900">Arrive at {journeyPlan.alighting_stop.stop_name}</div>
                            </div>
                        </div>

                        {/* Total Time */}
                        <div className="border-t pt-4 flex justify-between items-center text-gray-800">
                            <span className="font-medium">Total Time</span>
                            <span className="text-xl font-black">
                                {Math.round(journeyPlan.total_journey_time_seconds / 60)} <span className="text-sm font-normal text-gray-500">min</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Demo Controls - Moved to LEFT bottom to avoid overlap with Info Card */}
            <div className="absolute bottom-10 left-4 z-[1000] flex flex-col gap-2 pointer-events-auto w-80">
                {/* Location Selection Panel */}
                <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 space-y-3">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-2">Manual Trip Setup</h3>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Current Location</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={`${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}
                                className="flex-grow text-xs bg-gray-50 p-2 rounded border border-gray-200"
                            />
                            <button
                                onClick={() => setSelectionMode('origin')}
                                className={`px-2 rounded text-xs transition-colors ${selectionMode === 'origin' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}
                            >
                                Tap Map
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Destination</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={destination ? `${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}` : 'Not Selected'}
                                className="flex-grow text-xs bg-gray-50 p-2 rounded border border-gray-200"
                                placeholder="Tap map to select..."
                            />
                            <button
                                onClick={() => setSelectionMode('destination')}
                                className={`px-2 rounded text-xs transition-colors ${selectionMode === 'destination' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'}`}
                            >
                                Tap Map
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (userLocation && destination) {
                                fetchJourneyPlan(
                                    { lat: userLocation[0], lng: userLocation[1] },
                                    { lat: destination[0], lng: destination[1] }
                                );
                            } else {
                                setStatusMessage('⚠️ Set Start and End points first!');
                            }
                        }}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all active:scale-95"
                    >
                        🔍 Search & Plan Journey
                    </button>
                </div>

                <DemoModeControl
                    isDemoMode={demoModeEnabled}
                    onToggleDemo={setDemoModeEnabled}
                    isSimulating={isSimulating}
                    onSelectScenario={(scenario) => handleScenarioSelect(scenario)}
                    onSpeedChange={(speed) => setSpeedMultiplier(speed)}
                    speedMultiplier={speedMultiplier}
                    onStartSimulation={startSimulation}
                    onStopSimulation={() => {
                        setIsSimulating(false);
                        simulatorRef.current?.stop();
                        busSimulatorRef.current?.stop();
                    }}
                    busSpeedMultiplier={busSpeedMultiplier}
                    onBusSpeedChange={setBusSpeedMultiplier}
                />
            </div>
        </div>
    );
};

export default JourneyPlannerWithDemo;
