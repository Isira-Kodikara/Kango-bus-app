
import React from 'react';
import { Play, Pause, FastForward, MapPin, Navigation } from 'lucide-react';

interface Scenario {
    id: string;
    name: string;
    description: string;
    origin: [number, number];
    destination: [number, number];
}

export const DEMO_SCENARIOS: Scenario[] = [
    {
        id: 'short-commute',
        name: '🏃 Short Commute (Can Catch)',
        description: 'User is close to the stop and bus is 5 mins away.',
        origin: [6.9271, 79.8612], // Colombo Fort area
        destination: [6.9320, 79.8680] // Pettah
    },
    {
        id: 'long-journey',
        name: '🚌 Long Journey',
        description: 'Requires a longer walk and bus ride.',
        origin: [6.9271, 79.8612],
        destination: [6.9147, 79.9729] // Battaramulla direction
    },
    {
        id: 'tight-timing',
        name: '⏰ Tight Timing',
        description: 'User might miss the bus unless they run.',
        origin: [6.9271, 79.8612],
        destination: [6.9350, 79.8720]
    }
];

interface DemoModeControlProps {
    isDemoMode: boolean;
    onToggleDemo: (enabled: boolean) => void;
    onSelectScenario: (scenario: Scenario) => void;
    onStartSimulation: () => void;
    onStopSimulation: () => void;
    isSimulating: boolean;
    speedMultiplier: number;
    onSpeedChange: (speed: number) => void;
    busSpeedMultiplier: number;
    onBusSpeedChange: (speed: number) => void;
}

const DemoModeControl: React.FC<DemoModeControlProps> = ({
    isDemoMode,
    onToggleDemo,
    onSelectScenario,
    onStartSimulation,
    onStopSimulation,
    isSimulating,
    speedMultiplier,
    onSpeedChange,
    busSpeedMultiplier,
    onBusSpeedChange
}) => {
    if (!isDemoMode) {
        return (
            <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-md border border-gray-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isDemoMode}
                        onChange={(e) => onToggleDemo(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="font-medium text-gray-700">🎬 Enable Demo Mode</span>
                </label>
            </div>
        );
    }

    return (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-xl border border-blue-200 w-80 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div className="flex items-center space-x-2 text-blue-700 font-bold">
                    <Navigation size={20} />
                    <span>Demo Control Panel</span>
                </div>
                <button
                    onClick={() => onToggleDemo(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                >
                    Exit Demo
                </button>
            </div>

            <div className="space-y-4">
                {/* Scenarios */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                        Select Scenario
                    </label>
                    <select
                        onChange={(e) => {
                            const scenario = DEMO_SCENARIOS.find(s => s.id === e.target.value);
                            if (scenario) onSelectScenario(scenario);
                        }}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">-- Choose a realistic scenario --</option>
                        {DEMO_SCENARIOS.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Speed Controls */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                        Simulation Speed
                    </label>
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-md">
                        {[1, 2, 5, 10].map(speed => (
                            <button
                                key={speed}
                                onClick={() => onSpeedChange(speed)}
                                className={`flex-1 text-xs py-1 rounded transition-colors ${speedMultiplier === speed
                                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stress Test Controls */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                        Scenario Difficulty
                    </label>
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-md">
                        <button
                            onClick={() => onBusSpeedChange(1)}
                            className={`flex-1 text-xs py-1 rounded transition-colors ${busSpeedMultiplier === 1
                                ? 'bg-green-600 text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            😊 Normal (Catch)
                        </button>
                        <button
                            onClick={() => onBusSpeedChange(1.5)}
                            className={`flex-1 text-xs py-1 rounded transition-colors ${busSpeedMultiplier > 1
                                ? 'bg-red-500 text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            😰 Late (Miss)
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                    {!isSimulating ? (
                        <button
                            onClick={onStartSimulation}
                            className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium transition-all shadow-sm active:scale-95"
                        >
                            <Play size={16} fill="currentColor" />
                            <span>Start Walking Simulation</span>
                        </button>
                    ) : (
                        <button
                            onClick={onStopSimulation}
                            className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium transition-all shadow-sm"
                        >
                            <Pause size={16} fill="currentColor" />
                            <span>Stop Simulation</span>
                        </button>
                    )}
                </div>

                <div className="text-[10px] text-gray-400 text-center pt-2 border-t">
                    Use this panel to showcase the "Can I catch the bus?" feature without physically moving.
                </div>
            </div>
        </div>
    );
};

export default DemoModeControl;
