import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle, Loader } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import type { AgentStep } from '../types';

const STEP_LABELS: Record<string, string> = {
  orchestrator: '部長AI',
  manager: '課長AI',
  executor: '社員AI',
};

function StepIcon({ status }: { status: AgentStep['status'] }) {
  if (status === 'done') return <CheckCircle size={18} className="text-emerald-500" />;
  if (status === 'error') return <AlertCircle size={18} className="text-rose-500" />;
  if (status === 'running') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader size={18} className="text-indigo-500" />
      </motion.div>
    );
  }
  return <Circle size={18} className="text-slate-300" />;
}

interface AIStatusDisplayProps {
  steps: AgentStep[];
  error?: string | null;
}

export default function AIStatusDisplay({ steps, error }: AIStatusDisplayProps) {
  return (
    <GlassCard hover={false} className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🏢</span>
        <span className="font-semibold text-slate-700 text-sm">組織が動いています...</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {steps.map((step, i) => (
            <motion.div
              key={step.role}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 text-sm transition-all ${
                step.status === 'pending' ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <StepIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <span className={`font-medium ${
                  step.status === 'running' ? 'text-indigo-600' :
                  step.status === 'done' ? 'text-slate-700' :
                  step.status === 'error' ? 'text-rose-600' :
                  'text-slate-400'
                }`}>
                  {STEP_LABELS[step.role]}
                </span>
                <span className="text-slate-400 ml-1">：{step.label.split('：')[1] ?? step.label}</span>
              </div>
              {step.status === 'running' && (
                <motion.div
                  className="flex gap-0.5"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      className="w-1 h-1 rounded-full bg-indigo-400"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ delay: d * 0.15, duration: 0.6, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700"
        >
          {error}
        </motion.div>
      )}
    </GlassCard>
  );
}
