import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Download, Trash2, RefreshCw, Package, ExternalLink, Star, Clock,
  Upload, Check, AlertCircle, Loader2, Filter, ChevronDown, X, Play, Pause,
  FileCode, Settings, Info, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

// Types
interface OpenVSXExtension {
  namespace: string;
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  iconUrl?: string;
  downloadCount?: number;
  averageRating?: number;
  publishedDate?: string;
  lastUpdated?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  engines?: Record<string, string>;
  categories?: string[];
  tags?: string[];
  extensionKind?: string[];
  galleryApiUrl?: string;
}

interface ExtensionVersion {
  version: string;
  publishedDate: string;
  downloadUrl: string;
}

interface InstalledExtension {
  id: string;
  namespace: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  iconUrl?: string;
  enabled: boolean;
  installedAt: string;
}

interface VSIXManifest {
  name: string;
  displayName?: string;
  description?: string;
  version: string;
  publisher: string;
  icon?: string;
  engines?: { vscode: string };
  categories?: string[];
  contributes?: any;
  activationEvents?: string[];
  main?: string;
}

// OpenVSX API base URL
const OPENVSX_API = 'https://open-vsx.org/api';

// Storage key for installed extensions
const STORAGE_KEY = 'nexus_installed_extensions';

// Format date - shared utility
const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ExtensionsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [extensions, setExtensions] = useState<OpenVSXExtension[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'installed' | 'upload'>('browse');
  const [selectedExtension, setSelectedExtension] = useState<OpenVSXExtension | null>(null);
  const [installingExtension, setInstallingExtension] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'downloads' | 'rating' | 'recent'>('relevance');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories from OpenVSX
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'programming-languages', label: 'Programming Languages' },
    { id: 'snippets', label: 'Snippets' },
    { id: 'linters', label: 'Linters' },
    { id: 'themes', label: 'Themes' },
    { id: 'debuggers', label: 'Debuggers' },
    { id: 'formatters', label: 'Formatters' },
    { id: 'keymaps', label: 'Keymaps' },
    { id: 'scm-providers', label: 'SCM Providers' },
    { id: 'other', label: 'Other' },
  ];

  // Load installed extensions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setInstalledExtensions(JSON.parse(saved));
    }
  }, []);

  // Save installed extensions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installedExtensions));
  }, [installedExtensions]);

  // Search OpenVSX registry
  const searchExtensions = useCallback(async (query: string, category: string = 'all') => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category !== 'all') params.append('category', category);
      params.append('size', '50');
      
      const response = await fetch(`${OPENVSX_API}/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch extensions');
      
      const data = await response.json();
      setExtensions(data.extensions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search extensions');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get extension details
  const getExtensionDetails = async (namespace: string, name: string): Promise<OpenVSXExtension | null> => {
    try {
      const response = await fetch(`${OPENVSX_API}/${namespace}/${name}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };

  // Get extension versions
  const getExtensionVersions = async (namespace: string, name: string): Promise<ExtensionVersion[]> => {
    try {
      const response = await fetch(`${OPENVSX_API}/${namespace}/${name}/versions`);
      if (!response.ok) return [];
      const data = await response.json();
      return Object.entries(data.versions || {}).map(([version, info]: [string, any]) => ({
        version,
        publishedDate: info.timestamp || '',
        downloadUrl: info.download || '',
      }));
    } catch {
      return [];
    }
  };

  // Install extension from OpenVSX
  const installExtension = async (ext: OpenVSXExtension) => {
    const extId = `${ext.namespace}.${ext.name}`;
    setInstallingExtension(extId);
    
    try {
      // Get download URL
      const response = await fetch(`${OPENVSX_API}/${ext.namespace}/${ext.name}/latest`);
      if (!response.ok) throw new Error('Failed to get extension info');
      
      const data = await response.json();
      const downloadUrl = data.files?.download;
      
      if (!downloadUrl) throw new Error('No download URL available');
      
      // Download the VSIX file
      const vsixResponse = await fetch(downloadUrl);
      if (!vsixResponse.ok) throw new Error('Failed to download extension');
      
      const blob = await vsixResponse.blob();
      
      // Extract and process VSIX (simplified - in real implementation would use JSZip)
      const installed: InstalledExtension = {
        id: extId,
        namespace: ext.namespace,
        name: ext.name,
        version: ext.version,
        displayName: ext.displayName || ext.name,
        description: ext.description || '',
        iconUrl: ext.iconUrl,
        enabled: true,
        installedAt: new Date().toISOString(),
      };
      
      setInstalledExtensions(prev => {
        const existing = prev.findIndex(e => e.id === extId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = installed;
          return updated;
        }
        return [...prev, installed];
      });
      
      // Store VSIX blob in IndexedDB for later use
      await storeExtensionBlob(extId, blob);
      
    } catch (err: any) {
      setError(`Failed to install ${ext.displayName || ext.name}: ${err.message}`);
    } finally {
      setInstallingExtension(null);
    }
  };

  // Store extension blob in IndexedDB
  const storeExtensionBlob = async (id: string, blob: Blob) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('nexus-extensions', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('extensions')) {
          db.createObjectStore('extensions', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction('extensions', 'readwrite');
        const store = transaction.objectStore('extensions');
        store.put({ id, blob, storedAt: new Date().toISOString() });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  };

  // Upload and install VSIX file
  const handleVSIXUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.vsix')) {
      setError('Please upload a .vsix file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer]);
      
      // Parse VSIX (simplified - would use JSZip in production)
      const zip = await import('jszip').then(m => m.loadAsync(blob));
      
      // Read package.json from VSIX
      const packageJsonFile = zip.file('extension/package.json');
      let manifest: VSIXManifest = {
        name: file.name.replace('.vsix', ''),
        displayName: file.name.replace('.vsix', ''),
        description: 'Installed from local file',
        version: '1.0.0',
        publisher: 'local',
      };
      
      if (packageJsonFile) {
        const content = await packageJsonFile.async('string');
        manifest = JSON.parse(content);
      }
      
      const extId = `local.${manifest.name}`;
      
      const installed: InstalledExtension = {
        id: extId,
        namespace: manifest.publisher || 'local',
        name: manifest.name,
        version: manifest.version,
        displayName: manifest.displayName || manifest.name,
        description: manifest.description || '',
        enabled: true,
        installedAt: new Date().toISOString(),
      };
      
      setInstalledExtensions(prev => {
        const existing = prev.findIndex(e => e.id === extId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = installed;
          return updated;
        }
        return [...prev, installed];
      });
      
      await storeExtensionBlob(extId, blob);
      
    } catch (err: any) {
      setError(`Failed to install extension: ${err.message}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Uninstall extension
  const uninstallExtension = async (extId: string) => {
    try {
      // Remove from IndexedDB
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('nexus-extensions', 1);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction('extensions', 'readwrite');
          const store = transaction.objectStore('extensions');
          store.delete(extId);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      });
      
      setInstalledExtensions(prev => prev.filter(e => e.id !== extId));
    } catch (err: any) {
      setError(`Failed to uninstall: ${err.message}`);
    }
  };

  // Toggle extension enabled state
  const toggleExtension = (extId: string) => {
    setInstalledExtensions(prev => prev.map(e => 
      e.id === extId ? { ...e, enabled: !e.enabled } : e
    ));
  };

  // Initial load - get popular extensions
  useEffect(() => {
    searchExtensions('');
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchExtensions(searchQuery, categoryFilter);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    searchExtensions(searchQuery, category);
    setShowCategoryDropdown(false);
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-nexus-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-nexus-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Extensions</h2>
          </div>
          <button
            onClick={() => searchExtensions(searchQuery, categoryFilter)}
            disabled={isLoading}
            className="p-1.5 hover:bg-nexus-bg rounded text-nexus-text-muted hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {[
            { id: 'browse', label: 'Browse', icon: Search },
            { id: 'installed', label: 'Installed', icon: Package },
            { id: 'upload', label: 'Upload VSIX', icon: Upload },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-nexus-accent text-white"
                  : "bg-nexus-bg text-nexus-text-muted hover:text-white"
              )}
            >
              <tab.icon size={12} />
              {tab.label}
              {tab.id === 'installed' && installedExtensions.length > 0 && (
                <span className="bg-nexus-bg text-nexus-accent text-[10px] px-1.5 rounded-full">
                  {installedExtensions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar (for browse tab) */}
        {activeTab === 'browse' && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search extensions..."
                className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-nexus-text-muted focus:border-nexus-accent outline-none"
              />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-1 px-2 py-2 bg-nexus-bg border border-nexus-border rounded-lg text-xs text-nexus-text-muted hover:text-white"
              >
                <Filter size={12} />
                <ChevronDown size={12} />
              </button>
              {showCategoryDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-nexus-bg border border-nexus-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs hover:bg-nexus-sidebar transition-colors",
                        categoryFilter === cat.id ? "text-nexus-accent bg-nexus-sidebar" : "text-nexus-text-muted"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 bg-nexus-accent text-white rounded-lg text-xs font-medium hover:bg-nexus-accent/80 transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </form>
        )}

        {/* Upload Section */}
        {activeTab === 'upload' && (
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".vsix"
              onChange={handleVSIXUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-nexus-border rounded-lg text-nexus-text-muted hover:border-nexus-accent hover:text-white transition-colors"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              <span className="text-xs">{isLoading ? 'Installing...' : 'Click to upload .vsix file'}</span>
            </button>
            <p className="text-[10px] text-nexus-text-muted mt-2 text-center">
              Upload VSIX files from OpenVSX, VS Code Marketplace, or local builds
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Extension Detail View */}
        {selectedExtension ? (
          <ExtensionDetail
            extension={selectedExtension}
            isInstalled={installedExtensions.some(e => e.id === `${selectedExtension.namespace}.${selectedExtension.name}`)}
            isInstalling={installingExtension === `${selectedExtension.namespace}.${selectedExtension.name}`}
            onInstall={() => installExtension(selectedExtension)}
            onBack={() => setSelectedExtension(null)}
            getVersions={() => getExtensionVersions(selectedExtension.namespace, selectedExtension.name)}
          />
        ) : (
          <>
            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <>
                {isLoading && extensions.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 size={24} className="animate-spin text-nexus-accent" />
                  </div>
                ) : extensions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-nexus-text-muted">
                    <Package size={32} className="mb-2 opacity-50" />
                    <p className="text-xs">No extensions found</p>
                    <p className="text-[10px] opacity-75">Try a different search term</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {extensions.map((ext) => {
                      const extId = `${ext.namespace}.${ext.name}`;
                      const isInstalled = installedExtensions.some(e => e.id === extId);
                      const isInstalling = installingExtension === extId;
                      
                      return (
                        <ExtensionCard
                          key={extId}
                          extension={ext}
                          isInstalled={isInstalled}
                          isInstalling={isInstalling}
                          onClick={() => setSelectedExtension(ext)}
                          onInstall={() => installExtension(ext)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Installed Tab */}
            {activeTab === 'installed' && (
              <>
                {installedExtensions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-nexus-text-muted">
                    <Package size={32} className="mb-2 opacity-50" />
                    <p className="text-xs">No extensions installed</p>
                    <p className="text-[10px] opacity-75">Browse or upload extensions to get started</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {installedExtensions.map((ext) => (
                      <InstalledExtensionCard
                        key={ext.id}
                        extension={ext}
                        onToggle={() => toggleExtension(ext.id)}
                        onUninstall={() => uninstallExtension(ext.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-nexus-border bg-nexus-bg">
        <div className="flex items-center justify-between text-[10px] text-nexus-text-muted">
          <span>Powered by OpenVSX Registry</span>
          <a
            href="https://open-vsx.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-nexus-accent transition-colors"
          >
            <ExternalLink size={10} />
            open-vsx.org
          </a>
        </div>
      </div>
    </div>
  );
}

// Extension Card Component
function ExtensionCard({
  extension,
  isInstalled,
  isInstalling,
  onClick,
  onInstall,
}: {
  extension: OpenVSXExtension;
  isInstalled: boolean;
  isInstalling: boolean;
  onClick: () => void;
  onInstall: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-nexus-bg hover:bg-nexus-bg/80 rounded-lg cursor-pointer transition-colors group border border-transparent hover:border-nexus-border"
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-nexus-sidebar flex items-center justify-center overflow-hidden">
        {extension.iconUrl ? (
          <img src={extension.iconUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package size={20} className="text-nexus-text-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-white truncate">
            {extension.displayName || extension.name}
          </h3>
          {extension.averageRating && (
            <div className="flex items-center gap-0.5">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] text-nexus-text-muted">
                {extension.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-nexus-text-muted truncate mt-0.5">
          {extension.namespace} • {extension.version}
        </p>
        <p className="text-[10px] text-nexus-text-muted line-clamp-2 mt-1">
          {extension.description || 'No description available'}
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInstall();
        }}
        disabled={isInstalling || isInstalled}
        className={cn(
          "flex-shrink-0 p-1.5 rounded transition-colors",
          isInstalled
            ? "bg-green-500/20 text-green-400"
            : "bg-nexus-accent text-white hover:bg-nexus-accent/80",
          isInstalling && "opacity-50"
        )}
        title={isInstalled ? 'Installed' : 'Install'}
      >
        {isInstalling ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isInstalled ? (
          <Check size={14} />
        ) : (
          <Download size={14} />
        )}
      </button>
    </div>
  );
}

// Installed Extension Card Component
function InstalledExtensionCard({
  extension,
  onToggle,
  onUninstall,
}: {
  extension: InstalledExtension;
  onToggle: () => void;
  onUninstall: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-nexus-bg rounded-lg border border-nexus-border">
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-nexus-sidebar flex items-center justify-center overflow-hidden">
        {extension.iconUrl ? (
          <img src={extension.iconUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package size={20} className="text-nexus-text-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-white truncate">
            {extension.displayName}
          </h3>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[9px] font-medium",
            extension.enabled
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-500/20 text-gray-400"
          )}>
            {extension.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p className="text-[10px] text-nexus-text-muted mt-0.5">
          {extension.namespace} • v{extension.version}
        </p>
        <p className="text-[10px] text-nexus-text-muted mt-1">
          Installed {formatDate(extension.installedAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className={cn(
            "p-1.5 rounded transition-colors",
            extension.enabled
              ? "bg-nexus-sidebar text-green-400 hover:text-green-300"
              : "bg-nexus-sidebar text-nexus-text-muted hover:text-white"
          )}
          title={extension.enabled ? 'Disable' : 'Enable'}
        >
          {extension.enabled ? <Play size={12} /> : <Pause size={12} />}
        </button>
        <button
          onClick={onUninstall}
          className="p-1.5 bg-nexus-sidebar text-red-400 hover:bg-red-500/20 rounded transition-colors"
          title="Uninstall"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// Extension Detail Component
function ExtensionDetail({
  extension,
  isInstalled,
  isInstalling,
  onInstall,
  onBack,
  getVersions,
}: {
  extension: OpenVSXExtension;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: () => void;
  onBack: () => void;
  getVersions: () => Promise<ExtensionVersion[]>;
}) {
  const [versions, setVersions] = useState<ExtensionVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (showVersions && versions.length === 0) {
      setLoadingVersions(true);
      getVersions().then(v => {
        setVersions(v);
        setLoadingVersions(false);
      });
    }
  }, [showVersions, getVersions, versions.length]);

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-nexus-text-muted hover:text-white mb-4 transition-colors"
      >
        <ChevronDown size={14} className="rotate-90" />
        Back to list
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-nexus-bg flex items-center justify-center overflow-hidden border border-nexus-border">
          {extension.iconUrl ? (
            <img src={extension.iconUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package size={32} className="text-nexus-text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white">
            {extension.displayName || extension.name}
          </h2>
          <p className="text-xs text-nexus-text-muted mt-0.5">
            {extension.namespace}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {extension.averageRating && (
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-nexus-text-muted">
                  {extension.averageRating.toFixed(1)}
                </span>
              </div>
            )}
            {extension.downloadCount !== undefined && (
              <div className="flex items-center gap-1">
                <Download size={12} className="text-nexus-text-muted" />
                <span className="text-xs text-nexus-text-muted">
                  {extension.downloadCount.toLocaleString()}
                </span>
              </div>
            )}
            {extension.license && (
              <span className="text-[10px] text-nexus-text-muted bg-nexus-bg px-1.5 py-0.5 rounded">
                {extension.license}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Install Button */}
      <button
        onClick={onInstall}
        disabled={isInstalling || isInstalled}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-medium transition-colors mb-4",
          isInstalled
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-nexus-accent text-white hover:bg-nexus-accent/80",
          isInstalling && "opacity-50"
        )}
      >
        {isInstalling ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Installing...
          </span>
        ) : isInstalled ? (
          <span className="flex items-center justify-center gap-2">
            <Check size={14} />
            Installed
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Download size={14} />
            Install
          </span>
        )}
      </button>

      {/* Description */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-white mb-2">Description</h3>
        <p className="text-xs text-nexus-text-muted leading-relaxed">
          {extension.description || 'No description available'}
        </p>
      </div>

      {/* Version Info */}
      <div className="mb-4">
        <button
          onClick={() => setShowVersions(!showVersions)}
          className="w-full flex items-center justify-between py-2 border-b border-nexus-border"
        >
          <h3 className="text-xs font-medium text-white">Version {extension.version}</h3>
          <ChevronDown size={14} className={cn(
            "text-nexus-text-muted transition-transform",
            showVersions && "rotate-180"
          )} />
        </button>
        {showVersions && (
          <div className="mt-2 max-h-32 overflow-y-auto">
            {loadingVersions ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 size={14} className="animate-spin text-nexus-text-muted" />
              </div>
            ) : versions.length > 0 ? (
              <div className="space-y-1">
                {versions.map(v => (
                  <div
                    key={v.version}
                    className="flex items-center justify-between py-1 px-2 bg-nexus-bg rounded text-[10px]"
                  >
                    <span className="text-nexus-text-muted">v{v.version}</span>
                    <span className="text-nexus-text-muted">{formatDate(v.publishedDate)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-nexus-text-muted py-2">No version history available</p>
            )}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="space-y-2">
        {extension.repository && (
          <a
            href={extension.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-nexus-accent hover:underline"
          >
            <FileCode size={12} />
            Repository
          </a>
        )}
        {extension.homepage && (
          <a
            href={extension.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-nexus-accent hover:underline"
          >
            <ExternalLink size={12} />
            Homepage
          </a>
        )}
      </div>

      {/* Categories & Tags */}
      {(extension.categories?.length || extension.tags?.length) && (
        <div className="mt-4">
          <h3 className="text-xs font-medium text-white mb-2">Categories & Tags</h3>
          <div className="flex flex-wrap gap-1">
            {extension.categories?.map(cat => (
              <span key={cat} className="px-2 py-0.5 bg-nexus-bg rounded text-[10px] text-nexus-text-muted">
                {cat}
              </span>
            ))}
            {extension.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-nexus-accent/20 rounded text-[10px] text-nexus-accent">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
