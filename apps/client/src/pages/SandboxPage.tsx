import { useEffect, useRef, useState } from 'react';
import { useWebContainer } from '../contexts/useWebContainer';
import TerminalPanel, { TerminalRef } from '../components/TerminalPanel';
import { STARTER_TEMPLATE } from '../constants/starter-template';

export default function SandboxPage() {
    const { webContainer, isLoading, error, isSupported } = useWebContainer();
    const terminalRef = useRef<TerminalRef>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);
    const hasMounted = useRef(false);

    useEffect(() => {
        // Only proceed if WebContainer is ready and we haven't mounted the project yet
        if (!webContainer || isLoading || !isSupported || hasMounted.current) return;

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
                webContainer.on('server-ready', (_port: number, url: string) => {
                    term?.write(`\r\n✔ Server ready at ${url}\r\n`);
                    setPreviewUrl(url);
                });

            } catch (err) {
                console.error(err);
                term?.write(`\r\n\x1b[31m✖ Critical Error: ${err}\x1b[0m\r\n`);
            }
        };

        startDevEnvironment();
    }, [webContainer, isLoading, isSupported]);

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* Warning Banner for Unsupported Browsers */}
            {!isSupported && error && (
                <div className="bg-yellow-600 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-semibold">Limited Functionality Mode</p>
                            <p className="text-sm opacity-90">{error}</p>
                        </div>
                    </div>
                    <a
                        href="http://localhost:8080"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-yellow-700 px-4 py-2 rounded font-medium text-sm hover:bg-yellow-100 transition"
                    >
                        Open in Browser →
                    </a>
                </div>
            )}

            {/* Header */}
            <header className="h-14 border-b border-gray-700 flex items-center px-4 bg-gray-800">
                <h1 className="font-bold text-lg">MockGen - AI-Powered API Mocking</h1>
                {isLoading && isSupported && (
                    <span className="ml-4 text-sm text-yellow-400">Booting WebContainer...</span>
                )}
                {!isSupported && (
                    <span className="ml-4 text-sm text-yellow-400">
                        WebContainer disabled - Some features unavailable
                    </span>
                )}
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: Terminal (Bottom) & Editor (Top - Placeholder) */}
                <div className="w-1/2 flex flex-col border-r border-gray-700">
                    <div className="flex-1 bg-gray-900 p-4 border-b border-gray-700">
                        {isSupported ? (
                            <p className="text-gray-500 text-center mt-20">
                                [Monaco Editor Placeholder]
                                <br />
                                Files are mounted in memory.
                            </p>
                        ) : (
                            <div className="text-center mt-20">
                                <p className="text-gray-400 mb-4">
                                    🔧 <strong>MockGen Dashboard</strong>
                                </p>
                                <p className="text-gray-500 text-sm max-w-md mx-auto">
                                    The in-browser development environment requires WebContainers.
                                    <br /><br />
                                    To use the full IDE experience, please open this app in
                                    <strong> Chrome, Firefox, or Edge</strong> directly at:
                                </p>
                                <code className="block mt-4 bg-gray-800 text-green-400 px-4 py-2 rounded inline-block">
                                    http://localhost:8080
                                </code>
                                <p className="text-gray-600 text-xs mt-6">
                                    Basic API mocking features are still available.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Terminal Area */}
                    <div className="h-64 bg-black p-2">
                        {isSupported ? (
                            <TerminalPanel ref={terminalRef} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-600">
                                Terminal requires WebContainer support
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Preview Iframe */}
                <div className="w-1/2 bg-white relative">
                    {!isSupported ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                            <div className="text-center p-8">
                                <div className="text-6xl mb-4">🌐</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Preview Unavailable
                                </h3>
                                <p className="text-sm max-w-md">
                                    Open this app in a full browser window to use the live preview feature.
                                </p>
                            </div>
                        </div>
                    ) : !previewUrl ? (
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
