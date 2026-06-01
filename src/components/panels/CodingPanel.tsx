import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, CheckCheck, AlertTriangle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import type { CodingResult } from '../../types';

function CopyButton({ text, label = 'コピー' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'コピー済み' : label}
    </button>
  );
}

interface CodingPanelProps {
  coding: CodingResult;
  onApprove: () => void;
}

export default function CodingPanel({ coding, onApprove }: CodingPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  const activeFile = coding.files[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard hover={false} className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/60 pb-3">
          <span className="text-base">💻</span>
          <h3 className="font-bold text-slate-700 text-sm">コーディング成果物</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed">{coding.description}</p>

        {/* File tabs */}
        {coding.files.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {coding.files.map((file, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-all ${
                  activeTab === i
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {file.filename}
              </button>
            ))}
          </div>
        )}

        {/* Code block */}
        {activeFile && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {activeFile.filename}
                </span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {activeFile.language}
                </span>
              </div>
              <CopyButton text={activeFile.content} label="コードをコピー" />
            </div>
            <pre className="code-block bg-slate-900 text-green-300 rounded-xl p-4 text-xs overflow-x-auto overflow-y-auto max-h-72 whitespace-pre leading-relaxed">
              {activeFile.content}
            </pre>
          </div>
        )}

        {/* Setup instructions */}
        {coding.setupInstructions && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">▼ 実行方法</p>
            <pre className="code-block bg-slate-800 text-amber-300 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap">
              {coding.setupInstructions}
            </pre>
          </div>
        )}

        {/* Risks */}
        {coding.risks && coding.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-slate-400">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {coding.risks.map((risk, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Approve */}
        <button
          className="btn-gradient rounded-full py-2 px-5 text-sm font-semibold w-full flex items-center justify-center gap-1.5"
          onClick={onApprove}
        >
          <CheckCheck size={14} />
          承認・完了
        </button>
      </GlassCard>
    </motion.div>
  );
}
