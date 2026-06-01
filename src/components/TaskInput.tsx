import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader, Play, ChevronLeft, Zap } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import type { Task, SubTask } from '../types';
import { analyzeTask, isComplexResult } from '../ai/executor';
import type { DecomposedTaskSpec } from '../ai/executor';
import { useStore } from '../store';

interface TaskInputProps {
  onAdd: (task: Task) => void;
  onClose: () => void;
}

type Phase = 'input' | 'preview';

function genId() {
  return crypto.randomUUID();
}

const TYPE_LABELS: Record<string, string> = {
  email: 'メール',
  coding: 'コーディング',
  research: 'リサーチ',
  document: '文書',
  schedule: 'スケジュール',
};

const TYPE_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700',
  coding: 'bg-emerald-100 text-emerald-700',
  research: 'bg-purple-100 text-purple-700',
  document: 'bg-orange-100 text-orange-700',
  schedule: 'bg-indigo-100 text-indigo-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-500',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '高優先',
  medium: '中優先',
  low: '低優先',
};

export default function TaskInput({ onAdd, onClose }: TaskInputProps) {
  const { addTask, startQueue } = useStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('input');
  const [decomposedTasks, setDecomposedTasks] = useState<DecomposedTaskSpec[]>([]);
  const [projectName, setProjectName] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeTask(text.trim());

      if (isComplexResult(result)) {
        // Complex task → show decomposition preview
        const sorted = [...result.decomposedTasks].sort((a, b) => a.order - b.order);
        setDecomposedTasks(sorted);
        setProjectName(result.projectName);
        setPhase('preview');
      } else {
        // Simple task → immediate registration
        const subTasks: SubTask[] = (result.subTasks ?? []).map((t) => ({
          id: genId(),
          title: t,
          done: false,
        }));

        const task: Task = {
          id: genId(),
          title: text.trim().slice(0, 60),
          rawInput: text.trim(),
          type: result.taskType,
          status: 'ready',
          priority: result.priority,
          deadline: result.deadline ?? undefined,
          projectId: result.projectName || undefined,
          subTasks,
          createdAt: new Date().toISOString(),
        };

        onAdd(task);
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const taskIds: string[] = [];
      for (const spec of decomposedTasks) {
        const task: Task = {
          id: genId(),
          title: spec.title,
          rawInput: spec.rawInput,
          type: spec.type,
          status: 'ready',
          priority: spec.priority,
          deadline: spec.deadline,
          projectId: projectName || undefined,
          subTasks: [],
          createdAt: new Date().toISOString(),
        };
        await addTask(task);
        taskIds.push(task.id);
      }
      startQueue(taskIds);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAnalyze();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg z-10"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <GlassCard hover={false} className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {phase === 'preview' && (
                  <button
                    onClick={() => setPhase('input')}
                    className="text-slate-400 hover:text-slate-600 transition-colors mr-1"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <span className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                  <Sparkles size={14} />
                </span>
                <h2 className="font-bold text-slate-700">
                  {phase === 'input' ? '新規タスク' : 'タスク分解プレビュー'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Phase: input */}
            {phase === 'input' && (
              <>
                <div>
                  <p className="text-xs text-slate-400 mb-2">
                    自然言語で入力してください。AIが種別・優先度・期限を解析し、複合タスクは自動分解します。
                  </p>
                  <textarea
                    autoFocus
                    className="w-full text-sm bg-white/60 border border-slate-200/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 resize-none min-h-[120px] placeholder:text-slate-300"
                    placeholder="例：来月ウェビナーを開催したい。告知メール・スケジュール・資料の3点を準備して&#10;例：Aさんに提案書を来週月曜までに送る"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-300 mt-1 text-right">⌘+Enter で送信</p>
                </div>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-indigo-600"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader size={14} />
                    </motion.div>
                    部長AIがタスクを解析しています...
                  </motion.div>
                )}

                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-full transition-colors"
                    onClick={onClose}
                    disabled={loading}
                  >
                    キャンセル
                  </button>
                  <motion.button
                    className="btn-gradient rounded-full px-5 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    onClick={handleAnalyze}
                    disabled={loading || !text.trim()}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Sparkles size={13} />
                    {loading ? '解析中...' : 'AIで解析・登録'}
                  </motion.button>
                </div>
              </>
            )}

            {/* Phase: preview (complex task decomposition) */}
            {phase === 'preview' && (
              <>
                {projectName && (
                  <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-slate-400">プロジェクト</p>
                    <p className="text-sm font-bold text-indigo-700">{projectName}</p>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {decomposedTasks.map((spec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 bg-white/60 border border-slate-200/80 rounded-xl p-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold text-slate-700 leading-snug">{spec.title}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[spec.type] ?? 'bg-slate-100 text-slate-600'}`}>
                            {TYPE_LABELS[spec.type] ?? spec.type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[spec.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                            {PRIORITY_LABELS[spec.priority] ?? spec.priority}
                          </span>
                          {spec.deadline && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              {spec.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-full transition-colors"
                    onClick={() => setPhase('input')}
                    disabled={loading}
                  >
                    戻る
                  </button>
                  <motion.button
                    className="btn-gradient rounded-full px-5 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    onClick={handleAutoRun}
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader size={13} />
                        </motion.div>
                        登録中...
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        全自動実行 ({decomposedTasks.length}件)
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
