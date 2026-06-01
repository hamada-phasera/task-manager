import { useState } from 'react';
import { Copy, Check, CheckCheck, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import type { ResearchResult } from '../../types';

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
      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'コピー済み' : label}
    </button>
  );
}

interface ResearchPanelProps {
  research: ResearchResult;
  onApprove: () => void;
}

export default function ResearchPanel({ research, onApprove }: ResearchPanelProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const fullText = `# ${research.title}\n\n## サマリー\n${research.summary}\n\n${research.sections.map((s) => `## ${s.heading}\n${s.content}`).join('\n\n')}\n\n## 結論\n${research.conclusion}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard hover={false} className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/60 pb-3">
          <span className="text-base">🔍</span>
          <h3 className="font-bold text-slate-700 text-sm">リサーチレポート</h3>
          <div className="ml-auto">
            <CopyButton text={fullText} label="全文コピー" />
          </div>
        </div>

        {/* Title */}
        <h4 className="font-bold text-slate-800 text-base leading-snug">{research.title}</h4>

        {/* Summary */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">▼ エグゼクティブサマリー</p>
          <p className="text-xs text-slate-700 leading-relaxed bg-indigo-50/60 rounded-xl p-3 border border-indigo-100">
            {research.summary}
          </p>
        </div>

        {/* Sections accordion */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {research.sections.map((section, i) => (
            <div key={i} className="border border-slate-200/80 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white/60 hover:bg-white/80 transition-colors text-left"
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
              >
                <span className="text-xs font-semibold text-slate-700">{section.heading}</span>
                {expandedSection === i ? (
                  <ChevronUp size={13} className="text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
                )}
              </button>
              {expandedSection === i && (
                <div className="px-3 py-2.5 bg-slate-50/80 border-t border-slate-200/60">
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Conclusion */}
        {research.conclusion && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">▼ 結論・提言</p>
            <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
              {research.conclusion}
            </p>
          </div>
        )}

        {/* Risks */}
        {research.risks && research.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-slate-400">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {research.risks.map((risk, i) => (
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
