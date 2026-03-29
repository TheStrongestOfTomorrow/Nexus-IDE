import React, { useState } from 'react';
import { GitPullRequest, Plus, CheckCircle2, XCircle, MessageSquare, FileDiff, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReviewComment {
  id: string;
  user: string;
  avatar: string;
  color: string;
  timestamp: string;
  text: string;
}

interface DiffFile {
  name: string;
  additions: number;
  deletions: number;
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  author: string;
  avatar: string;
  color: string;
  status: 'Open' | 'Merged' | 'Closed';
  branch: string;
  files: DiffFile[];
  additions: number;
  deletions: number;
  comments: ReviewComment[];
  timestamp: string;
}

export default function CodeReview() {
  const [reviews, setReviews] = useState<PullRequest[]>([
    {
      id: '1',
      number: 142,
      title: 'Add multi-environment support',
      author: 'Alex Chen',
      avatar: 'AC',
      color: 'bg-violet-500',
      status: 'Open',
      branch: 'feat/multi-env',
      files: [
        { name: 'src/config/env.ts', additions: 45, deletions: 3 },
        { name: 'src/lib/deploy.ts', additions: 22, deletions: 8 },
        { name: 'src/components/EnvManager.tsx', additions: 120, deletions: 0 },
      ],
      additions: 187,
      deletions: 11,
      comments: [
        { id: 'c1', user: 'Sarah Kim', avatar: 'SK', color: 'bg-emerald-500', timestamp: '2 hrs ago', text: 'Looks great! Maybe add validation for env variable names.' },
        { id: 'c2', user: 'Alex Chen', avatar: 'AC', color: 'bg-violet-500', timestamp: '1 hr ago', text: 'Good catch, I\'ll add a regex check.' },
      ],
      timestamp: '3 hrs ago',
    },
    {
      id: '2',
      number: 141,
      title: 'Fix WebSocket memory leak',
      author: 'Sarah Kim',
      avatar: 'SK',
      color: 'bg-emerald-500',
      status: 'Open',
      branch: 'fix/ws-leak',
      files: [
        { name: 'src/services/socket.ts', additions: 8, deletions: 15 },
        { name: 'src/hooks/useConnection.ts', additions: 5, deletions: 2 },
      ],
      additions: 13,
      deletions: 17,
      comments: [
        { id: 'c3', user: 'Mike Torres', avatar: 'MT', color: 'bg-blue-500', timestamp: '5 hrs ago', text: 'The cleanup logic in the useEffect is much cleaner now.' },
      ],
      timestamp: '6 hrs ago',
    },
    {
      id: '3',
      number: 139,
      title: 'Refactor authentication module',
      author: 'Mike Torres',
      avatar: 'MT',
      color: 'bg-blue-500',
      status: 'Merged',
      branch: 'refactor/auth',
      files: [
        { name: 'src/auth/provider.tsx', additions: 34, deletions: 28 },
        { name: 'src/auth/middleware.ts', additions: 12, deletions: 20 },
        { name: 'src/types/auth.ts', additions: 8, deletions: 0 },
      ],
      additions: 54,
      deletions: 48,
      comments: [
        { id: 'c4', user: 'Alex Chen', avatar: 'AC', color: 'bg-violet-500', timestamp: '1 day ago', text: 'Approved! Great refactor.' },
        { id: 'c5', user: 'Lisa Wang', avatar: 'LW', color: 'bg-amber-500', timestamp: '1 day ago', text: 'LGTM ✅' },
      ],
      timestamp: '1 day ago',
    },
    {
      id: '4',
      number: 137,
      title: 'Update dependency versions',
      author: 'James Park',
      avatar: 'JP',
      color: 'bg-rose-500',
      status: 'Closed',
      branch: 'chore/deps',
      files: [
        { name: 'package.json', additions: 18, deletions: 18 },
        { name: 'package-lock.json', additions: 1240, deletions: 1180 },
      ],
      additions: 1258,
      deletions: 1198,
      comments: [],
      timestamp: '3 days ago',
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const statusColors: Record<string, string> = {
    Open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Merged: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    Closed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const handleAction = (prId: string, action: 'approve' | 'request-changes') => {
    setReviews(prev => prev.map(pr =>
      pr.id === prId
        ? { ...pr, status: action === 'approve' ? 'Merged' : 'Closed' }
        : pr
    ));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <GitPullRequest size={16} className="text-nexus-accent" />
          Code Review
        </h2>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
        >
          <Plus size={14} />
          Create Review
        </button>

        {showCreate && (
          <div className="mt-3 p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-2 shadow-sm">
            <input
              type="text"
              placeholder="PR title"
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-2 text-[11px] outline-none text-white focus:border-nexus-accent"
            />
            <input
              type="text"
              placeholder="Branch name"
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-2 text-[11px] outline-none text-white focus:border-nexus-accent"
            />
            <textarea
              placeholder="Description..."
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-2 text-[11px] outline-none text-white focus:border-nexus-accent h-16 resize-none"
            />
            <button className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest">
              Submit for Review
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {/* Review Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-nexus-bg rounded-xl border border-nexus-border text-center shadow-sm">
            <div className="text-sm font-bold text-emerald-400">{reviews.filter(r => r.status === 'Open').length}</div>
            <div className="text-[9px] text-nexus-text-muted uppercase font-bold tracking-wider">Open</div>
          </div>
          <div className="p-2.5 bg-nexus-bg rounded-xl border border-nexus-border text-center shadow-sm">
            <div className="text-sm font-bold text-violet-400">{reviews.filter(r => r.status === 'Merged').length}</div>
            <div className="text-[9px] text-nexus-text-muted uppercase font-bold tracking-wider">Merged</div>
          </div>
          <div className="p-2.5 bg-nexus-bg rounded-xl border border-nexus-border text-center shadow-sm">
            <div className="text-sm font-bold text-red-400">{reviews.filter(r => r.status === 'Closed').length}</div>
            <div className="text-[9px] text-nexus-text-muted uppercase font-bold tracking-wider">Closed</div>
          </div>
        </div>

        {/* PR List */}
        <div className="space-y-2">
          {reviews.map(review => (
            <div key={review.id} className="bg-nexus-bg rounded-xl border border-nexus-border shadow-sm overflow-hidden">
              {/* PR Header */}
              <button
                onClick={() => toggleExpand(review.id)}
                className="w-full p-3 text-left hover:bg-nexus-bg/80 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: 'transparent', background: `linear-gradient(135deg, var(--color-nexus-accent), var(--color-nexus-accent-dark))` }}>
                    <GitPullRequest size={14} className="text-nexus-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-nexus-accent font-bold">#{review.number}</span>
                      <span className={cn('px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase', statusColors[review.status])}>
                        {review.status}
                      </span>
                      {expandedId === review.id ? <ChevronDown size={12} className="text-nexus-text-muted" /> : <ChevronRight size={12} className="text-nexus-text-muted" />}
                    </div>
                    <div className="text-[11px] font-bold text-white truncate">{review.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn('w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white', review.color)}>
                        {review.avatar}
                      </div>
                      <span className="text-[10px] text-nexus-text-muted">{review.author}</span>
                      <span className="text-[9px] text-nexus-text-muted">•</span>
                      <span className="text-[10px] text-nexus-text-muted">{review.branch}</span>
                      <span className="text-[9px] text-nexus-text-muted">•</span>
                      <span className="text-[9px] text-nexus-text-muted">{review.timestamp}</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Detail */}
              {expandedId === review.id && (
                <div className="border-t border-nexus-border p-3 space-y-3">
                  {/* Diff Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
                      <FileDiff size={12} className="text-nexus-accent" />
                      Changes
                    </div>
                    <div className="bg-nexus-sidebar rounded-lg p-2 space-y-1">
                      {review.files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="text-nexus-text-muted font-mono truncate flex-1">{file.name}</span>
                          <span className="text-emerald-400 font-bold">+{file.additions}</span>
                          <span className="text-red-400 font-bold">-{file.deletions}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 pt-1 border-t border-nexus-border">
                        <span className="text-[9px] text-nexus-text-muted font-bold">{review.files.length} files</span>
                        <span className="text-[9px] text-emerald-400 font-bold">+{review.additions}</span>
                        <span className="text-[9px] text-red-400 font-bold">-{review.deletions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
                      <MessageSquare size={12} className="text-nexus-accent" />
                      Comments ({review.comments.length})
                    </div>
                    {review.comments.length > 0 ? (
                      <div className="space-y-2">
                        {review.comments.map(comment => (
                          <div key={comment.id} className="bg-nexus-sidebar rounded-lg p-2.5 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white', comment.color)}>
                                {comment.avatar}
                              </div>
                              <span className="text-[10px] font-bold text-white">{comment.user}</span>
                              <span className="text-[9px] text-nexus-text-muted">{comment.timestamp}</span>
                            </div>
                            <p className="text-[10px] text-nexus-text-muted leading-relaxed pl-7">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-nexus-text-muted italic opacity-50 p-2">No comments yet</div>
                    )}
                  </div>

                  {/* Actions */}
                  {review.status === 'Open' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(review.id, 'approve')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest"
                      >
                        <ThumbsUp size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(review.id, 'request-changes')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-red-900/20 uppercase tracking-widest"
                      >
                        <ThumbsDown size={12} />
                        Request Changes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Code Review Engine
        </p>
      </div>
    </div>
  );
}
