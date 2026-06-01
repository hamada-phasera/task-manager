import { Mail, Code, Search, FileText, Calendar, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from './ui/GlassCard';
import type { Task } from '../types';

const TYPE_ICON: Record<Task['type'], React.ReactNode> = {
  email: <Mail size={18} />,
  coding: <Code size={18} />,
  research: <Search size={18} />,
  document: <FileText size={18} />,
  schedule: <Calendar size={18} />,
};

const TYPE_COLOR: Record<Task['type'], string> = {
  email: 'bg-blue-100 text-blue-700',
  coding: 'bg-violet-100 text-violet-700',
  research: 'bg-emerald-100 text-emerald-700',
  document: 'bg-orange-100 text-orange-700',
  schedule: 'bg-pink-100 text-pink-700',
};

const PRIORITY_BADGE: Record<Task['priority'], string> = {
  high: 'bg-rose-100 text-rose-700 border border-rose-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

function deadlineLabel(deadline?: string): { text: string; cls: string } | null {
  if (!deadline) return null;
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return { text: '期限超過', cls: 'text-rose-600 font-semibold' };
  if (diff === 0) return { text: '今日まで', cls: 'text-orange-600 font-semibold' };
  return { text: `${diff}日後`, cls: 'text-slate-500' };
}

interface TaskCardProps {
  task: Task;
  onExecute: (task: Task) => void;
  isExecuting: boolean;
}

export default function TaskCard({ task, onExecute, isExecuting }: TaskCardProps) {
  const dl = deadlineLabel(task.deadline);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`p-1.5 rounded-lg ${TYPE_COLOR[task.type]} flex-shrink-0`}>
              {TYPE_ICON[task.type]}
            </span>
            <span className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">
              {task.title}
            </span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          {task.projectId && (
            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-medium truncate max-w-[120px]">
              {task.projectId}
            </span>
          )}
          {dl && <span className={`ml-auto ${dl.cls}`}>{dl.text}</span>}
        </div>

        {/* Execute button */}
        <motion.button
          className="btn-gradient rounded-full py-2 px-4 text-sm font-semibold w-full flex items-center justify-center gap-1.5"
          onClick={() => onExecute(task)}
          disabled={isExecuting}
          whileTap={{ scale: 0.97 }}
        >
          <Zap size={14} />
          {isExecuting ? '実行中...' : '実 行'}
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}
