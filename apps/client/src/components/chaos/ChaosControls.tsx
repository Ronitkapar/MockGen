import { useState, useMemo, useRef, ChangeEvent } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import debounce from 'lodash.debounce';

// GraphQL Definitions
const GET_CHAOS_CONFIG = gql`
  query GetChaosConfig($projectId: String!) {
    chaosConfig(projectId: $projectId) {
      latencyMs
      forceError
    }
  }
`;

const UPDATE_CHAOS_CONFIG = gql`
  mutation UpdateChaosSettings($projectId: String!, $settings: UpdateChaosInput!) {
    updateChaosSettings(projectId: $projectId, settings: $settings) {
      latencyMs
      forceError
    }
  }
`;

interface ChaosControlsProps {
    projectId: string;
}

// Type definitions for GraphQL responses
interface ChaosConfig {
    latencyMs: number;
    forceError: boolean;
}

interface GetChaosConfigResponse {
    chaosConfig: ChaosConfig;
}

export default function ChaosControls({ projectId }: ChaosControlsProps) {
    // Use query data directly for initial values, with local overrides for UI responsiveness
    const { data: queryData } = useQuery<GetChaosConfigResponse>(GET_CHAOS_CONFIG, {
        variables: { projectId },
    });

    // Track if user has modified values locally
    const hasLocalChanges = useRef(false);

    // Local state for immediate UI responsiveness
    const [localLatency, setLocalLatency] = useState<number | null>(null);
    const [localForceError, setLocalForceError] = useState<boolean | null>(null);
    const [isSaved, setIsSaved] = useState(true);

    // Derive effective values: use local state if user has made changes, otherwise use query data
    const latency = localLatency ?? queryData?.chaosConfig?.latencyMs ?? 0;
    const forceError = localForceError ?? queryData?.chaosConfig?.forceError ?? false;

    const [updateChaos] = useMutation(UPDATE_CHAOS_CONFIG, {
        onCompleted: () => {
            setIsSaved(true);
            hasLocalChanges.current = false;
        },
    });

    // Debounced Save Function
    // We create this once using useMemo so the debounce timer persists
    const debouncedSave = useMemo(
        () => debounce((newLatency: number, newError: boolean) => {
            updateChaos({
                variables: {
                    projectId,
                    settings: { latencyMs: newLatency, forceError: newError },
                },
            });
        }, 500),
        [projectId, updateChaos]
    );

    // Handlers
    const handleLatencyChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        hasLocalChanges.current = true;
        setLocalLatency(val);
        setIsSaved(false);
        debouncedSave(val, forceError);
    };

    const handleToggleError = () => {
        const newVal = !forceError;
        hasLocalChanges.current = true;
        setLocalForceError(newVal);
        setIsSaved(false);
        // No debounce needed for toggle, immediate effect is better
        updateChaos({
            variables: {
                projectId,
                settings: { latencyMs: latency, forceError: newVal },
            },
        });
    };

    const handleReset = () => {
        hasLocalChanges.current = true;
        setLocalLatency(0);
        setLocalForceError(false);
        setIsSaved(false);
        updateChaos({
            variables: {
                projectId,
                settings: { latencyMs: 0, forceError: false },
            },
        });
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <span className="text-red-500">⚡</span> Chaos Engineering
                </h3>
                <span className={`text-xs ${isSaved ? 'text-green-500' : 'text-yellow-500'}`}>
                    {isSaved ? 'Saved' : 'Syncing...'}
                </span>
            </div>

            <div className="space-y-6">
                {/* Latency Slider */}
                <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Network Latency</span>
                        <span className="font-mono text-blue-400">{latency}ms</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="5000"
                        step="100"
                        value={latency}
                        onChange={handleLatencyChange}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                        <span>0ms (Fast)</span>
                        <span>5000ms (Timeout)</span>
                    </div>
                </div>

                {/* Error Toggle */}
                <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-200 font-medium">Simulate Outage</span>
                        <span className="text-xs text-gray-500">Force 500 Internal Server Error</span>
                    </div>

                    <button
                        onClick={handleToggleError}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${forceError ? 'bg-red-600' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${forceError ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    className="w-full py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors border border-dashed border-gray-600"
                >
                    Reset to Normal Conditions
                </button>
            </div>
        </div>
    );
}
