import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';

interface WebContainerContextType {
    webContainer: WebContainer | null;
    isLoading: boolean;
    error: string | null;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

export const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Singleton Reference: Do not put WebContainer in Redux/State (it's not serializable)
    const webContainerInstance = useRef<WebContainer | null>(null);

    useEffect(() => {
        const bootWebContainer = async () => {
            // Prevent double booting in React Strict Mode
            if (webContainerInstance.current) return;

            try {
                console.log('Booting WebContainer...');
                webContainerInstance.current = await WebContainer.boot();
                setIsLoading(false);
                console.log('WebContainer Booted Successfully');
            } catch (err) {
                console.error('Failed to boot WebContainer:', err);
                // Check for the specific security header error
                if (err instanceof Error && err.message.includes('SharedArrayBuffer')) {
                    setError('Security Headers Missing: Cross-Origin-Embedder-Policy is required.');
                } else {
                    setError('Failed to initialize the runtime environment.');
                }
                setIsLoading(false);
            }
        };

        bootWebContainer();
    }, []);

    return (
        <WebContainerContext.Provider
            value={{
                webContainer: webContainerInstance.current,
                isLoading,
                error,
            }}
        >
            {children}
        </WebContainerContext.Provider>
    );
};

export const useWebContainer = () => {
    const context = useContext(WebContainerContext);
    if (!context) {
        throw new Error('useWebContainer must be used within a WebContainerProvider');
    }
    return context;
};
