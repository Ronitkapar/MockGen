import type { Endpoint } from '../types';

export const exportToMockoon = (endpoints: Endpoint[], projectName: string = "MockFlow Export") => {
    const mockoonEnv = {
        uuid: crypto.randomUUID(),
        lastMigration: 32,
        name: projectName,
        endpointPrefix: '',
        latency: 0,
        port: 3000,
        hostname: '0.0.0.0',
        folders: [],
        routes: endpoints.map(ep => ({
            uuid: crypto.randomUUID(),
            type: 'http',
            endpoint: ep.path.startsWith('/') ? ep.path.slice(1) : ep.path,
            method: ep.method.toLowerCase(),
            responses: [
                {
                    uuid: crypto.randomUUID(),
                    body: ep.body,
                    latency: ep.latency,
                    statusCode: ep.statusCode,
                    label: '',
                    headers: [
                        { key: 'Content-Type', value: ep.contentType }
                    ],
                    bodyType: 'INLINE',
                    filePath: '',
                    databucketID: '',
                    sendFileAsBody: false,
                    rules: [],
                    rulesOperator: 'OR',
                    disableTemplating: false,
                    fallbackStatus: 404,
                    color: null
                }
            ],
            enabled: true,
            responseMode: null
        })),
        rootChildren: endpoints.map(ep => ({
            type: 'route',
            uuid: ep.id // Using our ID here for reference
        })),
        proxyMode: false,
        proxyHost: '',
        proxyRemovePrefix: false,
        tlsOptions: {
            enabled: false,
            type: 'CERT',
            pfxPath: '',
            certPath: '',
            keyPath: '',
            caPath: '',
            passphrase: ''
        },
        cors: true,
        headers: [],
        proxyReqHeaders: [],
        proxyResHeaders: [],
        data: [],
        callbacks: []
    };

    const blob = new Blob([JSON.stringify(mockoonEnv, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockflow-export-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
