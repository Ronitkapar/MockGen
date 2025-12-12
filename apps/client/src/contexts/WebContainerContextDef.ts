import { createContext } from 'react';
import { WebContainer } from '@webcontainer/api';

export interface WebContainerContextType {
    webContainer: WebContainer | null;
    isLoading: boolean;
    error: string | null;
    isSupported: boolean;
}

export const WebContainerContext = createContext<WebContainerContextType | null>(null);
