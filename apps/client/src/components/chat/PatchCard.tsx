import { useState } from 'react';
import { useEditor } from '../../context/useEditor';
import { useWebContainer } from '../../contexts/useWebContainer';

interface PatchCardProps {
    explanation: string;
    codeBlock: string;
    targetFile: string;
}

export default function PatchCard({ explanation, codeBlock, targetFile }: PatchCardProps) {
    const { applyPatch } = useEditor();
    const { webContainer } = useWebContainer();
    const [isApplied, setIsApplied] = useState(false);

    const handleApply = async () => {
        if (!webContainer) return;

        try {
            // 1. Update the Editor UI (Visual)
            applyPatch(targetFile, codeBlock);

            // 2. Update the WebContainer File System (Actual Execution)
            // We need to write to the virtual FS so the preview updates
            await webContainer.fs.writeFile(targetFile, codeBlock);

            setIsApplied(true);
        } catch (error) {
            console.error('Failed to apply patch:', error);
            alert('Failed to apply patch. See console.');
        }
    };

    return (
        <div className="mt-2 mb-4 bg-gray-800 border border-blue-500/30 rounded-lg overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-blue-900/20 p-3 border-b border-blue-500/20 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span className="text-blue-400">✨</span>
                    <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                        Suggested Fix
                    </span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{targetFile}</span>
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-sm text-gray-300 mb-3">{explanation}</p>

                {/* Code Preview (Truncated) */}
                <div className="bg-black/50 rounded p-2 mb-4 font-mono text-xs text-gray-400 overflow-hidden max-h-24 relative">
                    <pre>{codeBlock}</pre>
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Action Button */}
                <button
                    onClick={handleApply}
                    disabled={isApplied}
                    className={`w-full py-2 px-4 rounded text-sm font-medium transition-all flex items-center justify-center space-x-2 ${isApplied
                        ? 'bg-green-600/20 text-green-400 cursor-default border border-green-600/50'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/20'
                        }`}
                >
                    {isApplied ? (
                        <>
                            <span>✔</span>
                            <span>Patch Applied</span>
                        </>
                    ) : (
                        <>
                            <span>⚡</span>
                            <span>Apply Patch to Editor</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
