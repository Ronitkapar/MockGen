import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { selectFormattedLogs, setAnalyzing } from '../store/terminalSlice';
import { RootState } from '../store'; // Assuming store setup exists

// GraphQL Mutation
const ANALYZE_ERROR_MUTATION = gql`
  mutation AnalyzeError($logs: String!, $userPrompt: String, $mode: String!) {
    analyzeError(logs: $logs, userPrompt: $userPrompt, mode: $mode) {
      response
    }
  }
`;

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

// Type definition for GraphQL mutation response
interface AnalyzeErrorResponse {
    analyzeError: {
        response: string;
    };
}

export default function ChatPanel() {
    const dispatch = useDispatch();
    const logs = useSelector(selectFormattedLogs);
    const isAnalyzing = useSelector((state: RootState) => state.terminal.isAnalyzing);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'STUDENT' | 'PROFESSIONAL'>('PROFESSIONAL');

    const scrollRef = useRef<HTMLDivElement>(null);

    const [analyzeError] = useMutation<AnalyzeErrorResponse>(ANALYZE_ERROR_MUTATION);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() && !logs) return;

        const userMessage = input || "Analyze these logs for me.";
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        dispatch(setAnalyzing(true));

        try {
            const { data } = await analyzeError({
                variables: {
                    logs: logs, // Sending logs from Redux
                    userPrompt: userMessage,
                    mode: mode,
                },
            });

            setMessages((prev) => [
                ...prev,
                { role: 'ai', content: data?.analyzeError.response ?? 'No response received.' },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: 'ai', content: "❌ Error: Unable to contact AI Mentor. Please try again." },
            ]);
            console.error(err);
        } finally {
            dispatch(setAnalyzing(false));
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 w-96">
            {/* Header / Mode Switcher */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <h2 className="text-white font-semibold">AI Mentor</h2>
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'STUDENT' | 'PROFESSIONAL')}
                    className="bg-gray-700 text-xs text-white p-1 rounded border border-gray-600 focus:outline-none"
                >
                    <option value="PROFESSIONAL">Pro Mode</option>
                    <option value="STUDENT">Student Mode</option>
                </select>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-gray-500 text-center text-sm mt-10">
                        <p>No messages yet.</p>
                        <p className="mt-2">Run your code. If it fails, ask me for help!</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-lg text-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white ml-8'
                            : 'bg-gray-800 text-gray-200 mr-8'
                            }`}
                    >
                        <div className="font-bold text-xs mb-1 opacity-50">
                            {msg.role === 'user' ? 'YOU' : 'MENTOR'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                ))}

                {isAnalyzing && (
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
                        <span>Analyzing logs...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex flex-col gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question or describe the bug..."
                        className="w-full bg-gray-900 text-white text-sm p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none h-20"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isAnalyzing}
                        className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${isAnalyzing
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                    >
                        {isAnalyzing ? 'Thinking...' : 'Analyze Logs & Ask'}
                    </button>
                </div>
            </div>
        </div>
    );
}
