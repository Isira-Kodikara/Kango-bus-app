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
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'walking-marker' // Custom CSS class for pulse
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

const JourneyPlannerWithDemo: React.FC = () => {
    // State
    const [userLocation, setUserLocation] = useState<[number, number]>([6.9271, 79.8612]); // Default Colombo
    const [destination, setDestination] = useState<[number, number] | null>(null);
    const [journeyPlan, setJourneyPlan] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [demoModeEnabled, setDemoModeEnabled] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(2);
    const [statusMessage, setStatusMessage] = useState<string>('');

    // Refs
    const simulatorRef = useRef<GPSSimulator | null>(null);

    // Initialize Simulator
    useEffect(() => {
        simulatorRef.current = new GPSSimulator();
        simulatorRef.current.setPosition(userLocation[0], userLocation[1]);
        return () => {
            simulatorRef.current?.stop();
        };
    }, []);

    // Handle map click to set destination
    // Note: Since we use MapContainer, clicking the map needs a specific handler component or implementation.
    // However, for this demo, destinations are preset or fixed.
    // If user interaction is needed, we'd add useMapEvents.

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
            setJourneyPlan(data);
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
        if (!journeyPlan || !simulatorRef.current) return;

        // Extract walking path from GeoJSON
        // GeoJSON uses [lng, lat], we need [lat, lng]
        const walkingPath = journeyPlan.walking_to_boarding.geometry_geojson.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );

        setIsSimulating(true);
        setStatusMessage('🏃 Walking to bus stop...');

        simulatorRef.current.startPathSimulation(
            walkingPath,
            (pos) => {
                setUserLocation(pos);
            },
            speedMultiplier // use state
        );

        // Since simulation runs forever or until stop, we can add logic to detect arrival
        // But for visual demo, user sees marker moving.
    };

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

                    {/* User Marker */}
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                            <div className="text-center">
                                <strong>You are here</strong><br />
                                {isSimulating && <span className="text-green-600 font-bold animate-pulse">Walking...</span>}
                            </div>
                        </Popup>
                    </Marker>

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
                                positions={journeyPlan.walking_to_boarding.geometry_geojson.coordinates.map((c: any) => [c[1], c[0]])}
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

            {/* Demo Controls */}
            <DemoModeControl
                isDemoMode={demoModeEnabled}
                onToggleDemo={setDemoModeEnabled}
                isSimulating={isSimulating}
                onSelectScenario={(scenario) => handleScenarioSelect(scenario)}
                onSpeedChange={(speed) => {
                    setSpeedMultiplier(speed);
                    // If running, restart simulation with new speed? 
                    // For now, simpler to just set state, effective on next start.
                    // Or if live update needed, we'd need methods on GPSSimulator.
                    // Let's restart if simulating:
                    if (isSimulating) {
                        // Stop & Start again seamlessly?
                        // GPSSimulator doesn't support live speed change easily without restart.
                        // User can stop/start.
                    }
                }}
                speedMultiplier={speedMultiplier}
                onStartSimulation={startSimulation}
                onStopSimulation={() => {
                    setIsSimulating(false);
                    simulatorRef.current?.stop();
                }}
            />
        </div>
    );
};

export default JourneyPlannerWithDemo;
