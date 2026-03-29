import React, { useState } from 'react';
import { Users, UserPlus, Shield, Mail, Activity, ChevronDown, Crown, Code, Eye, Send } from 'lucide-react';
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

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Alex Chen', email: 'alex@nexus.dev', role: 'Admin', online: true, avatar: 'AC', color: 'bg-violet-500', joinedAt: 'Jan 15, 2025' },
    { id: '2', name: 'Sarah Kim', email: 'sarah@nexus.dev', role: 'Developer', online: true, avatar: 'SK', color: 'bg-emerald-500', joinedAt: 'Feb 3, 2025' },
    { id: '3', name: 'Mike Torres', email: 'mike@nexus.dev', role: 'Developer', online: false, avatar: 'MT', color: 'bg-blue-500', joinedAt: 'Feb 10, 2025' },
    { id: '4', name: 'Lisa Wang', email: 'lisa@nexus.dev', role: 'Viewer', online: true, avatar: 'LW', color: 'bg-amber-500', joinedAt: 'Mar 1, 2025' },
    { id: '5', name: 'James Park', email: 'james@nexus.dev', role: 'Developer', online: false, avatar: 'JP', color: 'bg-rose-500', joinedAt: 'Mar 8, 2025' },
  ]);

  const [activities] = useState<ActivityEntry[]>([
    { id: '1', user: 'Sarah Kim', action: 'joined the team', timestamp: '2 min ago', color: 'bg-emerald-500' },
    { id: '2', user: 'Alex Chen', action: 'edited src/App.tsx', timestamp: '15 min ago', color: 'bg-violet-500' },
    { id: '3', user: 'Mike Torres', action: 'pushed 3 commits', timestamp: '1 hr ago', color: 'bg-blue-500' },
    { id: '4', user: 'Lisa Wang', action: 'viewed dashboard', timestamp: '2 hrs ago', color: 'bg-amber-500' },
    { id: '5', user: 'James Park', action: 'edited src/utils.ts', timestamp: '3 hrs ago', color: 'bg-rose-500' },
    { id: '6', user: 'Alex Chen', action: 'deployed to staging', timestamp: '5 hrs ago', color: 'bg-violet-500' },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Developer' | 'Viewer'>('Developer');
  const [showInvite, setShowInvite] = useState(false);

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

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    const initials = inviteEmail.slice(0, 2).toUpperCase();
    const colors = ['bg-violet-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
    const newMember: TeamMember = {
      id: String(members.length + 1),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      online: false,
      avatar: initials,
      color: colors[Math.floor(Math.random() * colors.length)],
      joinedAt: 'Just now',
    };
    setMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    setShowInvite(false);
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
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400">{members.filter(m => m.online).length} online</span>
          </div>
          <div className="text-[10px] text-nexus-text-muted font-bold">
            {members.length} total
          </div>
        </div>

        <button
          onClick={() => setShowInvite(!showInvite)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
        >
          <UserPlus size={14} />
          Invite Member
        </button>

        {showInvite && (
          <div className="mt-3 p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-2 shadow-sm">
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
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest"
            >
              <Send size={12} />
              Send Invite
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Team Members */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Members</h3>
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
                    {member.online && (
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">Online</span>
                    )}
                  </div>
                  <span className="text-[10px] text-nexus-text-muted truncate block">{member.email}</span>
                </div>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase shrink-0',
                  roleColors[member.role]
                )}>
                  {roleIcons[member.role]}
                  {member.role}
                </div>
              </div>
            ))}
          </div>
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
            Recent Activity
          </h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
            {activities.map(entry => (
              <div key={entry.id} className="flex items-center gap-2.5 p-2.5 border-b border-nexus-border last:border-none hover:bg-nexus-sidebar transition-colors">
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0', entry.color)}>
                  {entry.user.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-white font-bold">{entry.user}</span>
                  <span className="text-[10px] text-nexus-text-muted"> {entry.action}</span>
                </div>
                <span className="text-[9px] text-nexus-text-muted shrink-0">{entry.timestamp}</span>
              </div>
            ))}
          </div>
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
