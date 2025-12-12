import { WebContainerProvider } from './contexts/WebContainerContext';
import { EditorProvider } from './context/EditorContext';
import SandboxPage from './pages/SandboxPage';

function App() {
    return (
        <WebContainerProvider>
            <EditorProvider>
                <SandboxPage />
            </EditorProvider>
        </WebContainerProvider>
    );
}

export default App;
