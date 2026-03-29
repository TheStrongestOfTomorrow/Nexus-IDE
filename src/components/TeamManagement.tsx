import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, Mail, Activity, ChevronDown, Crown, Code, Eye, Send, Trash2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Developer' | 'Viewer';
  online: boolean;
  avatar: string;
  color: string;
  joinedAt: string;
}

interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  color: string;
}

const STORAGE_KEY = 'nexus_team';
const COLOR_PALETTE = [
  'bg-violet-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
  'bg-pink-500', 'bg-lime-500',
];

function loadTeamFromStorage(): TeamMember[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTeamToStorage(members: TeamMember[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function pickColor(): string {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>(loadTeamFromStorage);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Developer' | 'Viewer'>('Developer');
  const [showInvite, setShowInvite] = useState(false);

  // Persist to localStorage whenever members change
  useEffect(() => {
    saveTeamToStorage(members);
  }, [members]);

  // Track online status
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const addActivity = useCallback((user: string, action: string, color: string) => {
    setActivities(prev => [{
      id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
      user,
      action,
      timestamp: 'Just now',
      color,
    }, ...prev.slice(0, 49)]);
  }, []);

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    const initials = inviteName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || inviteEmail.slice(0, 2).toUpperCase();
    const newColor = pickColor();
    const now = new Date();
    const newMember: TeamMember = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      online: false,
      avatar: initials,
      color: newColor,
      joinedAt: formatDateTime(now),
    };
    setMembers(prev => [...prev, newMember]);
    addActivity(inviteName.trim(), 'joined the team', newColor);
    setInviteName('');
    setInviteEmail('');
    setShowInvite(false);
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMembers(prev => prev.filter(m => m.id !== member.id));
    addActivity(member.name, 'was removed from the team', member.color);
  };

  const handleChangeRole = (member: TeamMember, newRole: 'Admin' | 'Developer' | 'Viewer') => {
    setMembers(prev => prev.map(m =>
      m.id === member.id ? { ...m, role: newRole } : m
    ));
    addActivity(member.name, `role changed to ${newRole}`, member.color);
  };

  const roleColors: Record<string, string> = {
    Admin: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    Developer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Viewer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const roleIcons: Record<string, React.ReactNode> = {
    Admin: <Crown size={10} />,
    Developer: <Code size={10} />,
    Viewer: <Eye size={10} />,
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Users size={16} className="text-nexus-accent" />
          Team Management
        </h2>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <Wifi size={12} className="text-emerald-400" />
            ) : (
              <WifiOff size={12} className="text-red-400" />
            )}
            <span className={cn('text-[10px] font-bold', isOnline ? 'text-emerald-400' : 'text-red-400')}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400">{members.length} member{members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <button
          onClick={() => setShowInvite(!showInvite)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
        >
          <UserPlus size={14} />
          Add Member
        </button>

        {showInvite && (
          <div className="mt-3 p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-2 shadow-sm">
            <input
              type="text"
              placeholder="Full name"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-2 text-[11px] outline-none text-white focus:border-nexus-accent"
            />
            <div className="relative">
              <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg pl-8 pr-3 py-2 text-[11px] outline-none text-white focus:border-nexus-accent"
              />
            </div>
            <div className="relative">
              <Shield size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'Admin' | 'Developer' | 'Viewer')}
                className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg pl-8 pr-3 py-2 text-[11px] outline-none text-white focus:border-nexus-accent appearance-none"
              >
                <option value="Admin">Admin</option>
                <option value="Developer">Developer</option>
                <option value="Viewer">Viewer</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted pointer-events-none" />
            </div>
            <button
              onClick={handleInvite}
              disabled={!inviteName.trim() || !inviteEmail.trim()}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest disabled:opacity-50"
            >
              <Send size={12} />
              Add Member
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Team Members */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Members</h3>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Users size={24} className="text-nexus-text-muted opacity-30" />
              <p className="text-[10px] text-nexus-text-muted italic opacity-50">No team members yet. Add someone to get started.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2.5 bg-nexus-bg rounded-xl border border-nexus-border hover:border-nexus-accent/30 transition-all shadow-sm group"
                >
                  <div className="relative">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white', member.color)}>
                      {member.avatar}
                    </div>
                    <div className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-nexus-bg',
                      member.online ? 'bg-emerald-400' : 'bg-gray-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white truncate">{member.name}</span>
                    </div>
                    <span className="text-[10px] text-nexus-text-muted truncate block">{member.email}</span>
                    <span className="text-[9px] text-nexus-text-muted">Joined: {member.joinedAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={member.role}
                      onChange={e => handleChangeRole(member, e.target.value as 'Admin' | 'Developer' | 'Viewer')}
                      className={cn(
                        'px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase bg-transparent appearance-none cursor-pointer outline-none pr-5',
                        roleColors[member.role]
                      )}
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Developer">Developer</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-1 text-nexus-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Legend */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Role Permissions</h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
            {[
              { role: 'Admin', desc: 'Full access: manage members, settings, deployments', color: roleColors.Admin, icon: <Crown size={12} /> },
              { role: 'Developer', desc: 'Code access: edit files, push commits, run pipelines', color: roleColors.Developer, icon: <Code size={12} /> },
              { role: 'Viewer', desc: 'Read-only: view files, dashboards, and logs', color: roleColors.Viewer, icon: <Eye size={12} /> },
            ].map(item => (
              <div key={item.role} className="p-3 border-b border-nexus-border last:border-none">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase', item.color)}>
                    {item.icon}
                    {item.role}
                  </div>
                </div>
                <p className="text-[10px] text-nexus-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-nexus-accent" />
            Session Activity
          </h3>
          {activities.length === 0 ? (
            <div className="bg-nexus-bg rounded-xl border border-nexus-border p-4 shadow-sm">
              <p className="text-[10px] text-nexus-text-muted italic opacity-50 text-center">No activity this session</p>
            </div>
          ) : (
            <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm max-h-48 overflow-y-auto no-scrollbar">
              {activities.map(entry => (
                <div key={entry.id} className="flex items-center gap-2.5 p-2.5 border-b border-nexus-border last:border-none hover:bg-nexus-sidebar transition-colors">
                  <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0', entry.color)}>
                    {entry.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white font-bold">{entry.user}</span>
                    <span className="text-[10px] text-nexus-text-muted"> {entry.action}</span>
                  </div>
                  <span className="text-[9px] text-nexus-text-muted shrink-0">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Enterprise Team Management
        </p>
      </div>
    </div>
  );
}
