import { Plus, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onNewTask: () => void;
}

export default function Header({ onNewTask }: HeaderProps) {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header
      className="glass-card rounded-none border-l-0 border-r-0 border-t-0 px-6 py-4 flex items-center justify-between flex-shrink-0"
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
          <Cpu size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-none">AI Executive</h1>
          <p className="text-xs text-slate-400 mt-0.5">Task Manager</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-xs text-slate-400 hidden sm:block">{today}</p>
        <motion.button
          className="btn-gradient rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
          onClick={onNewTask}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={15} />
          新規タスク
        </motion.button>
      </div>
    </header>
  );
}
