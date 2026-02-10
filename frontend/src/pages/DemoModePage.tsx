// frontend/src/pages/DemoModePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const busIcon = L.divIcon({
    className: 'custom-bus-marker',
    html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">🚌</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const DemoModePage: React.FC = () => {
    const [demoActive, setDemoActive] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<string>('');
    const [simulationSpeed, setSimulationSpeed] = useState(2);
    const [userLocation, setUserLocation] = useState<[number, number]>([6.9271, 79.8612]);
    const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
    const [simulationStatus, setSimulationStatus] = useState('');

    const scenarios = [
        {
            id: 'short_commute',
            name: '🏃 Short Commute (Can Catch Bus)',
            origin: [6.9271, 79.8612],
            destination: [6.9320, 79.8680],
            busStart: [6.9350, 79.8750]
        },
        {
            id: 'long_journey',
            name: '🚌 Long Journey (Multiple Stops)',
            origin: [6.9271, 79.8612],
            destination: [6.9147, 79.9729],
            busStart: [6.8800, 79.8600]
        },
        {
            id: 'tight_timing',
            name: '⏰ Tight Timing (Might Miss Bus)',
            origin: [6.9271, 79.8612],
            destination: [6.9350, 79.8720],
            busStart: [6.9360, 79.8730]
        }
    ];

    const handleStartSimulation = () => {
        if (!selectedScenario) {
            alert('Please select a scenario first');
            return;
        }

        const scenario = scenarios.find(s => s.id === selectedScenario);
        if (!scenario) return;

        setSimulationStatus('🚀 Simulation starting...');
        setUserLocation(scenario.origin as [number, number]);
        setBusLocation(scenario.busStart as [number, number]);

        // Simple linear simulation for demo purposes
        let step = 0;
        const maxSteps = 100;
        const interval = setInterval(() => {
            step++;
            if (step > maxSteps || !demoActive) {
                clearInterval(interval);
                setSimulationStatus('✅ Simulation completed');
                return;
            }

            // Move user towards boarding stop (destination in this simple demo)
            const userLat = scenario.origin[0] + (scenario.destination[0] - scenario.origin[0]) * (step / maxSteps);
            const userLng = scenario.origin[1] + (scenario.destination[1] - scenario.origin[1]) * (step / maxSteps);
            setUserLocation([userLat, userLng]);

            // Move bus towards boarding stop
            const busLat = scenario.busStart[0] + (scenario.destination[0] - scenario.busStart[0]) * (step / (maxSteps / 2));
            const busLng = scenario.busStart[1] + (scenario.destination[1] - scenario.busStart[1]) * (step / (maxSteps / 2));

            if (step < maxSteps / 2) {
                setBusLocation([busLat, busLng]);
            } else {
                setBusLocation(scenario.destination as [number, number]);
            }

            setSimulationStatus(`🏃 Simulating... Step ${step}/${maxSteps}`);
        }, 1000 / simulationSpeed);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-blue-600">KANGO</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Demo & Testing Mode</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${demoActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        {demoActive ? '● Live Simulation' : '○ Standby'}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Controls Sidebar */}
                <div className="w-full md:w-[400px] bg-white border-r overflow-y-auto p-6 space-y-6 shadow-xl z-10">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                        <p className="text-amber-800 text-xs font-medium leading-relaxed">
                            ⚠️ <strong>Internal Tool Only</strong>. This page simulates GPS movement for competition presentation and edge-case testing.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">🎬 Demo Controls</h2>

                        <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={demoActive}
                                onChange={(e) => setDemoActive(e.target.checked)}
                            />
                            <span className="text-sm font-semibold text-gray-700">Enable Demo Overrides</span>
                        </label>

                        {demoActive && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Scenario Selection</label>
                                    <select
                                        value={selectedScenario}
                                        onChange={(e) => setSelectedScenario(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                                    >
                                        <option value="">Choose a scenario...</option>
                                        {scenarios.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Simulation Speed: <span className="text-blue-600">{simulationSpeed}x</span></label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={simulationSpeed}
                                        onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                                        <span>Realtime</span>
                                        <span>Fast Forward</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartSimulation}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                                >
                                    START SIMULATION
                                </button>

                                {simulationStatus && (
                                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono text-center border border-blue-100">
                                        {simulationStatus}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {selectedScenario && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-in fade-in duration-500">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3">Scenario Details</h3>
                            {scenarios.find(s => s.id === selectedScenario)?.id === 'short_commute' && (
                                <div className="space-y-2 text-xs text-gray-600">
                                    <p>• User starts 500m from stop</p>
                                    <p>• Bus is 2km away</p>
                                    <p>• <strong>Goal</strong>: Success (Boarding)</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Map Section */}
                <div className="flex-1 relative">
                    <MapContainer
                        center={[6.9271, 79.8612]}
                        zoom={14}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ZoomControl position="bottomright" />

                        <Marker position={userLocation} icon={userIcon}>
                            <Popup className="custom-popup"><strong>User Location</strong> (Simulated)</Popup>
                        </Marker>

                        {busLocation && (
                            <Marker position={busLocation} icon={busIcon}>
                                <Popup><strong>Bus Location</strong> (Simulated)</Popup>
                            </Marker>
                        )}

                        {selectedScenario && (
                            <Polyline
                                positions={[
                                    scenarios.find(s => s.id === selectedScenario)!.origin as [number, number],
                                    scenarios.find(s => s.id === selectedScenario)!.destination as [number, number]
                                ]}
                                color="#3b82f6"
                                dashArray="10, 10"
                                opacity={0.5}
                            />
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default DemoModePage;
