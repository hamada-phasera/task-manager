import { LayoutDashboard, FolderOpen, CheckSquare } from 'lucide-react';
import { useStore } from '../../store';
import type { ProjectMemory } from '../../types';

interface SidebarProps {
  projects: ProjectMemory[];
}

const NAV = [
  { key: 'dashboard' as const, icon: <LayoutDashboard size={16} />, label: 'ダッシュボード' },
  { key: 'projects' as const, icon: <FolderOpen size={16} />, label: 'プロジェクト' },
  { key: 'done' as const, icon: <CheckSquare size={16} />, label: '完了タスク' },
];

export default function Sidebar({ projects }: SidebarProps) {
  const { sidebarPage, setSidebarPage } = useStore();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
      {NAV.map((item) => (
        <button
          key={item.key}
          onClick={() => setSidebarPage(item.key)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
            sidebarPage === item.key
              ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 border border-indigo-200/60'
              : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}

      {/* Projects list */}
      {projects.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider px-3 mb-2">
            プロジェクト
          </p>
          {projects.map((p) => (
            <div
              key={p.projectId}
              className="px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-white/40 transition-colors cursor-default"
            >
              <p className="font-medium text-slate-600 truncate">{p.projectName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                    style={{ width: `${p.currentProgress}%` }}
                  />
                </div>
                <span className="text-slate-400">{p.currentProgress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
