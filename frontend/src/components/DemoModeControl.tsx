import React, { useState } from 'react';

// Demo scenarios with realistic Colombo coordinates
export const DEMO_SCENARIOS = {
    SHORT_COMMUTE: {
        name: "🏃 Short Commute (Can Catch Bus)",
        origin: { lat: 6.9271, lng: 79.8612 }, // Near Fort
        destination: { lat: 6.9320, lng: 79.8680 }, // Short walk
    },
    LONG_JOURNEY: {
        name: "🚌 Long Journey (Multiple Stops)",
        origin: { lat: 6.9271, lng: 79.8612 },
        destination: { lat: 6.9147, lng: 79.9729 }, // Towards Kaduwela
    },
    TIGHT_TIMING: {
        name: "⏰ Tight Timing (Might Miss Bus)",
        origin: { lat: 6.9271, lng: 79.8612 },
        destination: { lat: 6.9350, lng: 79.8720 },
    },
    PEAK_TRAFFIC: {
        name: "🚦 Peak Hour Traffic",
        origin: { lat: 6.9271, lng: 79.8612 },
        destination: { lat: 6.9400, lng: 79.8800 },
    }
};

interface DemoModeControlProps {
    onScenarioSelect: (scenario: keyof typeof DEMO_SCENARIOS) => void;
    onSpeedChange: (speed: number) => void;
    onSimulationStart: () => void;
    isSimulating: boolean;
    demoModeEnabled: boolean;
    setDemoMode: (enabled: boolean) => void;
}

const DemoModeControl: React.FC<DemoModeControlProps> = ({
    onScenarioSelect,
    onSpeedChange,
    onSimulationStart,
    isSimulating,
    demoModeEnabled,
    setDemoMode
}) => {
    const [selectedScenario, setSelectedScenario] = useState<string>('SHORT_COMMUTE');
    const [speed, setSpeed] = useState<number>(1);

    const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const key = e.target.value;
        setSelectedScenario(key);
        onScenarioSelect(key as keyof typeof DEMO_SCENARIOS);
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = parseInt(e.target.value);
        setSpeed(val);
        onSpeedChange(val);
    };

    if (!demoModeEnabled) {
        return (
            <div className="fixed bottom-4 left-4 z-[99999]">
                <button
                    onClick={() => setDemoMode(true)}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                    🎬 Enable Demo Mode
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-[99999] bg-white p-4 rounded-xl shadow-2xl border border-gray-200 w-80 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span>🎬 Presentation Demo</span>
                </h3>
                <button
                    onClick={() => setDemoMode(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                {/* Scenario Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Scenario</label>
                    <select
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                        value={selectedScenario}
                        onChange={handleScenarioChange}
                        disabled={isSimulating}
                    >
                        {Object.entries(DEMO_SCENARIOS).map(([key, scenario]) => (
                            <option key={key} value={key}>{scenario.name}</option>
                        ))}
                    </select>
                </div>

                {/* Speed Control */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Simulation Speed</label>
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        {[1, 2, 5, 10].map((val) => (
                            <button
                                key={val}
                                onClick={() => { setSpeed(val); onSpeedChange(val); }}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${speed === val
                                    ? 'bg-white shadow text-blue-600 font-bold'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {val}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={onSimulationStart}
                    disabled={isSimulating}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm shadow-md transition-all transform active:scale-95 ${isSimulating
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                        }`}
                >
                    {isSimulating ? '🏃 Simulating Movement...' : '▶ Start Walking Simulation'}
                </button>

                {isSimulating && (
                    <div className="text-center text-xs text-green-600 font-medium animate-pulse">
                        Live GPS Updates Active
                    </div>
                )}
            </div>
        </div>
    );
};

export default DemoModeControl;
