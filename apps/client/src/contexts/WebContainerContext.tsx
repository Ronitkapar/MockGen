import React, { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { WebContainerContext } from './WebContainerContextDef';

export const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);

    // Singleton Reference: Prevent double booting
    const bootRef = useRef(false);

    useEffect(() => {
        const bootWebContainer = async () => {
            // Prevent double booting in React Strict Mode
            if (bootRef.current) return;
            bootRef.current = true;

            try {
                console.log('Booting WebContainer...');
                const instance = await WebContainer.boot();
                setWebContainer(instance);
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
                webContainer,
                isLoading,
                error,
            }}
        >
            {children}
        </WebContainerContext.Provider>
    );
};
