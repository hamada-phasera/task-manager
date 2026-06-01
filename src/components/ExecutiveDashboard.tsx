import { AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';
import type { Task } from '../types';

const COLUMNS: { key: Task['status'][]; label: string; count?: number }[] = [
  { key: ['pending'], label: '承認待ち' },
  { key: ['ready', 'in_progress'], label: '実行可能' },
  { key: ['blocked'], label: '要判断・ブロック中' },
];

interface ExecutiveDashboardProps {
  tasks: Task[];
  onExecute: (task: Task) => void;
  executingTaskId: string | null;
  onViewResult: (task: Task) => void;
}

export default function ExecutiveDashboard({
  tasks,
  onExecute,
  executingTaskId,
  onViewResult,
}: ExecutiveDashboardProps) {
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="space-y-6">
      {/* Status summary */}
      <div className="flex gap-3 text-xs text-slate-500 font-medium flex-wrap">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => col.key.includes(t.status)).length;
          return (
            <span key={col.label} className="bg-white/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/80">
              {col.label}
              <span className="ml-1.5 font-bold text-indigo-600">{count}</span>
            </span>
          );
        })}
        {doneTasks.length > 0 && (
          <span className="bg-white/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/80">
            完了
            <span className="ml-1.5 font-bold text-emerald-600">{doneTasks.length}</span>
          </span>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => col.key.includes(t.status));
          return (
            <div key={col.label} className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                {col.label}
                <span className="ml-2 font-normal normal-case">({colTasks.length})</span>
              </h2>
              <div className="space-y-3 min-h-[80px]">
                <AnimatePresence>
                  {colTasks.length === 0 ? (
                    <div className="text-xs text-slate-300 text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                      なし
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onExecute={onExecute}
                        isExecuting={executingTaskId === task.id}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Done tasks (clickable to view result) */}
      {doneTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            完了済み ({doneTasks.length})
          </h2>
          <div className="space-y-1.5">
            {doneTasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                className={`w-full flex items-center gap-2 text-sm text-slate-400 px-2 py-1 rounded-lg text-left transition-colors ${
                  task.executionResult
                    ? 'hover:bg-white/60 hover:text-slate-600 cursor-pointer'
                    : 'cursor-default'
                }`}
                onClick={() => task.executionResult && onViewResult(task)}
                disabled={!task.executionResult}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="line-through flex-1 min-w-0 truncate">{task.title}</span>
                {task.executionResult && (
                  <span className="text-xs text-indigo-400 flex-shrink-0 no-underline" style={{ textDecoration: 'none' }}>
                    確認
                  </span>
                )}
              </button>
            ))}
            {doneTasks.length > 5 && (
              <p className="text-xs text-slate-300 px-2">他 {doneTasks.length - 5} 件...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
