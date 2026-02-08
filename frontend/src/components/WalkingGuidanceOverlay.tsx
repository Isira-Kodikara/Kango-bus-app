import { useState, useEffect } from 'react';
import {
    Navigation,
    Clock,
    MapPin,
    ChevronDown,
    ChevronUp,
    Bus,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

interface Step {
    instruction: string;
    distance: number;
    duration: number;
    location: [number, number];
}

interface WalkingGuidanceProps {
    guidanceData: {
        walking_path: {
            distance_meters: number;
            duration_seconds: number;
            steps: Step[];
        };
        boarding_stop: {
            name: string;
            lat: number;
            lng: number;
        };
        next_bus?: {
            route_id: number;
            eta_minutes: number;
        };
        can_catch_bus?: boolean;
        current_distance_to_stop: number;
    };
    userLocation: [number, number] | null;
    onArrived: () => void;
}

export function WalkingGuidanceOverlay({ guidanceData, userLocation, onArrived }: WalkingGuidanceProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [distanceRemaining, setDistanceRemaining] = useState(guidanceData.current_distance_to_stop);

    // Update distance remaining based on props (which should update from parent)
    useEffect(() => {
        setDistanceRemaining(guidanceData.current_distance_to_stop);

        // Simple logic to advance steps: 
        // In a real app, we'd check distance to the next step's maneuver location.
        // Here we'll just show the first step or advance based on total distance progress
        const totalDist = guidanceData.walking_path.distance_meters;
        const progress = 1 - (guidanceData.current_distance_to_stop / totalDist);

        const steps = guidanceData.walking_path.steps;
        const estimatedStepIndex = Math.min(
            Math.floor(progress * steps.length),
            steps.length - 1
        );

        if (estimatedStepIndex > currentStepIndex) {
            setCurrentStepIndex(estimatedStepIndex);
        }

    }, [guidanceData.current_distance_to_stop]);

    const steps = guidanceData.walking_path.steps || [];
    const currentStep = steps[currentStepIndex] || { instruction: "Walk to the bus stop", distance: 0 };
    const nextBus = guidanceData.next_bus;

    return (
        <div className="absolute inset-x-0 bottom-0 z-[1002] pointer-events-none flex flex-col items-center justify-end pb-6 px-4">

            {/* Turn-by-Turn Panel (Collapsible) */}
            {isExpanded && (
                <div className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl mb-2 pointer-events-auto overflow-hidden animate-in slide-in-from-bottom duration-300">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                            <Navigation className="w-4 h-4 mr-2 text-blue-600" />
                            Route Steps
                        </h3>
                        <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-200 rounded-full">
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className={`flex items-start p-3 rounded-lg mb-1 ${idx === currentStepIndex ? 'bg-blue-50 border border-blue-100' : 'opacity-70'
                                    }`}
                            >
                                <div className={`mt-0.5 mr-3 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < currentStepIndex ? 'bg-green-100 text-green-700' :
                                        idx === currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {idx < currentStepIndex ? '✓' : idx + 1}
                                </div>
                                <div>
                                    <div className={`text-sm ${idx === currentStepIndex ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                        {step.instruction}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">{Math.round(step.distance)}m</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Info Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden border border-gray-100">

                {/* Header / Current Instruction */}
                <div className="bg-blue-600 p-4 text-white flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center flex-1">
                        <div className="bg-white/20 p-2 rounded-full mr-3">
                            <Navigation className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-lg leading-tight">{currentStep.instruction}</div>
                            <div className="text-blue-100 text-sm flex items-center mt-1">
                                <span>{distanceRemaining.toFixed(0)}m remaining</span>
                                <span className="mx-2">•</span>
                                <span>~{Math.ceil(distanceRemaining / 80)} min</span>
                            </div>
                        </div>
                    </div>
                    <ChevronUp className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Bus Info */}
                <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 text-orange-500 mr-2" />
                            <div>
                                <div className="text-xs text-gray-500 font-medium">WALK TO</div>
                                <div className="font-bold text-gray-800">{guidanceData.boarding_stop.name}</div>
                            </div>
                        </div>
                        {nextBus && (
                            <div className="text-right">
                                <div className="text-xs text-gray-500 font-medium">NEXT BUS</div>
                                <div className="font-bold text-gray-800 flex items-center justify-end">
                                    <Bus className="w-4 h-4 mr-1 text-blue-600" />
                                    {nextBus.eta_minutes} min
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Message */}
                    <div className={`rounded-xl p-3 flex items-start ${guidanceData.can_catch_bus ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'
                        }`}>
                        {guidanceData.can_catch_bus ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <div className={`font-semibold text-sm ${guidanceData.can_catch_bus ? 'text-green-800' : 'text-yellow-800'}`}>
                                {guidanceData.can_catch_bus ? "You can catch this bus!" : "You might miss the next bus."}
                            </div>
                            {!guidanceData.can_catch_bus && (
                                <div className="text-xs text-yellow-700 mt-0.5">
                                    Another bus will arrive shortly after.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Arrived Button (Simulation/Verification) */}
                    <button
                        onClick={onArrived}
                        className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        I'm at the stop
                    </button>
                </div>
            </div>
        </div>
    );
}
