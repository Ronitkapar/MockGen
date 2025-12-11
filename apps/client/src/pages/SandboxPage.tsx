import React, { useEffect, useRef, useState } from 'react';
import { useWebContainer } from '../contexts/WebContainerContext';
import TerminalPanel, { TerminalRef } from '../components/TerminalPanel';
import { STARTER_TEMPLATE } from '../constants/starter-template';

export default function SandboxPage() {
    const { webContainer, isLoading, error } = useWebContainer();
    const terminalRef = useRef<TerminalRef>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);
    const hasMounted = useRef(false);

    useEffect(() => {
        // Only proceed if WebContainer is ready and we haven't mounted the project yet
        if (!webContainer || isLoading || error || hasMounted.current) return;

        const startDevEnvironment = async () => {
            hasMounted.current = true;
            const term = terminalRef.current;

            try {
                term?.write('\r\n\x1b[34m> Initializing GhostStack Environment...\x1b[0m\r\n');

                // 1. Mount Files
                await webContainer.mount(STARTER_TEMPLATE);
                term?.write('✔ Files mounted\r\n');

                // 2. Install Dependencies
                term?.write('\x1b[33m> Running npm install (this may take a moment)...\x1b[0m\r\n');
                setIsInstalling(true);

                const installProcess = await webContainer.spawn('npm', ['install']);

                // Pipe output to terminal
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            term?.write(data);
                        },
                    })
                );

                const installExitCode = await installProcess.exit;

                if (installExitCode !== 0) {
                    term?.write('\r\n\x1b[31m✖ npm install failed!\x1b[0m\r\n');
                    setIsInstalling(false);
                    return;
                }

                term?.write('\r\n✔ Dependencies installed\r\n');
                setIsInstalling(false);

                // 3. Start Dev Server
                term?.write('\x1b[32m> Starting Dev Server...\x1b[0m\r\n');

                const devProcess = await webContainer.spawn('npm', ['run', 'dev']);

                devProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            term?.write(data);
                        },
                    })
                );

                // 4. Listen for Server Ready
                webContainer.on('server-ready', (port, url) => {
                    term?.write(`\r\n✔ Server ready at ${url}\r\n`);
                    setPreviewUrl(url);
                });

            } catch (err) {
                console.error(err);
                term?.write(`\r\n\x1b[31m✖ Critical Error: ${err}\x1b[0m\r\n`);
            }
        };

        startDevEnvironment();
    }, [webContainer, isLoading, error]);

    if (error) {
        return (
            <div className="p-8 text-red-500 bg-red-50 h-screen flex items-center justify-center">
                <div className="max-w-md text-center">
                    <h2 className="text-2xl font-bold mb-2">Environment Error</h2>
                    <p>{error}</p>
                    <p className="text-sm mt-4 text-gray-600">
                        Ensure you are using a browser that supports SharedArrayBuffer and that
                        security headers are configured correctly.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* Header */}
            <header className="h-14 border-b border-gray-700 flex items-center px-4 bg-gray-800">
                <h1 className="font-bold text-lg">GhostStack Sandbox</h1>
                {isLoading && <span className="ml-4 text-sm text-yellow-400">Booting WebContainer...</span>}
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: Terminal (Bottom) & Editor (Top - Placeholder) */}
                <div className="w-1/2 flex flex-col border-r border-gray-700">
                    <div className="flex-1 bg-gray-900 p-4 border-b border-gray-700">
                        <p className="text-gray-500 text-center mt-20">
                            [Monaco Editor Placeholder]
                            <br />
                            Files are mounted in memory.
                        </p>
                    </div>

                    {/* Terminal Area */}
                    <div className="h-64 bg-black p-2">
                        <TerminalPanel ref={terminalRef} />
                    </div>
                </div>

                {/* Right Panel: Preview Iframe */}
                <div className="w-1/2 bg-white relative">
                    {!previewUrl ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
                                <p>{isInstalling ? 'Installing dependencies...' : 'Waiting for server...'}</p>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={previewUrl}
                            className="w-full h-full border-none"
                            title="App Preview"
                            allow="cross-origin-isolated"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
