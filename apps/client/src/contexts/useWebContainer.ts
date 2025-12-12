import { useContext } from 'react';
import { WebContainerContext } from './WebContainerContextDef';

export const useWebContainer = () => {
    const context = useContext(WebContainerContext);
    if (!context) {
        throw new Error('useWebContainer must be used within a WebContainerProvider');
    }
    return context;
};
