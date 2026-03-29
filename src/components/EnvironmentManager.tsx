import React, { useState } from 'react';
import { Globe, Server, Rocket, Plus, Trash2, Edit3, Check, X, GitCompare, ChevronDown, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface EnvVariable {
  key: string;
  value: string;
}

interface Environment {
  id: string;
  name: string;
  status: 'active' | 'healthy' | 'warning' | 'inactive';
  icon: React.ReactNode;
  color: string;
  variables: EnvVariable[];
  lastDeploy: string;
}

export default function EnvironmentManager() {
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: '1',
      name: 'Development',
      status: 'active',
      icon: <Server size={14} />,
      color: 'text-emerald-400',
      variables: [
        { key: 'NODE_ENV', value: 'development' },
        { key: 'API_URL', value: 'http://localhost:3001' },
        { key: 'DATABASE_URL', value: 'sqlite://dev.db' },
        { key: 'REDIS_URL', value: 'redis://localhost:6379' },
        { key: 'DEBUG', value: 'true' },
        { key: 'LOG_LEVEL', value: 'debug' },
      ],
      lastDeploy: '5 min ago',
    },
    {
      id: '2',
      name: 'Staging',
      status: 'healthy',
      icon: <Shield size={14} />,
      color: 'text-amber-400',
      variables: [
        { key: 'NODE_ENV', value: 'staging' },
        { key: 'API_URL', value: 'https://staging-api.nexus.dev' },
        { key: 'DATABASE_URL', value: 'postgresql://staging-db' },
        { key: 'REDIS_URL', value: 'redis://staging-redis:6379' },
        { key: 'DEBUG', value: 'false' },
        { key: 'LOG_LEVEL', value: 'info' },
      ],
      lastDeploy: '2 hrs ago',
    },
    {
      id: '3',
      name: 'Production',
      status: 'healthy',
      icon: <Globe size={14} />,
      color: 'text-violet-400',
      variables: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'API_URL', value: 'https://api.nexus.dev' },
        { key: 'DATABASE_URL', value: 'postgresql://prod-db-cluster' },
        { key: 'REDIS_URL', value: 'redis://prod-redis-cluster:6379' },
        { key: 'DEBUG', value: 'false' },
        { key: 'LOG_LEVEL', value: 'warn' },
      ],
      lastDeploy: '1 day ago',
    },
  ]);

  const [activeEnv, setActiveEnv] = useState<string>('1');
  const [expandedEnv, setExpandedEnv] = useState<string | null>('1');
  const [showComparison, setShowComparison] = useState(false);
  const [compareFrom, setCompareFrom] = useState('1');
  const [compareTo, setCompareTo] = useState('3');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddVar, setShowAddVar] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
    active: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30' },
    healthy: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    warning: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/30' },
    inactive: { color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' },
  };

  const activeEnvironment = environments.find(e => e.id === activeEnv);

  const handleAddVar = () => {
    if (!newKey.trim() || !activeEnv) return;
    setEnvironments(prev => prev.map(env =>
      env.id === activeEnv
        ? { ...env, variables: [...env.variables, { key: newKey, value: newValue }] }
        : env
    ));
    setNewKey('');
    setNewValue('');
    setShowAddVar(false);
  };

  const handleDeleteVar = (key: string) => {
    setEnvironments(prev => prev.map(env =>
      env.id === activeEnv
        ? { ...env, variables: env.variables.filter(v => v.key !== key) }
        : env
    ));
  };

  const handleEditVar = (key: string, value: string) => {
    setEnvironments(prev => prev.map(env =>
      env.id === activeEnv
        ? {
            ...env,
            variables: env.variables.map(v =>
              v.key === key ? { ...v, value } : v
            ),
          }
        : env
    ));
    setEditingKey(null);
  };

  const getDiffVars = () => {
    const fromEnv = environments.find(e => e.id === compareFrom);
    const toEnv = environments.find(e => e.id === compareTo);
    if (!fromEnv || !toEnv) return [];

    const diffs: { key: string; fromVal: string | null; toVal: string | null; type: 'changed' | 'added' | 'removed' }[] = [];

    const allKeys = new Set([...fromEnv.variables.map(v => v.key), ...toEnv.variables.map(v => v.key)]);
    allKeys.forEach(key => {
      const fromVar = fromEnv.variables.find(v => v.key === key);
      const toVar = toEnv.variables.find(v => v.key === key);
      if (!fromVar) {
        diffs.push({ key, fromVal: null, toVal: toVar?.value ?? '', type: 'added' });
      } else if (!toVar) {
        diffs.push({ key, fromVal: fromVar.value, toVal: null, type: 'removed' });
      } else if (fromVar.value !== toVar.value) {
        diffs.push({ key, fromVal: fromVar.value, toVal: toVar.value, type: 'changed' });
      }
    });

    return diffs;
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <Server size={16} className="text-nexus-accent" />
          Environments
        </h2>

        <div className="grid grid-cols-3 gap-1.5">
          {environments.map(env => (
            <button
              key={env.id}
              onClick={() => { setActiveEnv(env.id); setExpandedEnv(env.id); }}
              className={cn(
                'p-2 rounded-lg border text-center transition-all',
                activeEnv === env.id
                  ? 'border-nexus-accent/50 bg-nexus-accent/10'
                  : 'border-nexus-border bg-nexus-bg hover:border-nexus-accent/30'
              )}
            >
              <div className={cn('text-sm mb-0.5', env.color)}>{env.icon}</div>
              <div className="text-[9px] font-bold text-white uppercase">{env.name}</div>
              <div className={cn('text-[8px] font-bold uppercase', statusConfig[env.status].color)}>
                {env.status}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Environment Config */}
        {activeEnvironment && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} className="text-nexus-accent" />
                {activeEnvironment.name} Config
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-nexus-text-muted">Deployed: {activeEnvironment.lastDeploy}</span>
              </div>
            </div>

            {/* Variables Table */}
            <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-0 text-[9px] font-bold text-nexus-text-muted uppercase tracking-wider border-b border-nexus-border">
                <div className="p-2.5">Key</div>
                <div className="p-2.5">Value</div>
                <div className="p-2.5 text-right">Actions</div>
              </div>
              {activeEnvironment.variables.map(variable => (
                <div key={variable.key} className="grid grid-cols-[1fr_1fr_auto] gap-0 border-b border-nexus-border last:border-none hover:bg-nexus-sidebar transition-colors">
                  <div className="p-2.5">
                    <span className="text-[10px] text-nexus-accent font-mono font-bold">{variable.key}</span>
                  </div>
                  <div className="p-2.5">
                    {editingKey === variable.key ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="flex-1 bg-nexus-sidebar border border-nexus-accent rounded px-2 py-0.5 text-[10px] text-white font-mono outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditVar(variable.key, editValue)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-nexus-text-muted font-mono truncate block">{variable.value}</span>
                    )}
                  </div>
                  <div className="p-2.5 flex items-center justify-end gap-1">
                    {editingKey !== variable.key && (
                      <>
                        <button
                          onClick={() => { setEditingKey(variable.key); setEditValue(variable.value); }}
                          className="p-1 text-nexus-text-muted hover:text-white transition-colors"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteVar(variable.key)}
                          className="p-1 text-nexus-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Variable */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddVar(!showAddVar)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-nexus-bg hover:bg-nexus-bg/80 text-white rounded-lg text-[10px] font-bold transition-all border border-nexus-border uppercase tracking-widest"
              >
                <Plus size={12} />
                Add Variable
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest">
                <Rocket size={12} />
                Deploy to {activeEnvironment.name}
              </button>
            </div>

            {showAddVar && (
              <div className="p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    className="bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white font-mono outline-none focus:border-nexus-accent"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white font-mono outline-none focus:border-nexus-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddVar(false)}
                    className="flex-1 text-[10px] text-nexus-text-muted hover:text-white transition-colors uppercase font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddVar}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Environment Comparison */}
        <div className="space-y-3">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest w-full"
          >
            <GitCompare size={12} className="text-nexus-accent" />
            Environment Comparison
            {showComparison ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
          </button>

          {showComparison && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={compareFrom}
                  onChange={e => setCompareFrom(e.target.value)}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white outline-none focus:border-nexus-accent"
                >
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.name}</option>
                  ))}
                </select>
                <select
                  value={compareTo}
                  onChange={e => setCompareTo(e.target.value)}
                  className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white outline-none focus:border-nexus-accent"
                >
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
                {getDiffVars().length > 0 ? (
                  getDiffVars().map(diff => (
                    <div key={diff.key} className="p-2.5 border-b border-nexus-border last:border-none">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-nexus-accent font-mono font-bold">{diff.key}</span>
                        {diff.type === 'changed' && (
                          <span className="text-[9px] text-amber-400 font-bold uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">changed</span>
                        )}
                        {diff.type === 'added' && (
                          <span className="text-[9px] text-emerald-400 font-bold uppercase bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">added</span>
                        )}
                        {diff.type === 'removed' && (
                          <span className="text-[9px] text-red-400 font-bold uppercase bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30">removed</span>
                        )}
                      </div>
                      {diff.type !== 'added' && (
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="text-nexus-text-muted w-14 shrink-0">{environments.find(e => e.id === compareFrom)?.name}:</span>
                          <span className="text-red-400 font-mono line-through">{diff.fromVal}</span>
                        </div>
                      )}
                      {diff.type !== 'removed' && (
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="text-nexus-text-muted w-14 shrink-0">{environments.find(e => e.id === compareTo)?.name}:</span>
                          <span className="text-emerald-400 font-mono">{diff.toVal}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[10px] text-nexus-text-muted italic opacity-50">
                    No differences found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Environment Management
        </p>
      </div>
    </div>
  );
}
