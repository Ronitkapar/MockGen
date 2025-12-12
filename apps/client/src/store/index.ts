import { configureStore } from '@reduxjs/toolkit';
import terminalReducer from './terminalSlice';

export const store = configureStore({
    reducer: {
        terminal: terminalReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
