import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DemoModeControl, { DEMO_SCENARIOS } from '../components/JourneyPlanner/DemoModeControl';
import { GPSSimulator } from '../services/GPSSimulator';
import { ENDPOINTS } from '../lib/api-config';

// Marker Icons
const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png', // User avatar
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
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
            const response = await fetch(ENDPOINTS.JOURNEY_PLANNER, {
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

    const startSimulation = async () => {
        if (!journeyPlan || !simulatorRef.current || !busSimulatorRef.current) return;

        setStatusMessage('📡 Fetching realistic road paths for bus...');

        // 1. User Path (Walking) - Already comes from backend/Mapbox
        const pathData = journeyPlan.walking_path || journeyPlan.walking_to_boarding;
        if (!pathData?.geometry_geojson) return;

        const walkingPath = pathData.geometry_geojson.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );

        // 2. Realistic Bus Path (Driving)
        const MAPBOX_TOKEN = 'pk.eyJ1IjoiaXNpcmEtayIsImEiOiJjbWxjZjM1eTYwN3NxM2VweHVpNTdwMzY4In0.zVOkPmd9goVf2ygsEqBnsA';

        try {
            // Bus Trip: Boarding Stop -> Alighting Stop
            const routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${journeyPlan.boarding_stop.longitude},${journeyPlan.boarding_stop.latitude};${journeyPlan.alighting_stop.longitude},${journeyPlan.alighting_stop.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
            const routeRes = await fetch(routeUrl);
            const routeData = await routeRes.json();
            const busDrivePath = routeData.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);

            // Approaching Path: ~500m away on road -> Boarding Stop
            const approchStartLng = journeyPlan.boarding_stop.longitude + 0.005;
            const approchStartLat = journeyPlan.boarding_stop.latitude + 0.003;
            const approachUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${approchStartLng},${approchStartLat};${journeyPlan.boarding_stop.longitude},${journeyPlan.boarding_stop.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
            const approachRes = await fetch(approachUrl);
            const approachData = await approachRes.json();
            const approachPath = approachData.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);

            // Combine for simulation
            const fullBusPath = [...approachPath, ...busDrivePath];
            setJourneyPlan((prev: any) => ({ ...prev, bus_road_geometry: busDrivePath }));

            setIsSimulating(true);
            setStatusMessage('🏃 Simulation Started! Walk to the stop!');

            // Start User (Walking)
            simulatorRef.current.startPathSimulation(
                walkingPath,
                (pos: [number, number]) => setUserLocation(pos),
                speedMultiplier
            );

            // Reset bus to start
            setBusLocation(fullBusPath[0]);

            // Start Bus (Driving)
            busSimulatorRef.current.startPathSimulation(
                fullBusPath,
                (pos: [number, number]) => setBusLocation(pos),
                busSpeedMultiplier * 3.5 // Bus is faster
            );
        } catch (err) {
            console.error("Realistic path failed", err);
            setStatusMessage('⚠️ Road fetching failed. Using fallback...');

            // Fallback to straight lines
            const fallbackBusPath: [number, number][] = [
                [journeyPlan.boarding_stop.latitude + 0.002, journeyPlan.boarding_stop.longitude + 0.002],
                [journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude],
                [journeyPlan.alighting_stop.latitude, journeyPlan.alighting_stop.longitude]
            ];
            setIsSimulating(true);
            setBusLocation(fallbackBusPath[0]);
            simulatorRef.current.startPathSimulation(walkingPath, (pos) => setUserLocation(pos), speedMultiplier);
            busSimulatorRef.current.startPathSimulation(fallbackBusPath, (pos) => setBusLocation(pos), busSpeedMultiplier * 3);
        }
    };

    // Check for "Catch" or "Miss" during simulation
    useEffect(() => {
        if (isSimulating && userLocation && busLocation && journeyPlan) {
            // Distance Check
            const userDistToStop = simulatorRef.current ? simulatorRef.current.haversineDistance(
                userLocation[0], userLocation[1],
                journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude
            ) : 0;

            const busDistToStop = simulatorRef.current ? simulatorRef.current.haversineDistance(
                busLocation[0], busLocation[1],
                journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude
            ) : 0;

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
        <div className="flex flex-col md:flex-row h-screen w-full bg-gray-100 overflow-hidden">
            {/* 1. LEFT SIDE: Map Area (Primary) */}
            <div className="flex-grow relative h-[50vh] md:h-full border-r border-gray-200 shadow-inner">
                <MapContainer
                    center={userLocation}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <ZoomControl position="bottomright" />
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

                            {/* Bus Route (Solid Red) */}
                            <Polyline
                                positions={journeyPlan.bus_road_geometry || [
                                    [journeyPlan.boarding_stop.latitude, journeyPlan.boarding_stop.longitude],
                                    [journeyPlan.alighting_stop.latitude, journeyPlan.alighting_stop.longitude]
                                ]}
                                color="#ef4444"
                                weight={5}
                                opacity={0.7}
                            />
                        </>
                    )}
                </MapContainer>
            </div>

            {/* 2. RIGHT SIDE: Controls & Info Sidebar */}
            <div className="w-full md:w-[400px] flex flex-col h-[50vh] md:h-full bg-gray-50 overflow-hidden shadow-2xl z-10">

                {/* Header with App Title */}
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-blue-600 tracking-tight">KANGO</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Journey Planner</p>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar bg-gray-50/50">

                    {/* Status Message (If any) */}
                    {statusMessage && (
                        <div className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg font-medium text-xs flex items-center gap-3 animate-in zoom-in duration-300">
                            <span className="text-lg">ℹ️</span>
                            <span>{statusMessage}</span>
                        </div>
                    )}

                    {/* Manual Trip Setup */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-bold text-gray-800 text-sm">Trip Setup</h3>
                            <button
                                onClick={() => { setDestination(null); setJourneyPlan(null); }}
                                className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase transition-colors"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Start (Origin)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}
                                        className="flex-grow text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-100 font-mono"
                                    />
                                    <button
                                        onClick={() => setSelectionMode('origin')}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectionMode === 'origin' ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Set Origin
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">End (Destination)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={destination ? `${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}` : 'Select on map...'}
                                        className="flex-grow text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-100 font-mono"
                                    />
                                    <button
                                        onClick={() => setSelectionMode('destination')}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectionMode === 'destination' ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Set End
                                    </button>
                                </div>
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
                                    setStatusMessage('Please select a destination on the map.');
                                }
                            }}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg transition-all active:scale-95 text-xs uppercase"
                        >
                            🔍 Plan Bus Journey
                        </button>
                    </div>

                    {/* Journey Results Card */}
                    {journeyPlan && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    🚌 Route {journeyPlan.route.route_number}
                                </h2>
                                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{journeyPlan.route.route_name}</p>
                            </div>

                            <div className="p-5 space-y-5 text-gray-800">
                                {/* Status Banner */}
                                <div className={`flex items-start gap-3 p-3 rounded-xl border ${journeyPlan.can_catch_next_bus
                                    ? 'bg-green-50 border-green-100 text-green-800'
                                    : 'bg-orange-50 border-orange-100 text-orange-800'
                                    }`}>
                                    <span className="text-xl mt-0.5">
                                        {journeyPlan.can_catch_next_bus ? '✅' : '⚠️'}
                                    </span>
                                    <div>
                                        <strong className="block text-xs font-bold">
                                            {journeyPlan.can_catch_next_bus ? 'On-time for boarding' : 'Risk of missing bus'}
                                        </strong>
                                        <span className="text-[10px] opacity-80">
                                            {journeyPlan.can_catch_next_bus
                                                ? `Bus arrives in ${journeyPlan.next_bus?.eta_minutes} mins.`
                                                : 'Consider a faster pace or checking later routes.'}
                                        </span>
                                    </div>
                                </div>

                                {/* Modern Timeline */}
                                <div className="space-y-6 pl-2 pr-2">
                                    <div className="relative border-l-2 border-dashed border-gray-200 ml-4 pl-8 pb-1">
                                        <span className="absolute -left-[17px] -top-1 bg-blue-100 text-blue-600 p-2 rounded-full border-4 border-white shadow-sm text-xs">
                                            🚶
                                        </span>
                                        <div className="text-xs font-bold">Walk to {journeyPlan.boarding_stop.stop_name}</div>
                                        <div className="text-[10px] text-gray-400 flex gap-2 items-center mt-1">
                                            <span>{Math.round(journeyPlan.walking_to_boarding.distance_meters)}m</span>
                                            <span className="text-gray-200">•</span>
                                            <span>~{Math.round(journeyPlan.walking_to_boarding.duration_seconds / 60)} mins</span>
                                        </div>
                                    </div>

                                    <div className="relative border-l-2 border-dashed border-gray-200 ml-4 pl-8 pb-1">
                                        <span className="absolute -left-[17px] -top-1 bg-red-100 text-red-600 p-2 rounded-full border-4 border-white shadow-sm text-xs">
                                            🚌
                                        </span>
                                        <div className="text-xs font-bold">Bus Ride (Boarding)</div>
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            Board Route {journeyPlan.route.route_number} for ~{Math.round(journeyPlan.bus_travel_time_seconds / 60)} mins
                                        </div>
                                    </div>

                                    <div className="relative ml-4 pl-8">
                                        <span className="absolute -left-[17px] -top-1 bg-green-100 text-green-600 p-2 rounded-full border-4 border-white shadow-sm text-xs">
                                            🏁
                                        </span>
                                        <div className="text-xs font-bold">Arrive at Destination</div>
                                        <div className="text-[10px] text-gray-400 mt-1">{journeyPlan.alighting_stop.stop_name}</div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Est. Total Time</span>
                                    <span className="text-lg font-black text-gray-900">
                                        {Math.round(journeyPlan.total_journey_time_seconds / 60)} <span className="text-[10px] font-medium text-gray-400 uppercase">min</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Demo Simulation Controls */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
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

                {/* Sidebar Footer */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <p className="text-[9px] text-gray-300 text-center font-medium uppercase tracking-widest">
                        © 2026 KANGO Systems • Colombo, Sri Lanka
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JourneyPlannerWithDemo;
