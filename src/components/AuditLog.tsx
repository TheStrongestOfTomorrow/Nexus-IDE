import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, Search, Filter, Download, AlertTriangle, Info, AlertCircle, Clock, User, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

type Severity = 'info' | 'warning' | 'critical';
type DateRange = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'All Time';

interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  action: string;
  target: string;
  severity: Severity;
  source: string;
}

const STORAGE_KEY = 'nexus_audit_log';
const MAX_ENTRIES = 500;

const NEXUS_AUDIT_EVENT = 'nexus-audit';

interface NexusAuditDetail {
  action: string;
  target: string;
  severity: Severity;
}

function loadLog(): LogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLog(entries: LogEntry[]) {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function createEntry(action: string, target: string, severity: Severity, source: string): LogEntry {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(),
    action,
    target,
    severity,
    source,
  };
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export default function AuditLog() {
  const [logs, setLogs] = useState<LogEntry[]>(loadLog);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>('All Time');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Persist logs
  useEffect(() => {
    saveLog(logs);
  }, [logs]);

  // Log session start on mount
  useEffect(() => {
    setLogs(prev => {
      // Don't log duplicate session starts
      const lastEntry = prev[0];
      if (lastEntry && lastEntry.action === 'IDE Session Started' && lastEntry.severity === 'info') {
        return prev;
      }
      return [createEntry('IDE Session Started', 'Nexus IDE', 'info', 'System'), ...prev];
    });
  }, []);

  // Listen for custom audit events
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<NexusAuditDetail>).detail;
      if (detail && detail.action) {
        setLogs(prev => [
          createEntry(detail.action, detail.target || '', detail.severity || 'info', 'External'),
          ...prev,
        ]);
      }
    };
    window.addEventListener(NEXUS_AUDIT_EVENT, handler);
    return () => window.removeEventListener(NEXUS_AUDIT_EVENT, handler);
  }, []);

  const severityConfig: Record<Severity, { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
    info: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: <Info size={12} /> },
    warning: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: <AlertTriangle size={12} /> },
    critical: { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: <AlertCircle size={12} /> },
  };

  const dateRanges: DateRange[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'];

  // Filter logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 86400000;
    const thirtyDaysAgo = todayStart - 30 * 86400000;

    return logs.filter(log => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = log.action.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q) ||
          log.source.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Severity
      if (severityFilter !== 'All' && log.severity !== severityFilter) return false;

      // Date
      const logTime = new Date(log.timestamp).getTime();
      if (dateFilter === 'Today' && logTime < todayStart) return false;
      if (dateFilter === 'Last 7 Days' && logTime < sevenDaysAgo) return false;
      if (dateFilter === 'Last 30 Days' && logTime < thirtyDaysAgo) return false;

      return true;
    });
  }, [logs, searchQuery, severityFilter, dateFilter]);

  const infoCount = filteredLogs.filter(l => l.severity === 'info').length;
  const warningCount = filteredLogs.filter(l => l.severity === 'warning').length;
  const criticalCount = filteredLogs.filter(l => l.severity === 'critical').length;

  const handleExport = () => {
    const csv = [
      'Timestamp,Action,Target,Severity,Source',
      ...filteredLogs.map(l => `"${l.timestamp}","${l.action}","${l.target}","${l.severity}","${l.source}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLog = () => {
    setLogs([]);
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Shield size={16} className="text-nexus-accent" />
          Audit Log
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-8 pr-3 py-2 text-[11px] outline-none text-white focus:border-nexus-accent placeholder:text-nexus-text-muted/50"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Filter size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as Severity | 'All')}
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-7 pr-2 py-1.5 text-[10px] outline-none text-white focus:border-nexus-accent appearance-none"
            >
              <option value="All">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-nexus-text-muted pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <Clock size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateRange)}
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-7 pr-2 py-1.5 text-[10px] outline-none text-white focus:border-nexus-accent appearance-none"
            >
              {dateRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-nexus-text-muted pointer-events-none" />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-nexus-bg hover:bg-nexus-bg/80 text-nexus-text-muted hover:text-white rounded-lg text-[10px] font-bold transition-colors border border-nexus-border shrink-0"
            title="Export CSV"
          >
            <Download size={12} />
          </button>
        </div>

        {/* Severity Quick Filters */}
        <div className="flex gap-1.5">
          {(['All', 'info', 'warning', 'critical'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                'flex-1 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all',
                severityFilter === sev
                  ? sev === 'All'
                    ? 'border-nexus-accent/50 bg-nexus-accent/10 text-nexus-accent'
                    : `${severityConfig[sev as Severity].borderColor} ${severityConfig[sev as Severity].bgColor} ${severityConfig[sev as Severity].color}`
                  : 'border-nexus-border bg-nexus-bg text-nexus-text-muted hover:text-white'
              )}
            >
              {sev === 'All' ? 'All' : ''}
              {sev === 'info' && 'Info'}
              {sev === 'warning' && 'Warn'}
              {sev === 'critical' && 'Critical'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {/* Results Count */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-nexus-text-muted font-bold">{filteredLogs.length} of {logs.length} entries</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-blue-400 font-bold">{infoCount} info</span>
            <span className="text-[9px] text-amber-400 font-bold">{warningCount} warn</span>
            <span className="text-[9px] text-red-400 font-bold">{criticalCount} crit</span>
          </div>
        </div>

        {/* Log Entries */}
        <div className="space-y-1.5">
          {filteredLogs.map(log => {
            const sevConfig = severityConfig[log.severity];
            return (
              <div key={log.id} className="bg-nexus-bg rounded-xl border border-nexus-border p-3 shadow-sm hover:border-nexus-accent/20 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', sevConfig.bgColor, sevConfig.borderColor, 'border')}>
                    <div className={sevConfig.color}>{sevConfig.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-white">{log.action}</span>
                      {log.target && (
                        <span className="text-[9px] text-nexus-accent font-bold bg-nexus-accent/10 px-1.5 py-0.5 rounded border border-nexus-accent/20">
                          {log.target}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-nexus-text-muted">
                      <span className="flex items-center gap-1">
                        <User size={9} />
                        {log.source}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={9} />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Search size={24} className="text-nexus-text-muted opacity-30" />
            <p className="text-[10px] text-nexus-text-muted italic opacity-50">No matching entries found</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg space-y-2">
        {showClearConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 text-[10px] text-nexus-text-muted hover:text-white transition-colors uppercase font-bold text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleClearLog}
              className="flex-1 text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-bold text-center"
            >
              Confirm Clear
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={logs.length === 0}
            className="w-full flex items-center justify-center gap-1.5 text-[9px] text-nexus-text-muted hover:text-red-400 transition-colors uppercase font-bold disabled:opacity-30"
          >
            <Trash2 size={10} />
            Clear Audit Log
          </button>
        )}
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Compliance Audit Trail
        </p>
      </div>
    </div>
  );
}
