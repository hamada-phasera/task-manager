import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, CheckCheck, AlertTriangle, RotateCcw, ChevronRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import type { DocumentResult } from '../../types';

function CopyButton({ text }: { text: string }) {
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
      {copied ? 'コピー済み' : '全文コピー'}
    </button>
  );
}

interface DocumentPanelProps {
  document: DocumentResult;
  onRefinement: (request: string) => void;
  onApprove: () => void;
  isRefining: boolean;
}

export default function DocumentPanel({ document: doc, onRefinement, onApprove, isRefining }: DocumentPanelProps) {
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementText, setRefinementText] = useState('');

  const handleRefinement = () => {
    if (!refinementText.trim()) return;
    onRefinement(refinementText.trim());
    setRefinementText('');
    setShowRefinement(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard hover={false} className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/60 pb-3">
          <span className="text-base">📄</span>
          <h3 className="font-bold text-slate-700 text-sm">文書成果物</h3>
          <div className="ml-auto">
            <CopyButton text={`# ${doc.title}\n\n${doc.content}`} />
          </div>
        </div>

        {/* Title & Summary */}
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-base">{doc.title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{doc.summary}</p>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">▼ 文書本文</p>
          <pre className="code-block bg-slate-50 rounded-xl p-4 text-xs text-slate-700 whitespace-pre-wrap border border-slate-200/80 max-h-72 overflow-y-auto leading-relaxed font-sans">
            {doc.content}
          </pre>
        </div>

        {/* Risks */}
        {doc.risks && doc.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-slate-400">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {doc.risks.map((risk, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Refinement */}
        {showRefinement && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <textarea
              className="w-full text-sm bg-white/60 border border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 min-h-[72px] resize-none"
              placeholder="修正内容を入力（例：もっと具体的なデータを入れて）"
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg"
                onClick={() => setShowRefinement(false)}
              >
                キャンセル
              </button>
              <button
                className="btn-gradient text-xs rounded-lg px-4 py-1.5 flex items-center gap-1"
                onClick={handleRefinement}
                disabled={isRefining || !refinementText.trim()}
              >
                <ChevronRight size={12} />
                {isRefining ? '修正中...' : '再生成'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-full px-4 py-2 hover:bg-white/60 transition-all"
            onClick={() => setShowRefinement(!showRefinement)}
          >
            <RotateCcw size={13} />
            修正依頼
          </button>
          <button
            className="btn-gradient rounded-full px-5 py-2 text-sm font-semibold flex-1 flex items-center justify-center gap-1.5"
            onClick={onApprove}
          >
            <CheckCheck size={14} />
            承認・完了
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
