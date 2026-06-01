import { motion } from 'framer-motion';
import { CheckCheck, AlertTriangle, Flag, CalendarPlus } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import type { ScheduleResult } from '../../types';
import { downloadICS } from '../../utils/ics';

interface SchedulePanelProps {
  schedule: ScheduleResult;
  onApprove: () => void;
}

export default function SchedulePanel({ schedule, onApprove }: SchedulePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard hover={false} className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/60 pb-3">
          <span className="text-base">📅</span>
          <h3 className="font-bold text-slate-700 text-sm">スケジュール成果物</h3>
        </div>

        {/* Title */}
        <h4 className="font-bold text-slate-800 text-base">{schedule.title}</h4>

        {/* Schedule table */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {schedule.items.map((item, i) => (
            <div
              key={i}
              className={`flex gap-3 items-start p-2.5 rounded-xl text-xs transition-colors ${
                item.milestone
                  ? 'bg-indigo-50 border border-indigo-200/80'
                  : 'bg-white/50 border border-slate-100'
              }`}
            >
              {/* Milestone indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {item.milestone ? (
                  <Flag size={12} className="text-indigo-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                )}
              </div>

              {/* Date */}
              <div className="w-28 flex-shrink-0">
                <span className={`font-mono ${item.milestone ? 'text-indigo-700 font-bold' : 'text-slate-500'}`}>
                  {item.date}
                </span>
              </div>

              {/* Task */}
              <div className="flex-1 min-w-0">
                <p className={`leading-snug ${item.milestone ? 'font-semibold text-indigo-800' : 'text-slate-700'}`}>
                  {item.task}
                </p>
                {item.assignee && (
                  <p className="text-slate-400 mt-0.5">担当: {item.assignee}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {schedule.notes && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">▼ 補足事項</p>
            <p className="text-xs text-slate-600 leading-relaxed">{schedule.notes}</p>
          </div>
        )}

        {/* Risks */}
        {schedule.risks && schedule.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-slate-400">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {schedule.risks.map((risk, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            className="flex-1 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-full py-2 px-4 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            onClick={() => downloadICS(schedule, `${schedule.title}.ics`)}
          >
            <CalendarPlus size={14} />
            カレンダーに追加
          </button>
          <button
            className="flex-1 btn-gradient rounded-full py-2 px-4 text-sm font-semibold flex items-center justify-center gap-1.5"
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
