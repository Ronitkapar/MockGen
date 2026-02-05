import type { Endpoint } from '../types';

const requestTracker: Record<string, { count: number, resetAt: number }> = {};

export const simulateApiCall = async (endpoint: Endpoint) => {
    // 1. Check Rate Limiting
    if (endpoint.rateLimit?.enabled) {
        const now = Date.now();
        const tracker = requestTracker[endpoint.id] || { count: 0, resetAt: now + endpoint.rateLimit.windowMs };

        if (now > tracker.resetAt) {
            tracker.count = 0;
            tracker.resetAt = now + endpoint.rateLimit.windowMs;
        }

        tracker.count++;
        requestTracker[endpoint.id] = tracker;

        if (tracker.count > endpoint.rateLimit.limit) {
            return {
                status: 429,
                data: { error: "Too Many Requests", message: "Rate limit exceeded. Please try again later." },
                headers: { 'Content-Type': 'application/json' }
            };
        }
    }

    // 2. Simulate Latency
    await new Promise(resolve => setTimeout(resolve, endpoint.latency));

    // 3. Determine Response Data (Variant vs Base)
    let statusCode = endpoint.statusCode;
    let body = endpoint.body;

    if (endpoint.activeVariantId) {
        const variant = endpoint.variants.find(v => v.id === endpoint.activeVariantId);
        if (variant) {
            statusCode = variant.statusCode;
            body = variant.body;
        }
    }

    try {
        const parsedBody = JSON.parse(body);
        return {
            status: statusCode,
            data: parsedBody,
            headers: {
                'Content-Type': endpoint.contentType,
            }
        };
    } catch (e) {
        return {
            status: statusCode,
            data: body,
            headers: {
                'Content-Type': 'text/plain',
            }
        };
    }
};

export const generateId = () => Math.random().toString(36).substring(2, 11);

export const defaultEndpoints: Endpoint[] = [
    {
        id: 'default-1',
        name: 'Get User Profile',
        method: 'GET',
        path: '/api/v1/user/profile',
        statusCode: 200,
        body: JSON.stringify({
            id: "u_123",
            username: "ronit_dev",
            email: "ronit@example.com",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ronit",
            status: "online",
            stats: { posts: 42, followers: 1200 }
        }, null, 2),
        contentType: 'application/json',
        latency: 300,
        variants: []
    },
    {
        id: 'default-2',
        name: 'Create Post (Error Case)',
        method: 'POST',
        path: '/api/v1/posts',
        statusCode: 401,
        body: JSON.stringify({
            status: "error",
            message: "Authorization token missing or expired.",
            code: "AUTH_REQUIRED"
        }, null, 2),
        contentType: 'application/json',
        latency: 0,
        variants: []
    },
    {
        id: 'default-3',
        name: 'System Health Check',
        method: 'GET',
        path: '/health',
        statusCode: 200,
        body: JSON.stringify({
            status: "healthy",
            uptime: "24h 15m",
            version: "1.0.4-stable"
        }, null, 2),
        contentType: 'application/json',
        latency: 150,
        variants: []
    }
];
