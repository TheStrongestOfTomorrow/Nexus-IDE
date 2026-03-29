import React, { useState } from 'react';
import { Shield, Search, Filter, Download, AlertTriangle, Info, AlertCircle, Clock, User, ChevronDown, FileEdit, Brain, Rocket, Lock, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

type ActionType = 'File Edit' | 'AI Query' | 'Deployment' | 'Access' | 'Settings Change';
type Severity = 'info' | 'warning' | 'critical';
type DateRange = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'All Time';

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  actionType: ActionType;
  target: string;
  status: 'success' | 'failure' | 'pending';
  severity: Severity;
  details: string;
}

export default function AuditLog() {
  const [logs] = useState<LogEntry[]>([
    { id: '1', timestamp: '2025-03-15 14:32:05', user: 'Alex Chen', actionType: 'File Edit', target: 'src/App.tsx', status: 'success', severity: 'info', details: 'User edited src/App.tsx — added responsive header layout' },
    { id: '2', timestamp: '2025-03-15 14:28:12', user: 'AI Assistant', actionType: 'AI Query', target: 'Claude Sonnet 4', status: 'success', severity: 'info', details: 'AI query to Claude Sonnet 4 — refactored authentication middleware' },
    { id: '3', timestamp: '2025-03-15 14:15:00', user: 'Alex Chen', actionType: 'Deployment', target: 'Production', status: 'success', severity: 'critical', details: 'Deployed to Production — v2.4.1 release with hotfix patches' },
    { id: '4', timestamp: '2025-03-15 13:45:33', user: 'Sarah Kim', actionType: 'File Edit', target: 'src/utils.ts', status: 'success', severity: 'info', details: 'User edited src/utils.ts — optimized debouncing functions' },
    { id: '5', timestamp: '2025-03-15 13:30:18', user: 'Mike Torres', actionType: 'Access', target: 'Environment Variables', status: 'success', severity: 'warning', details: 'Accessed Production environment variables — potential security review needed' },
    { id: '6', timestamp: '2025-03-15 12:55:41', user: 'Lisa Wang', actionType: 'Settings Change', target: 'Workspace Config', status: 'success', severity: 'info', details: 'Changed workspace default theme to Dark Mode Pro' },
    { id: '7', timestamp: '2025-03-15 12:20:09', user: 'Auto Deploy', actionType: 'Deployment', target: 'Staging', status: 'failure', severity: 'critical', details: 'Failed deployment to Staging — build error in src/components/Dashboard.tsx' },
    { id: '8', timestamp: '2025-03-15 11:48:22', user: 'James Park', actionType: 'AI Query', target: 'GPT-4o', status: 'success', severity: 'info', details: 'AI query to GPT-4o — generated unit tests for payment module' },
    { id: '9', timestamp: '2025-03-15 11:15:00', user: 'Alex Chen', actionType: 'Settings Change', target: 'Team Permissions', status: 'success', severity: 'warning', details: 'Updated team permissions — promoted Sarah Kim to Admin role' },
    { id: '10', timestamp: '2025-03-15 10:42:15', user: 'Sarah Kim', actionType: 'File Edit', target: 'prisma/schema.prisma', status: 'success', severity: 'info', details: 'User edited prisma/schema.prisma — added AuditLog model' },
    { id: '11', timestamp: '2025-03-15 10:10:30', user: 'Unknown User', actionType: 'Access', target: 'Admin Panel', status: 'failure', severity: 'critical', details: 'Unauthorized access attempt to Admin Panel — IP blocked' },
    { id: '12', timestamp: '2025-03-15 09:35:00', user: 'Mike Torres', actionType: 'Deployment', target: 'Development', status: 'success', severity: 'info', details: 'Deployed to Development — latest branch feat/websocket-v2' },
    { id: '13', timestamp: '2025-03-14 22:15:44', user: 'AI Assistant', actionType: 'AI Query', target: 'Claude Sonnet 4', status: 'success', severity: 'info', details: 'AI query to Claude Sonnet 4 — code review for PR #141' },
    { id: '14', timestamp: '2025-03-14 20:00:00', user: 'System', actionType: 'Settings Change', target: 'Auto-backup', status: 'success', severity: 'info', details: 'Scheduled auto-backup completed — 2.3GB compressed' },
    { id: '15', timestamp: '2025-03-14 18:30:12', user: 'Alex Chen', actionType: 'File Edit', target: '.env.production', status: 'success', severity: 'warning', details: 'User edited .env.production — updated API keys (security-sensitive)' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionType | 'All'>('All');
  const [dateFilter, setDateFilter] = useState<DateRange>('All Time');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');

  const actionTypes: ActionType[] = ['File Edit', 'AI Query', 'Deployment', 'Access', 'Settings Change'];
  const dateRanges: DateRange[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'];

  const actionIcons: Record<ActionType, React.ReactNode> = {
    'File Edit': <FileEdit size={12} />,
    'AI Query': <Brain size={12} />,
    'Deployment': <Rocket size={12} />,
    'Access': <Lock size={12} />,
    'Settings Change': <Settings size={12} />,
  };

  const severityConfig: Record<Severity, { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
    info: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: <Info size={12} /> },
    warning: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: <AlertTriangle size={12} /> },
    critical: { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: <AlertCircle size={12} /> },
  };

  const statusColors: Record<string, string> = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failure: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const filterLogs = () => {
    return logs.filter(log => {
      const matchesSearch = searchQuery === '' ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = actionFilter === 'All' || log.actionType === actionFilter;
      const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;

      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = log.timestamp.startsWith('2025-03-15');
      } else if (dateFilter === 'Last 7 Days') {
        matchesDate = log.timestamp >= '2025-03-09';
      } else if (dateFilter === 'Last 30 Days') {
        matchesDate = log.timestamp >= '2025-02-14';
      }

      return matchesSearch && matchesAction && matchesSeverity && matchesDate;
    });
  };

  const filteredLogs = filterLogs();

  const handleExport = () => {
    const csv = [
      'Timestamp,User,Action Type,Target,Status,Severity,Details',
      ...filteredLogs.map(l => `"${l.timestamp}","${l.user}","${l.actionType}","${l.target}","${l.status}","${l.severity}","${l.details}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-audit-log.csv';
    a.click();
    URL.revokeObjectURL(url);
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
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value as ActionType | 'All')}
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-7 pr-2 py-1.5 text-[10px] outline-none text-white focus:border-nexus-accent appearance-none"
            >
              <option value="All">All Actions</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
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

        {/* Severity Filter */}
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
          <span className="text-[10px] text-nexus-text-muted font-bold">{filteredLogs.length} entries</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-emerald-400 font-bold">{logs.filter(l => l.status === 'success').length} success</span>
            <span className="text-[9px] text-red-400 font-bold">{logs.filter(l => l.status === 'failure').length} failure</span>
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
                      <span className="text-[10px] font-bold text-white">{log.details.split(' — ')[0]}</span>
                      <span className={cn('px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase', statusColors[log.status])}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-nexus-text-muted leading-relaxed">{log.details.split(' — ')[1] || log.details}</p>
                    <div className="flex items-center gap-2 text-[9px] text-nexus-text-muted">
                      <span className="flex items-center gap-1">
                        <User size={9} />
                        {log.user}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {actionIcons[log.actionType]}
                        {log.actionType}
                      </span>
                      <span>•</span>
                      <span className="text-nexus-accent font-bold">{log.target}</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-nexus-text-muted shrink-0 text-right">
                    {log.timestamp.split(' ')[1]}
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

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Compliance Audit Trail
        </p>
      </div>
    </div>
  );
}
