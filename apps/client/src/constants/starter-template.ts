import { FileSystemTree } from '@webcontainer/api';

export const STARTER_TEMPLATE: FileSystemTree = {
    'package.json': {
        file: {
            contents: JSON.stringify({
                name: 'ghoststack-preview',
                type: 'module',
                dependencies: {
                    react: '^18.2.0',
                    'react-dom': '^18.2.0',
                },
                devDependencies: {
                    '@vitejs/plugin-react': '^4.2.1',
                    vite: '^5.1.4',
                },
                scripts: {
                    dev: 'vite',
                    build: 'vite build',
                },
            }, null, 2),
        },
    },
    'index.html': {
        file: {
            contents: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GhostStack App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        },
    },
    'vite.config.js': {
        file: {
            contents: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});`,
        },
    },
    src: {
        directory: {
            'main.jsx': {
                file: {
                    contents: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
                },
            },
            'App.jsx': {
                file: {
                    contents: `
import React from 'react';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>👻 GhostStack Sandbox</h1>
      <p>Edit this file to see changes instantly!</p>
    </div>
  );
}`,
                },
            },
            'index.css': {
                file: {
                    contents: `
body { margin: 0; background: #f9fafb; color: #111; }`,
                },
            },
        },
    },
};
