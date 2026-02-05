import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Terminal, Zap, Trash2, Send, Database, Globe, Info, Play, Youtube, Star, Sun, Moon, History, Clock, CheckCircle2, Code2, Share2, AlertCircle, Copy, Folder, FolderPlus, ChevronRight, ChevronDown, Settings } from 'lucide-react';
import type { Endpoint, HttpMethod, Variant, Folder as FolderType } from './types';
import { defaultEndpoints, generateId, simulateApiCall } from './utils/api-sim';
import { exportToMockoon } from './utils/export';
import './index.css';

// Curated beginner-friendly API tutorial videos
const recommendedVideos = [
  {
    id: 'v1',
    title: 'What is an API? (In 5 Minutes)',
    channel: 'Fireship',
    youtubeId: 's7wmiS2mSXY',
    duration: '5:28'
  },
  {
    id: 'v2',
    title: 'REST API Explained',
    channel: 'Programming with Mosh',
    youtubeId: 'SLwpqD8n3d0',
    duration: '8:12'
  },
  {
    id: 'v3',
    title: 'APIs for Beginners - How to use an API',
    channel: 'freeCodeCamp',
    youtubeId: 'GZvSYJDk-us',
    duration: '2:19:33'
  },
  {
    id: 'v4',
    title: 'HTTP Status Codes Explained',
    channel: 'Web Dev Simplified',
    youtubeId: 'wJa5CTIFj8w',
    duration: '11:25'
  },
  {
    id: 'v5',
    title: 'Learn JSON in 10 Minutes',
    channel: 'Web Dev Simplified',
    youtubeId: 'iiADhChRriM',
    duration: '12:00'
  },
  {
    id: 'v6',
    title: 'Postman Beginner Tutorial',
    channel: 'The Net Ninja',
    youtubeId: 'VywxIQ2ZXw4',
    duration: '14:32'
  }
];
// --- New Premium Components ---

