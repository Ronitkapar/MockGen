import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export interface TerminalRef {
    write: (data: string) => void;
    clear: () => void;
}

const TerminalPanel = forwardRef<TerminalRef>((_, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        write: (data: string) => {
            xtermRef.current?.write(data);
        },
        clear: () => {
            xtermRef.current?.clear();
        }
    }));

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm
        const term = new Terminal({
            cursorBlink: true,
            convertEol: true, // Important for proper line breaks from Node output
            theme: {
                background: '#1e1e1e',
                foreground: '#f0f0f0',
            },
            fontSize: 12,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Handle window resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);

    return (
        <div
            ref={terminalRef}
            className="h-full w-full overflow-hidden bg-[#1e1e1e] rounded-lg"
        />
    );
});

TerminalPanel.displayName = 'TerminalPanel';
export default TerminalPanel;
