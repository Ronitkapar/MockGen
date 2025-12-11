import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

export type LogType = 'stdout' | 'stderr' | 'system';

export interface LogEntry {
    id: string;
    timestamp: number;
    type: LogType;
    text: string;
}

interface TerminalState {
    logs: LogEntry[];
    isAnalyzing: boolean;
}

const initialState: TerminalState = {
    logs: [],
    isAnalyzing: false,
};

const MAX_LOG_BUFFER = 100;

export const terminalSlice = createSlice({
    name: 'terminal',
    initialState,
    reducers: {
        addLog: (state, action: PayloadAction<{ type: LogType; text: string }>) => {
            const newLog: LogEntry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: action.payload.type,
                text: action.payload.text,
            };

            state.logs.push(newLog);

            // Performance: Maintain fixed buffer size
            if (state.logs.length > MAX_LOG_BUFFER) {
                state.logs = state.logs.slice(state.logs.length - MAX_LOG_BUFFER);
            }
        },
        clearLogs: (state) => {
            state.logs = [];
        },
        setAnalyzing: (state, action: PayloadAction<boolean>) => {
            state.isAnalyzing = action.payload;
        },
    },
});

export const { addLog, clearLogs, setAnalyzing } = terminalSlice.actions;

// Selector: Formats logs into a single string for the AI
export const selectFormattedLogs = createSelector(
    (state: { terminal: TerminalState }) => state.terminal.logs,
    (logs) => {
        return logs
            .map((log) => `[${new Date(log.timestamp).toISOString()}] [${log.type.toUpperCase()}]: ${log.text}`)
            .join('');
    }
);

export default terminalSlice.reducer;