const JsonTreeNode = ({ label, value, depth = 0 }: { label?: string, value: any, depth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isObject = value !== null && typeof value === 'object';

  const renderValue = () => {
    if (value === null) return <span className="text-muted">null</span>;
    if (typeof value === 'string') return <span style={{ color: '#10b981' }}>"{value}"</span>;
    if (typeof value === 'number') return <span style={{ color: '#3b82f6' }}>{value}</span>;
    if (typeof value === 'boolean') return <span style={{ color: '#f59e0b' }}>{String(value)}</span>;
    return null;
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '16px' : '0', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
      <div
        className="tree-node-header"
        onClick={() => isObject && setIsExpanded(!isExpanded)}
        style={{ cursor: isObject ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}
      >
        {isObject && (
          <motion.span animate={{ rotate: isExpanded ? 90 : 0 }}>
            <ChevronRight size={10} />
          </motion.span>
        )}
        {label && <span className="text-dim">{label}: </span>}
        {isObject ? (
          <span className="text-muted">{Array.isArray(value) ? `Array(${value.length})` : 'Object'}</span>
        ) : renderValue()}
      </div>
      <AnimatePresence>
        {isObject && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderLeft: '1px solid var(--border)', marginLeft: '6px', paddingLeft: '8px' }}
          >
            {Object.entries(value).map(([k, v]) => (
              <JsonTreeNode key={k} label={k} value={v} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AnalyticsDashboard = ({ history }: { history: any[] }) => {
  const total = history.length;
  const success = history.filter(h => h.status < 300).length;
  const error = total - success;
  const avgLatency = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.latency || 0), 0) / history.length) : 0;

  return (
    <div className="analytics-grid">
      <div className="analytics-card">
        <div className="label">Total Requests</div>
        <div className="value">{total}</div>
      </div>
      <div className="analytics-card success">
        <div className="label">Success Rate</div>
        <div className="value">{total > 0 ? Math.round((success / total) * 100) : 0}%</div>
      </div>
      <div className="analytics-card error">
        <div className="label">Error Rate</div>
        <div className="value">{total > 0 ? Math.round((error / total) * 100) : 0}%</div>
      </div>
      <div className="analytics-card">
        <div className="label">Avg Latency</div>
        <div className="value">{avgLatency}ms</div>
      </div>
    </div>
  );
};

// --- End of New Components ---

export default function App() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => {
    const saved = localStorage.getItem('mockflow_endpoints');
    let parsed = saved ? JSON.parse(saved) : defaultEndpoints;
    if (!Array.isArray(parsed)) parsed = defaultEndpoints;
    // Safety check for logic: ensure required fields exist
    return parsed.map((ep: any) => ({
      ...ep,
      variants: Array.isArray(ep.variants) ? ep.variants : [],
      method: ep.method || 'GET',
      path: ep.path || '/api/v1/resource'
    }));
  });
  const [folders, setFolders] = useState<FolderType[]>(() => {
    const saved = localStorage.getItem('mockflow_folders');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  });
  const [activeId, setActiveId] = useState<string>(endpoints[0]?.id || '');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testMode, setTestMode] = useState<'mock' | 'external'>('mock');
  const [externalUrl, setExternalUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [explanation, setExplanation] = useState<{
    concept: string;
    scenario: string;
    action: string;
    breakdown: string;
  } | null>(null);

  // Feature 1: Response History
  const [responseHistory, setResponseHistory] = useState<Array<{
    id: string;
    endpoint: string;
    method: string;
    status: number;
    timestamp: Date;
    data: any;
  }>>(() => {
    const saved = localStorage.getItem('mockflow_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) }));
    }
    return [];
  });

  // Feature 2: Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('mockflow_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Feature 3: Theme Toggle
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('mockflow_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // History Panel & Analytics Toggle
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Medium Feature 1: Request Body Builder
  const [showRequestBuilder, setShowRequestBuilder] = useState(false);

  // Medium Feature 2: Schema Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Medium Feature 3: Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('mockflow_endpoints', JSON.stringify(endpoints));
  }, [endpoints]);

  useEffect(() => {
    localStorage.setItem('mockflow_folders', JSON.stringify(folders));
  }, [folders]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('mockflow_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('mockflow_history', JSON.stringify(responseHistory));
  }, [responseHistory]);

  // Persist and apply theme
  useEffect(() => {
    localStorage.setItem('mockflow_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Medium Feature 3: Handle shared mock import from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('share');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        // Add to endpoints and activate
        const newEp: Endpoint = { ...decoded, id: generateId() };
        setEndpoints(prev => [...prev, newEp]);
        setActiveId(newEp.id);
        alert('External mock imported successfully!');
        // Clear URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to import shared mock', e);
      }
    }
  }, []);


  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Add to history (max 20 items)
  const addToHistory = (endpoint: string, method: string, status: number, data: any, latency: number) => {
    const newEntry = {
      id: generateId(),
      endpoint,
      method,
      status,
      timestamp: new Date(),
      data,
      latency
    };
    setResponseHistory(prev => [newEntry, ...prev].slice(0, 20));
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Sort and filter endpoints: favorites first, then search
  const sortedEndpoints = [...endpoints].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const filteredEndpoints = sortedEndpoints.filter((ep: Endpoint) =>
    ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Medium Feature 2: Schema Validation
  const validateSchema = (data: any, schemaStr?: string) => {
    if (!schemaStr) return [];
    try {
      const schema = JSON.parse(schemaStr);
      const errors: string[] = [];

      // Simple validation - check if expected fields exist
      Object.keys(schema).forEach(key => {
        if (!(key in data)) {
          errors.push(`Missing field: ${key}`);
        } else if (typeof data[key] !== schema[key]) {
          errors.push(`Field '${key}' type mismatch: expected ${schema[key]}, got ${typeof data[key]}`);
        }
      });

      return errors;
    } catch (e) {
      return ['Invalid schema format'];
    }
  };

  // Medium Feature 3: Share Functionality
  const generateShareUrl = () => {
    if (!activeEndpoint) return;

    const encoded = btoa(JSON.stringify(activeEndpoint));
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  // Medium Feature 1: Generate Request Body Template
  const generateRequestBodyTemplate = () => {
    if (!activeEndpoint) return;

    // Generate sample request based on method
    let template = {};
    if (activeEndpoint.method === 'POST') {
      template = {
        name: "Sample Name",
        description: "Sample description",
        value: 123
      };
    } else if (activeEndpoint.method === 'PUT' || activeEndpoint.method === 'PATCH') {
      template = {
        id: "resource-id",
        name: "Updated Name",
        value: 456
      };
    }

    updateEndpoint({ requestBody: JSON.stringify(template, null, 2) });
  };

  const activeEndpoint = endpoints.find(e => e.id === activeId);

  const addEndpoint = (folderId?: string) => {
    const newEndpoint: Endpoint = {
      id: generateId(),
      name: 'New Endpoint',
      method: 'GET',
      path: '/api/v1/resource',
      statusCode: 200,
      body: JSON.stringify({ message: "Success" }, null, 2),
      contentType: 'application/json',
      latency: 0,
      folderId,
      variants: []
    };
    setEndpoints([...endpoints, newEndpoint]);
    setActiveId(newEndpoint.id);
    setTestMode('mock');
  };

  const addFolder = () => {
    const name = prompt("Enter folder name:");
    if (name) {
      const newFolder: FolderType = { id: generateId(), name };
      setFolders([...folders, newFolder]);
    }
  };

  const deleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this folder and all endpoints inside?")) {
      setFolders(folders.filter(f => f.id !== id));
      setEndpoints(endpoints.filter(ep => ep.folderId !== id));
    }
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const moveEndpointToFolder = (endpointId: string, folderId: string | undefined) => {
    setEndpoints(prev => prev.map(ep => ep.id === endpointId ? { ...ep, folderId } : ep));
  };

  const renderEndpointItem = (ep: Endpoint) => (
    <div
      key={ep.id}
      className={`endpoint-item ${activeId === ep.id && testMode === 'mock' ? 'active' : ''} ${favorites.includes(ep.id) ? 'favorited' : ''}`}
      onClick={() => { setActiveId(ep.id); setTestMode('mock'); }}
    >
      <button
        className={`favorite-btn ${favorites.includes(ep.id) ? 'active' : ''}`}
        onClick={(e) => toggleFavorite(ep.id, e)}
        title={favorites.includes(ep.id) ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={12} fill={favorites.includes(ep.id) ? 'currentColor' : 'none'} />
      </button>
      <span className={`method-tag ${ep.method.toLowerCase()}`}>{ep.method}</span>
      <div className="endpoint-info">
        <span className="endpoint-name">{ep.name}</span>
        <span className="endpoint-path">{ep.path}</span>
      </div>
      <div className="folder-select-mini">
        <Folder size={12} />
        <select
          value={ep.folderId || ''}
          onChange={(e) => { e.stopPropagation(); moveEndpointToFolder(ep.id, e.target.value || undefined); }}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">Root</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <button
        className="delete-item-btn"
        onClick={(e) => deleteEndpoint(ep.id, e)}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const updateEndpoint = (updates: Partial<Endpoint>) => {
    setEndpoints(prev => prev.map(e => e.id === activeId ? { ...e, ...updates } : e));
  };

  // Variant Management
  const addVariant = () => {
    if (!activeEndpoint) return;
    const newVariant: Variant = {
      id: generateId(),
      name: `Variant ${activeEndpoint.variants.length + 1}`,
      statusCode: 200,
      body: activeEndpoint.body
    };
    updateEndpoint({ variants: [...activeEndpoint.variants, newVariant] });
  };

  const updateVariant = (variantId: string, updates: Partial<Variant>) => {
    if (!activeEndpoint) return;
    const newVariants = activeEndpoint.variants.map(v =>
      v.id === variantId ? { ...v, ...updates } : v
    );
    updateEndpoint({ variants: newVariants });
  };

  const deleteVariant = (variantId: string) => {
    if (!activeEndpoint) return;
    const newVariants = activeEndpoint.variants.filter(v => v.id !== variantId);
    const updates: Partial<Endpoint> = { variants: newVariants };
    if (activeEndpoint.activeVariantId === variantId) {
      updates.activeVariantId = undefined;
    }
    updateEndpoint(updates);
  };

  const selectVariant = (variantId: string | undefined) => {
    updateEndpoint({ activeVariantId: variantId });
  };

  const updateRateLimit = (updates: Partial<{ enabled: boolean, limit: number, windowMs: number }>) => {
    if (!activeEndpoint) return;
    updateEndpoint({
      rateLimit: {
        enabled: activeEndpoint.rateLimit?.enabled || false,
        limit: activeEndpoint.rateLimit?.limit || 10,
        windowMs: activeEndpoint.rateLimit?.windowMs || 60000,
        ...updates
      }
    });
  };

  const deleteEndpoint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newEndpoints = endpoints.filter(ep => ep.id !== id);
    setEndpoints(newEndpoints);
    if (activeId === id && newEndpoints.length > 0) {
      setActiveId(newEndpoints[0].id);
    }
  };

  const formatJson = () => {
    if (!activeEndpoint) return;
    try {
      const obj = JSON.parse(activeEndpoint.body);
      updateEndpoint({ body: JSON.stringify(obj, null, 2) });
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  const handleExport = () => {
    exportToMockoon(endpoints);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setExplanation(null);

    if (testMode === 'mock') {
      if (!activeEndpoint) return;
      const result = await simulateApiCall(activeEndpoint);
      setTestResult(result);
      // Add to history
      addToHistory(activeEndpoint.name, activeEndpoint.method, result.status, result.data, activeEndpoint.latency || 0);

      // Validate schema if defined
      const errors = validateSchema(result.data, activeEndpoint.schema);
      setValidationErrors(errors);

      if (result.status === 429) {
        setExplanation({
          concept: "The server is catching its breath.",
          scenario: `You've sent too many requests to "${activeEndpoint.name}" in a short period.`,
          action: "The Rate Limiting simulation triggered a 429 error to protect the 'server' from being overwhelmed.",
          breakdown: "This is a real-world scenario where APIs limit traffic to ensure stability. Your frontend should handle this by waiting or showing a 'Slow down' message."
        });
      } else {
        setExplanation({
          concept: "Testing your own creation.",
          scenario: `Testing the "${activeEndpoint.name}" endpoint which is designed to handle requests for ${activeEndpoint.path}.`,
          action: `The MockFlow simulator acted as a real server. It received your request, checked the configuration, and returned exactly what you defined with a ${result.status} code.`,
          breakdown: `Your application received a response. The data below contains the information your frontend would use to display content to users.`
        });
      }
    } else {
      try {
        const response = await fetch(externalUrl);
        const data = await response.json();
        const success = response.ok;
        setTestResult({
          status: response.status,
          data,
          headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' }
        });
        // Add to history
        addToHistory(externalUrl, 'GET', response.status, data, 0);

        setExplanation({
          concept: "Verifying live internet data.",
          scenario: `Connecting to a live external service at "${externalUrl}".`,
          action: success
            ? `We successfully established a handshake with the external server. It acknowledged our request and sent back its current data live.`
            : `We reached the server, but it refused the request (Status ${response.status}). This usually means the URL is protected or expected different parameters.`,
          breakdown: success
            ? `You are now looking at real, live data from the internet. The structure below is what the third-party service provides.`
            : `The server sent an error message. Check the documentation for that specific API to see what requirements are missing.`
        });
      } catch (err) {
        setTestResult({
          status: 500,
          data: { error: "Failed to fetch external API", details: (err as any).message },
          headers: { 'Content-Type': 'application/json' }
        });
        // Add error to history
        addToHistory(externalUrl, 'GET', 500, { error: (err as any).message }, 0);
        setExplanation({
          concept: "A connection hiccup.",
          scenario: `Attempting to reach an external resource at "${externalUrl}".`,
          action: `The connection failed completely before reaching the server.`,
          breakdown: `This usually happens if there is a typo in the address, your internet is disconnected, or the server itself is currently offline.`
        });
      }
    }
    setIsTesting(false);
  };

  const copyCode = (type: 'fetch' | 'curl' | 'react' | 'nextjs') => {
    if (!activeEndpoint) return;
    const baseUrl = 'http://localhost:3000';
    const fullPath = `${baseUrl}${activeEndpoint.path}`;
    let code = '';

    switch (type) {
      case 'fetch':
        code = `fetch('${fullPath}', {\n  method: '${activeEndpoint.method}',\n  headers: { 'Content-Type': '${activeEndpoint.contentType}' }\n}).then(res => res.json())`;
        break;
      case 'curl':
        code = `curl -X ${activeEndpoint.method} "${fullPath}" -H "Content-Type: ${activeEndpoint.contentType}"`;
        break;
      case 'react':
        code = `import { useState, useEffect } from 'react';\n\nfunction MyComponent() {\n  const [data, setData] = useState(null);\n\n  useEffect(() => {\n    fetch('${fullPath}')\n      .then(res => res.json())\n      .then(data => setData(data));\n  }, []);\n\n  return <div>{JSON.stringify(data)}</div>;\n}`;
        break;
      case 'nextjs':
        code = `// Dynamic Server Component\nexport default async function Page() {\n  const res = await fetch('${fullPath}', { cache: 'no-store' });\n  const data = await res.json();\n\n  return <pre>{JSON.stringify(data, null, 2)}</pre>;\n}`;
        break;
    }

    navigator.clipboard.writeText(code);
    alert(`${type.toUpperCase()} snippet copied!`);
  };

  const generateWithAi = () => {
    setIsTesting(true);
    setExplanation(null);

    const samples = [
      {
        topic: "User Directory",
        simple: "A digital address book for employees or customers.",
        data: { users: [{ id: 1, name: "John Doe", role: "Admin", active: true }, { id: 2, name: "Jane Smith", role: "User", active: false }] }
      },
      {
        topic: "E-commerce Catalog",
        simple: "A list of products for sale, like an online shop shelf.",
        data: { products: [{ id: "pro_1", name: "Premium Headphones", price: 199.99, category: "Audio" }, { id: "pro_2", name: "Wireless Mouse", price: 49.99, category: "Accessories" }] }
      },
      {
        topic: "System Health",
        simple: "A dashboard showing if the app's 'heart' and parts are beating correctly.",
        data: { status: "operational", uptime: "14d 6h 22m", services: { database: "healthy", cache: "healthy", api: "healthy" } }
      },
      {
        topic: "Social Feed",
        simple: "A stream of updates or posts from friends and news sources.",
        data: { posts: [{ id: "pst_101", author: "DevGuru", content: "Just launched my new API!", likes: 42 }, { id: "pst_102", author: "CoderX", content: "Working on a React project.", likes: 12 }] }
      }
    ];

    setTimeout(() => {
      let result = {};
      let finalTopic = aiPrompt;
      const currentPrompt = aiPrompt;

      let concept = "";
      let scenario = "";
      let action = "";
      let breakdown = "";

      if (!currentPrompt) {
        const randomSample = samples[Math.floor(Math.random() * samples.length)];
        result = randomSample.data;
        finalTopic = randomSample.topic;
        concept = randomSample.simple;
        scenario = `You requested a random test case. We've selected "${finalTopic}" as a realistic scenario.`;
        action = `Our engine built a complete data structure that mimics what a professional backend developer would create for a ${finalTopic} system.`;
        breakdown = `I've pre-filled the body with products, users, or status checks so you can start testing immediately without typing a single line of code.`;
      } else {
        if (currentPrompt.toLowerCase().includes('user')) {
          result = { users: [{ id: 1, name: "Sample User", email: "user@example.com", role: "Developer" }] };
          concept = "A digital list of people information.";
        } else if (currentPrompt.toLowerCase().includes('card')) {
          result = { cards: [{ id: "c1", brand: "Visa", last4: "4242", expiry: "12/26" }] };
          concept = "Secure payment information details.";
        } else {
          result = { status: "success", data: "AI Generated Object", topic: currentPrompt, timestamp: new Date().toISOString() };
          concept = "A custom data package made just for you.";
        }
        scenario = `Generating dynamic data based on your specific request: "${currentPrompt}".`;
        action = `The AI analyzed your prompt and intelligently mapped out which fields (like IDs, names, or timestamps) would be most useful.`;
        breakdown = `The resulting JSON below is now saved to this endpoint. You can edit it further or test it using the "Test Mock" button.`;
      }

      updateEndpoint({ body: JSON.stringify(result, null, 2), name: "Generated: " + finalTopic });
      setAiPrompt('');
      setIsTesting(false);

      setExplanation({ concept, scenario, action, breakdown });
    }, 1000);
  };

  return (
    <div className={`main-container ${theme}`}>
      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <div className="logo">
            <Zap size={20} fill="var(--accent)" color="var(--accent)" />
            <h2 className="glow-text">MockFlow</h2>
          </div>
          <div className="header-icons">
            <button
              className="icon-btn"
              onClick={() => setShowAnalytics(!showAnalytics)}
              title="Global Analytics"
            >
              <Database size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowHistory(!showHistory)}
              title="Response History"
            >
              <History size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="add-btn" onClick={() => addEndpoint()} title="Add New Endpoint">
              <Plus size={18} />
            </button>
            <button className="add-btn" onClick={addFolder} title="Add New Folder">
              <FolderPlus size={18} />
            </button>
          </div>
        </div>

        <div className="mode-switcher">
          <button
            className={`mode-btn ${testMode === 'mock' ? 'active' : ''}`}
            onClick={() => setTestMode('mock')}
          >
            <Database size={14} /> Generator
          </button>
          <button
            className={`mode-btn ${testMode === 'external' ? 'active' : ''}`}
            onClick={() => setTestMode('external')}
          >
            <Globe size={14} /> Tester
          </button>
        </div>

        <div className="sidebar-search">
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="analytics-section"
            >
              <div className="section-label">Performance Overview</div>
              <AnalyticsDashboard history={responseHistory} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="endpoint-list">
          {/* Folders */}
          {folders.map(folder => {
            const folderEndpoints = filteredEndpoints.filter(ep => ep.folderId === folder.id);
            const isExpanded = expandedFolders.includes(folder.id);

            if (searchTerm && folderEndpoints.length === 0) return null;

            return (
              <div key={folder.id} className="folder-container">
                <div
                  className={`folder-item ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleFolder(folder.id)}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Folder size={14} />
                  <span className="folder-name">{folder.name}</span>
                  <div className="folder-actions">
                    <button onClick={(e) => { e.stopPropagation(); addEndpoint(folder.id); }} title="Add to folder"><Plus size={12} /></button>
                    <button onClick={(e) => deleteFolder(folder.id, e)} title="Delete folder"><Trash2 size={12} /></button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="folder-contents">
                    {folderEndpoints.map(ep => renderEndpointItem(ep))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Root Level Endpoints */}
          <div className="root-endpoints">
            {filteredEndpoints.filter(ep => !ep.folderId).map(ep => renderEndpointItem(ep))}
          </div>
        </div>

        {/* Video Recommendations Section */}
        <div className="videos-section">
          <div className="videos-header">
            <Youtube size={14} />
            <span>Learn APIs</span>
          </div>
          <div className="videos-list">
            {recommendedVideos.map(video => (
              <motion.a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="video-card"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="video-thumbnail">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                  />
                  <div className="play-overlay">
                    <Play size={20} fill="white" />
                  </div>
                  <span className="video-duration">{video.duration}</span>
                </div>
                <div className="video-info">
                  <span className="video-title">{video.title}</span>
                  <span className="video-channel">{video.channel}</span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </aside>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="history-panel glass"
          >
            <div className="history-header">
              <Clock size={14} />
              <span>Response History</span>
              <button className="close-history" onClick={() => setShowHistory(false)}>×</button>
            </div>
            <div className="history-list">
              {responseHistory.length === 0 ? (
                <div className="history-empty">
                  <p>No history yet</p>
                  <span>Test an API to see results here</span>
                </div>
              ) : (
                responseHistory.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="history-item"
                  >
                    <div className="history-item-header">
                      <span className={`method-tag ${item.method.toLowerCase()}`}>{item.method}</span>
                      <span className={`status-badge ${item.status < 300 ? 'success' : 'error'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="history-item-endpoint">{item.endpoint}</div>
                    <div className="history-item-time">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                    <pre className="history-item-data">
                      {JSON.stringify(item.data, null, 2).slice(0, 100)}
                      {JSON.stringify(item.data).length > 100 && '...'}
                    </pre>
                  </motion.div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="content">
        <header className="content-header">
          <div className="breadcrumb">
            <Terminal size={14} />
            <span>{testMode === 'mock' ? 'API Generator' : 'API Tester'}</span>
            <span className="separator">/</span>
            <span className="active-path">{testMode === 'mock' ? activeEndpoint?.name : 'External Request'}</span>
          </div>
          <div className="header-actions">
            {testMode === 'mock' && (
              <button className="secondary-btn" onClick={handleExport}>
                <Database size={16} />
                Export Config
              </button>
            )}
            <button className="primary-btn" onClick={handleTest} disabled={isTesting}>
              {isTesting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap size={16} /></motion.div> : <Send size={16} />}
              {testMode === 'mock' ? 'Test Mock' : 'Send Request'}
            </button>
          </div>
        </header>

        <section className="editor-grid">
          <div className="editor-main glass">
            {testMode === 'external' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="external-tester-form"
              >
                <div className="field-group">
                  <label>External API URL</label>
                  <div className="external-input-group">
                    <span className="method-pill-large">GET</span>
                    <input
                      className="url-input"
                      value={externalUrl}
                      onChange={e => setExternalUrl(e.target.value)}
                      placeholder="https://api.example.com/data"
                    />
                  </div>
                  <p className="field-hint">Test any live API endpoint immediately. Great for comparing mocks with real data.</p>
                </div>
              </motion.div>
            ) : activeEndpoint ? (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="endpoint-form"
              >
                <div className="form-row">
                  <div className="field-group flex-1">
                    <label>Endpoint Name</label>
                    <input
                      value={activeEndpoint.name}
                      onChange={e => updateEndpoint({ name: e.target.value })}
                    />
                  </div>
                  <div className="field-group w-32">
                    <label>Status Code</label>
                    <input
                      type="number"
                      value={activeEndpoint.statusCode}
                      onChange={e => updateEndpoint({ statusCode: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field-group w-32">
                    <label>Method</label>
                    <select
                      value={activeEndpoint.method}
                      onChange={e => updateEndpoint({ method: e.target.value as HttpMethod })}
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                      <option>PATCH</option>
                    </select>
                  </div>
                  <div className="field-group w-32">
                    <label>Latency (ms)</label>
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      step="100"
                      value={activeEndpoint.latency}
                      onChange={e => updateEndpoint({ latency: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="field-group flex-1">
                    <label>Path</label>
                    <div className="path-input-wrapper">
                      <span>/</span>
                      <input
                        value={activeEndpoint.path.startsWith('/') ? activeEndpoint.path.slice(1) : activeEndpoint.path}
                        onChange={e => updateEndpoint({ path: '/' + e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="field-group flex-1 mb-0">
                  <div className="field-header">
                    <label>Response Body (JSON)</label>
                    <div className="flex gap-2">
                      <button className="ghost-btn" onClick={formatJson} title="Prettify JSON">
                        Format
                      </button>
                      <input
                        className="ai-input"
                        placeholder="AI: User list..."
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && generateWithAi()}
                      />
                      <button className="ghost-btn magic" onClick={generateWithAi}>
                        <Zap size={11} fill="currentColor" /> Generate
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="json-editor"
                    value={activeEndpoint.body}
                    onChange={e => updateEndpoint({ body: e.target.value })}
                    spellCheck={false}
                  />
                </div>

                {/* Advanced Feature: Scenarios / Variants */}
                <div className="field-group flex-1 mb-0 variants-section">
                  <div className="field-header">
                    <label>Response Scenarios (Variants)</label>
                    <button className="ghost-btn" onClick={addVariant}>
                      <Plus size={11} /> Add Variant
                    </button>
                  </div>
                  <div className="variants-grid">
                    <div
                      className={`variant-pill ${!activeEndpoint.activeVariantId ? 'active' : ''}`}
                      onClick={() => selectVariant(undefined)}
                    >
                      Default
                    </div>
                    {activeEndpoint.variants.map(v => (
                      <div
                        key={v.id}
                        className={`variant-pill ${activeEndpoint.activeVariantId === v.id ? 'active' : ''}`}
                        onClick={() => selectVariant(v.id)}
                      >
                        <span className="variant-status">{v.statusCode}</span>
                        {v.name}
                        <button
                          className="variant-delete"
                          onClick={(e) => { e.stopPropagation(); deleteVariant(v.id); }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {activeEndpoint.activeVariantId && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="variant-editor glass"
                    >
                      <div className="form-row">
                        <div className="field-group flex-1">
                          <label>Variant Name</label>
                          <input
                            value={activeEndpoint.variants.find(v => v.id === activeEndpoint.activeVariantId)?.name}
                            onChange={(e) => updateVariant(activeEndpoint.activeVariantId!, { name: e.target.value })}
                          />
                        </div>
                        <div className="field-group w-32">
                          <label>Status</label>
                          <input
                            type="number"
                            value={activeEndpoint.variants.find(v => v.id === activeEndpoint.activeVariantId)?.statusCode}
                            onChange={(e) => updateVariant(activeEndpoint.activeVariantId!, { statusCode: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="field-group">
                        <label>Variant Body (JSON)</label>
                        <textarea
                          className="json-editor mini"
                          value={activeEndpoint.variants.find(v => v.id === activeEndpoint.activeVariantId)?.body}
                          onChange={(e) => updateVariant(activeEndpoint.activeVariantId!, { body: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Advanced Feature: Rate Limiting */}
                <div className="field-group flex-1 mb-0 rate-limit-section">
                  <div className="field-header">
                    <div className="flex items-center gap-2">
                      <Settings size={14} />
                      <label>Rate Limiting Simulation</label>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={activeEndpoint.rateLimit?.enabled || false}
                        onChange={(e) => updateRateLimit({ enabled: e.target.checked })}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  {activeEndpoint.rateLimit?.enabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="rate-limit-controls"
                    >
                      <div className="form-row">
                        <div className="field-group flex-1">
                          <label>Max Requests</label>
                          <input
                            type="number"
                            value={activeEndpoint.rateLimit.limit}
                            onChange={(e) => updateRateLimit({ limit: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="field-group flex-1">
                          <label>Window (ms)</label>
                          <input
                            type="number"
                            value={activeEndpoint.rateLimit.windowMs}
                            onChange={(e) => updateRateLimit({ windowMs: parseInt(e.target.value) || 1000 })}
                          />
                        </div>
                      </div>
                      <p className="field-hint">Returns 429 Too Many Requests after limit is reached in the window.</p>
                    </motion.div>
                  )}
                </div>

                {/* Medium Feature 1: Request Body Builder (for POST/PUT/PATCH) */}
                {(activeEndpoint.method === 'POST' || activeEndpoint.method === 'PUT' || activeEndpoint.method === 'PATCH') && (
                  <div className="field-group flex-1 mb-0">
                    <div className="field-header">
                      <label>Request Body Template</label>
                      <div className="flex gap-2">
                        <button
                          className="ghost-btn"
                          onClick={generateRequestBodyTemplate}
                          title="Generate sample request body"
                        >
                          <Code2 size={11} /> Generate Sample
                        </button>
                        <button
                          className="ghost-btn"
                          onClick={() => setShowRequestBuilder(!showRequestBuilder)}
                          title={showRequestBuilder ? "Hide" : "Show"}
                        >
                          {showRequestBuilder ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    {showRequestBuilder && (
                      <motion.textarea
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 150, opacity: 1 }}
                        className="json-editor"
                        style={{ minHeight: '150px' }}
                        value={activeEndpoint.requestBody || ''}
                        onChange={e => updateEndpoint({ requestBody: e.target.value })}
                        placeholder="Define sample request body here..."
                        spellCheck={false}
                      />
                    )}
                  </div>
                )}

                {/* Medium Feature 2: Response Schema Validator */}
                <div className="field-group flex-1 mb-0">
                  <div className="field-header">
                    <label>Response Schema (for validation)</label>
                    <button
                      className="ghost-btn"
                      onClick={() => {
                        const show = !activeEndpoint.schema;
                        if (show) {
                          updateEndpoint({ schema: JSON.stringify({ status: "string", data: "object" }, null, 2) });
                        }
                      }}
                      title="Toggle schema"
                    >
                      <CheckCircle2 size={11} /> {activeEndpoint.schema ? 'Clear' : 'Add Schema'}
                    </button>
                  </div>
                  {activeEndpoint.schema && (
                    <motion.textarea
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 120, opacity: 1 }}
                      className="json-editor schema-editor"
                      style={{ minHeight: '120px' }}
                      value={activeEndpoint.schema}
                      onChange={e => updateEndpoint({ schema: e.target.value })}
                      placeholder='{"field1": "string", "field2": "number"}'
                      spellCheck={false}
                    />
                  )}
                </div>

                {/* Medium Feature 3: Share Mock Button */}
                <div className="share-section">
                  <button className="share-btn" onClick={generateShareUrl}>
                    <Share2 size={14} /> Generate Share Link
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="empty-state">
                <Zap size={48} color="var(--border-bright)" />
                <p>Select an endpoint to edit or create a new one.</p>
              </div>
            )}
          </div>

          <aside className="editor-preview glass">
            <div className="preview-header">
              <Terminal size={14} />
              <span>Response Inspector</span>
              {testResult && testMode === 'mock' && (
                <div className="flex gap-1 ml-auto">
                  <button className="snippet-btn" onClick={() => copyCode('fetch')}>FETCH</button>
                  <button className="snippet-btn" onClick={() => copyCode('react')}>REACT</button>
                  <button className="snippet-btn" onClick={() => copyCode('nextjs')}>NEXTJS</button>
                  <button className="snippet-btn" onClick={() => copyCode('curl')}>CURL</button>
                </div>
              )}
            </div>
            <div className="preview-content">
              <AnimatePresence mode="wait">
                {testResult ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="response-log"
                  >
                    <div className="log-status">
                      <span className={`status-pill ${testResult.status < 300 ? 'success' : 'error'}`}>
                        {testResult.status} {testResult.status < 300 ? 'OK' : 'Error'}
                      </span>
                      <span className="log-time">32ms</span>
                    </div>

                    {explanation && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="explanation-box detailed"
                      >
                        <div className="explanation-section primary">
                          <div className="section-label"><Globe size={12} /> SIMPLE SUMMARY</div>
                          <p className="concept-text">{explanation.concept}</p>
                        </div>
                        <div className="explanation-section">
                          <div className="section-label"><Info size={12} /> SCENARIO</div>
                          <p>{explanation.scenario}</p>
                        </div>
                        <div className="explanation-section">
                          <div className="section-label"><Zap size={12} /> WHAT HAPPENED</div>
                          <p>{explanation.action}</p>
                        </div>
                        <div className="explanation-section">
                          <div className="section-label"><Database size={12} /> DATA BREAKDOWN</div>
                          <p>{explanation.breakdown}</p>
                        </div>
                      </motion.div>
                    )}

                    {validationErrors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="validation-box error"
                      >
                        <div className="section-label"><AlertCircle size={12} /> SCHEMA VALIDATION FAILED</div>
                        <ul>
                          {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </motion.div>
                    )}

                    {activeEndpoint?.schema && validationErrors.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="validation-box success"
                      >
                        <div className="section-label"><CheckCircle2 size={12} /> SCHEMA VALIDATION PASSED</div>
                        <p>All fields match the defined schema.</p>
                      </motion.div>
                    )}

                    <div className="log-headers">
                      <div className="log-header-item">
                        <span className="key">content-type:</span>
                        <span className="val">{testResult.headers['Content-Type']}</span>
                      </div>
                    </div>

                    <div className="log-body-container">
                      <div className="body-header">
                        <span>Interactive JSON Explorer</span>
                      </div>
                      <div className="body-content">
                        <JsonTreeNode value={testResult.data} />
                      </div>
                    </div>

                    <div className="raw-body-section">
                      <button className="ghost-btn mini" onClick={() => {
                        const el = document.getElementById('raw-body');
                        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                      }}>
                        Toggle Raw JSON
                      </button>
                      <pre id="raw-body" className="log-body" style={{ display: 'none', marginTop: '10px' }}>
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="preview-empty"
                  >
                    {isTesting ? (
                      <div className="loading-spinner">Simulating Server...</div>
                    ) : (
                      <>
                        <p>Hit "Test API" to see the output.</p>
                        <div className="test-hint">Mocks are automatically updated and persisted.</div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        </section>
      </main>

      {/* Medium Feature 3: Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="share-modal glass"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Share Mock Endpoint</h3>
                <button className="close-btn" onClick={() => setShowShareModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Anyone with this link can import this endpoint configuration.</p>
                <div className="share-input-group">
                  <input readOnly value={shareUrl} />
                  <button onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert('Link copied!');
                  }}>
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .main-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at 50% 0%, #1a152e 0%, var(--bg) 70%);
        }

        .sidebar {
          width: 320px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .sidebar-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo h2 {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.5px;
        }

        .sidebar-search {
          padding: 0 24px 16px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .sidebar-search svg {
          position: absolute;
          left: 36px;
        }

        .sidebar-search input {
          width: 100%;
          padding-left: 36px;
          background: rgba(255,255,255,0.03);
          font-size: 13px;
        }

        .add-btn {
          background: var(--accent);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px var(--accent-glow);
        }

        .endpoint-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 12px 24px;
        }

        .endpoint-item {
          padding: 12px 14px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
          cursor: pointer;
          position: relative;
          border: 1px solid transparent;
        }

        .endpoint-item:hover {
          background: var(--surface-hover);
        }

        .endpoint-item.active {
          background: rgba(124, 58, 237, 0.08);
          border-color: rgba(124, 58, 237, 0.3);
        }

        .method-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          min-width: 48px;
          text-align: center;
        }

        .method-tag.get { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .method-tag.post { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .method-tag.put { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .method-tag.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .endpoint-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        .endpoint-name {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .endpoint-path {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delete-item-btn {
          opacity: 0;
          color: var(--text-muted);
          padding: 4px;
        }

        .endpoint-item:hover .delete-item-btn {
          opacity: 1;
        }

        .delete-item-btn:hover {
          color: var(--error);
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        .content-header {
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .separator {
          color: var(--border-bright);
        }

        .active-path {
          color: var(--text);
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .primary-btn, .secondary-btn, .ghost-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
        }

        .primary-btn {
          background: var(--accent);
          color: white;
        }

        .primary-btn:hover:not(:disabled) {
          background: #6d28d9;
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .secondary-btn {
          background: var(--surface-hover);
          border: 1px solid var(--border-bright);
          color: var(--text);
        }

        .secondary-btn:hover {
          background: var(--border-bright);
        }

        .ghost-btn {
          padding: 4px 8px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .ghost-btn:hover {
          color: var(--text);
          background: rgba(255,255,255,0.05);
        }

        .editor-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 0;
          overflow: hidden;
          min-height: 0;
        }

        .editor-main {
          padding: 32px;
          overflow-y: auto;
          border: none;
          background: transparent;
          min-height: 0;
        }

        .endpoint-form {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .flex-1 { flex: 1; }
        .w-32 { width: 140px; }

        label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .path-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding-left: 12px;
        }

        .path-input-wrapper span {
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .path-input-wrapper input {
          border: none;
          background: transparent;
          box-shadow: none !important;
        }

        .json-editor {
          min-height: 400px;
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.6;
          resize: vertical;
          background: rgba(0,0,0,0.2);
        }

        .editor-preview {
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          background: rgba(0,0,0,0.1);
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }

        .preview-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dim);
        }

        .preview-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .preview-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          text-align: center;
          gap: 12px;
        }

        .test-hint { font-size: 11px; font-style: italic; }

        .response-log {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
        }

        .status-pill {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .status-pill.success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-pill.error { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        .log-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .log-time { font-size: 11px; color: var(--text-muted); }

        .log-headers {
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .log-header-item {
          display: flex;
          gap: 8px;
        }

        .log-header-item .key { color: var(--text-muted); }

        .log-body {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #a78bfa;
          background: rgba(0,0,0,0.3);
          padding: 16px;
          border-radius: var(--radius-md);
          overflow-x: auto;
        }

        .loading-spinner {
          font-size: 13px;
          color: var(--accent);
          animation: pulse 1.5s infinite;
        }
        .mode-switcher {
          margin: 0 24px 16px;
          display: flex;
          background: rgba(255,255,255,0.03);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--border);
        }

        .mode-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          border-radius: 6px;
        }

        .mode-btn:hover {
          color: var(--text);
        }

        .mode-btn.active {
          background: var(--accent);
          color: white;
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .explanation-box {
          background: rgba(124, 58, 237, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .explanation-box.detailed {
          background: rgba(124, 58, 237, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .explanation-section.primary {
          background: rgba(124, 58, 237, 0.1);
          padding: 12px;
          border-radius: var(--radius-sm);
          border-left: 3px solid var(--accent);
        }

        .concept-text {
          font-size: 15px !important;
          font-weight: 600;
          color: var(--text) !important;
        }

        .explanation-icon {
          color: var(--accent);
          margin-top: 2px;
        }

        .explanation-box p {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-dim);
          margin: 0;
        }

        .external-tester-form {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(124, 58, 237, 0.03);
          padding: 32px;
          border-radius: var(--radius-lg);
          border: 1px dashed rgba(124, 58, 237, 0.2);
        }

        .external-input-group {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-top: 8px;
        }

        .method-pill-large {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 12px 20px;
          font-weight: 800;
          font-size: 14px;
          border-right: 1px solid var(--border);
        }

        .url-input {
          flex: 1;
          background: transparent;
          border: none !important;
          box-shadow: none !important;
          font-family: var(--font-mono);
          font-size: 14px;
        }

        .field-hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 12px;
          font-style: italic;
        }
        .gap-1 { gap: 4px; }
        .ml-auto { margin-left: auto; }

        .ai-input {
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border-bright);
          color: #a78bfa;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 6px;
          width: 140px;
        }

        .snippet-btn {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--border-bright);
          color: var(--text-dim);
          border: 1px solid transparent;
        }

        .snippet-btn:hover {
          background: var(--accent);
          color: white;
        }

        /* Video Recommendations Section */
        .videos-section {
          border-top: 1px solid var(--border);
          padding: 16px 12px;
          margin-top: auto;
        }

        .videos-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 8px 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-light);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .videos-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .video-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .video-card:hover {
          background: rgba(124, 58, 237, 0.08);
          border-color: rgba(124, 58, 237, 0.2);
        }

        .video-thumbnail {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 6px;
          overflow: hidden;
          background: var(--surface);
        }

        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .video-card:hover .video-thumbnail img {
          transform: scale(1.05);
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .video-card:hover .play-overlay {
          opacity: 1;
        }

        .play-overlay svg {
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        }

        .video-duration {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: var(--font-mono);
        }

        .video-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .video-title {
          font-size: 12px;
          font-weight: 500;
          color: var(--text);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .video-channel {
          font-size: 10px;
          color: var(--text-muted);
        }

        /* Feature 1: Header Icons for Theme & History */
        .header-icons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
        }

        .icon-btn:hover {
          color: var(--accent);
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.3);
        }

        /* Feature 2: Favorites */
        .favorite-btn {
          padding: 4px;
          color: var(--text-muted);
          opacity: 0.5;
          transition: all 0.2s ease;
        }

        .favorite-btn:hover,
        .favorite-btn.active {
          opacity: 1;
          color: #f59e0b;
        }

        .endpoint-item.favorited {
          background: rgba(245, 158, 11, 0.05);
        }

        /* Feature 3: Light Theme */
        .main-container.light {
          --bg: #f8fafc;
          --surface: #ffffff;
          --surface-hover: #f1f5f9;
          --panel: rgba(255, 255, 255, 0.9);
          --border: #e2e8f0;
          --border-bright: #cbd5e1;
          --text: #0f172a;
          --text-dim: #475569;
          --text-muted: #94a3b8;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .main-container.light .glass {
          background: rgba(255, 255, 255, 0.8);
          border-color: var(--border);
        }

        .main-container.light .glow-text {
          background: linear-gradient(135deg, var(--accent) 0%, #9333ea 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }

        .main-container.light .json-editor,
        .main-container.light .log-body {
          background: rgba(0, 0, 0, 0.05);
          color: #7c3aed;
        }

        .main-container.light input,
        .main-container.light textarea,
        .main-container.light select {
          background: var(--surface);
          border-color: var(--border);
          color: var(--text);
        }

        /* History Panel */
        .history-panel {
          width: 320px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .history-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          border-bottom: 1px solid var(--border);
        }

        .close-history {
          margin-left: auto;
          font-size: 18px;
          color: var(--text-muted);
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-history:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .history-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .history-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
        }

        .history-empty p {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .history-empty span {
          font-size: 12px;
        }

        .history-item {
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          margin-bottom: 8px;
        }

        .history-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .status-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .status-badge.success {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .status-badge.error {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .history-item-endpoint {
          font-size: 12px;
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .history-item-time {
          font-size: 10px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .history-item-data {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent-light);
          background: rgba(0,0,0,0.2);
          padding: 8px;
          border-radius: 4px;
          overflow: hidden;
          max-height: 60px;
          white-space: pre-wrap;
          word-break: break-all;
        }

        /* Medium Features CSS */
        .validation-box {
          padding: 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
          border: 1px solid transparent;
        }

        .validation-box.error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--error);
        }

        .validation-box.error ul {
          margin: 8px 0 0 20px;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .validation-box.success {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: var(--success);
        }

        .validation-box.success p {
          font-size: 12px;
          margin-top: 4px;
        }

        .share-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
        }

        .share-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(124, 58, 237, 0.1);
          color: var(--accent-light);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: var(--radius-sm);
          font-weight: 500;
          font-size: 12px;
        }

        .share-btn:hover {
          background: var(--accent);
          color: white;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .share-modal {
          width: 480px;
          padding: 24px;
          border-radius: var(--radius-lg);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          font-family: var(--font-display);
          font-size: 18px;
        }

        .close-btn {
          font-size: 24px;
          color: var(--text-muted);
        }

        .modal-body p {
          color: var(--text-dim);
          font-size: 14px;
          margin-bottom: 16px;
        }

        .share-input-group {
          display: flex;
          gap: 8px;
        }

        .share-input-group input {
          flex: 1;
          font-family: var(--font-mono);
          font-size: 12px;
          opacity: 0.8;
        }

        .share-input-group button {
          padding: 0 16px;
          background: var(--accent);
          color: white;
          border-radius: var(--radius-sm);
        }

        .schema-editor {
          border-color: rgba(124, 58, 237, 0.3);
          border-style: dashed;
        }

        /* Premium Components Styling */
        .analytics-section {
          padding: 0 24px 16px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .analytics-card {
          padding: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .analytics-card .label {
          font-size: 9px;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .analytics-card .value {
          font-size: 16px;
          font-weight: 700;
          font-family: var(--font-display);
        }

        .analytics-card.success .value { color: var(--success); }
        .analytics-card.error .value { color: var(--error); }

        .log-body-container {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .body-header {
          padding: 8px 12px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--border);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-dim);
        }

        .body-content {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .tree-node-header:hover {
          background: rgba(255,255,255,0.03);
          border-radius: 4px;
        }

        .ghost-btn.mini {
          font-size: 10px;
          padding: 4px 8px;
        }

        .raw-body-section {
          margin-top: 12px;
        }

        .section-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--accent-light);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
      `}</style>
    </div >
  );
}
