import React, { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { WebContainerContext } from './WebContainerContextDef';

// Check if security headers are properly set and SharedArrayBuffer is available
const checkWebContainerSupport = (): {
    supported: boolean;
    reason: string | null;
    isEmbeddedBrowser: boolean;
} => {
    // Check for embedded browsers (VS Code, etc.)
    const userAgent = navigator.userAgent.toLowerCase();
    const isEmbeddedBrowser = userAgent.includes('electron') ||
        userAgent.includes('vscode') ||
        window.parent !== window; // iframe detection

    // Check for SharedArrayBuffer support
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

    // Check for cross-origin isolation
    const isCrossOriginIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;

    if (!hasSharedArrayBuffer) {
        if (isEmbeddedBrowser) {
            return {
                supported: false,
                reason: 'WebContainers are not available in embedded browsers. Please open in Chrome, Firefox, or Edge.',
                isEmbeddedBrowser: true
            };
        }
        return {
            supported: false,
            reason: 'Your browser does not support SharedArrayBuffer.',
            isEmbeddedBrowser: false
        };
    }

    if (!isCrossOriginIsolated) {
        return {
            supported: false,
            reason: 'Security headers (COOP/COEP) are not configured. Access via http://localhost:8080',
            isEmbeddedBrowser: false
        };
    }

    return { supported: true, reason: null, isEmbeddedBrowser: false };
};

export const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    // Singleton Reference: Prevent double booting
    const bootRef = useRef(false);

    useEffect(() => {
        const bootWebContainer = async () => {
            // Prevent double booting in React Strict Mode
            if (bootRef.current) return;
            bootRef.current = true;

            // Pre-flight check for WebContainer support
            const supportCheck = checkWebContainerSupport();
            console.log('WebContainer Support Check:', supportCheck);

            if (!supportCheck.supported) {
                console.warn('WebContainers not supported:', supportCheck.reason);
                setError(supportCheck.reason);
                setIsSupported(false);
                setIsLoading(false);
                // Don't block the app - just disable WebContainer features
                return;
            }

            try {
                console.log('Booting WebContainer...');
                const instance = await WebContainer.boot();
                setWebContainer(instance);
                setIsLoading(false);
                console.log('WebContainer Booted Successfully');
            } catch (err) {
                console.error('Failed to boot WebContainer:', err);
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                setError(`Failed to initialize WebContainer: ${errorMsg}`);
                setIsSupported(false);
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
                isSupported,
            }}
        >
            {children}
        </WebContainerContext.Provider>
    );
};
