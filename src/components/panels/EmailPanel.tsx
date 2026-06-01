import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RotateCcw, CheckCheck, ChevronRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import type { EmailResult } from '../../types';

interface EmailPanelProps {
  email: EmailResult;
  onRefinement: (request: string) => void;
  onApprove: () => void;
  isRefining: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  );
}

export default function EmailPanel({ email, onRefinement, onApprove, isRefining }: EmailPanelProps) {
  const [to, setTo] = useState(email.to);
  const [cc, setCc] = useState(email.cc ?? '');
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementText, setRefinementText] = useState('');

  const fullText = `To: ${to}\nCc: ${cc}\n件名: ${subject}\n\n${body}`;

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
          <span className="text-base">📧</span>
          <h3 className="font-bold text-slate-700 text-sm">メール実行パネル</h3>
          <div className="ml-auto">
            <CopyButton text={fullText} />
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 w-10 flex-shrink-0">To</label>
            <input
              className="flex-1 text-sm bg-white/60 border border-slate-200/80 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 w-10 flex-shrink-0">Cc</label>
            <input
              className="flex-1 text-sm bg-white/60 border border-slate-200/80 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="（任意）"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 w-10 flex-shrink-0">件名</label>
            <input
              className="flex-1 text-sm bg-white/60 border border-slate-200/80 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">本文</label>
            <textarea
              className="w-full text-sm bg-white/60 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 min-h-[180px] resize-y leading-relaxed"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        {/* Refinement */}
        {showRefinement && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <textarea
              className="w-full text-sm bg-white/60 border border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 min-h-[72px] resize-none"
              placeholder="修正内容を入力（例：もっとカジュアルなトーンで）"
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
