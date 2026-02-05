export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Variant {
    id: string;
    name: string;
    statusCode: number;
    body: string;
}

export interface Folder {
    id: string;
    name: string;
}

export interface Endpoint {
    id: string;
    name: string;
    method: HttpMethod;
    path: string;
    statusCode: number;
    body: string;
    contentType: string;
    latency: number;
    schema?: string;
    requestBody?: string;
    // Advanced features
    folderId?: string;
    activeVariantId?: string;
    variants: Variant[];
    rateLimit?: {
        enabled: boolean;
        limit: number;
        windowMs: number;
    };
}


export interface ProjectState {
    endpoints: Endpoint[];
    folders: Folder[];
    activeId: string | null;
}
