
import React, { useState } from 'react';
import { Student } from '../types';
import { User, ShieldAlert, CheckCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TableGridProps {
  students: Student[];
  onTableClick: (tableNumber: number) => void;
}

export const RANGE_GROUPS = [
  { label: "Tables 10 to 18", start: 10, end: 18, id: "10-18" },
  { label: "Tables 19 to 27", start: 19, end: 27, id: "19-27" },
  { label: "Tables 28 to 36", start: 28, end: 36, id: "28-36" },
  { label: "Tables 37 to 42", start: 37, end: 42, id: "37-42" },
  { label: "Tables 43 to 51", start: 43, end: 51, id: "43-51" },
  { label: "Tables 52 to 60", start: 52, end: 60, id: "52-60" },
];

const TableGrid: React.FC<TableGridProps> = ({ students, onTableClick }) => {
  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);

  const getStudentForTable = (tableNum: number) => {
    return students.find(s => s.tableNumber === tableNum);
  };

  const isOverdue = (nextDue: string) => {
    return new Date(nextDue) < new Date();
  };

  const getRangeStats = (start: number, end: number) => {
    let occupied = 0;
    let overdueCount = 0;
    const total = end - start + 1;
    
    for (let i = start; i <= end; i++) {
      const student = getStudentForTable(i);
      if (student) {
        occupied++;
        if (isOverdue(student.nextDueDate)) {
          overdueCount++;
        }
      }
    }
    return { total, occupied, overdueCount };
  };

  const activeGroups = selectedRangeId 
    ? RANGE_GROUPS.filter(g => g.id === selectedRangeId)
    : RANGE_GROUPS;

  return (
    <div className="space-y-4">
      {/* Horizontal pill navigation for range sections */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar border-b border-slate-100">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedRangeId(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none
            ${selectedRangeId === null 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All Ranges
        </motion.button>
        {RANGE_GROUPS.map(group => {
          const stats = getRangeStats(group.start, group.end);
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={group.id}
              onClick={() => setSelectedRangeId(group.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1 select-none
                ${selectedRangeId === group.id 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <span>{group.start}–{group.end}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none
                ${selectedRangeId === group.id 
                  ? 'bg-blue-700 text-blue-100' 
                  : 'bg-slate-200 text-slate-500'}`}
              >
                {stats.occupied}/{stats.total}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Heatmap controller and inline interactive legend */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className={`absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-450 animate-ping transition-opacity duration-200 ${heatmapEnabled ? 'opacity-100' : 'opacity-0'}`}></span>
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${heatmapEnabled ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block">Seat Zone Heatmap</span>
            <span className="text-[8px] text-slate-400 font-bold leading-none">Highlights peak demand areas</span>
          </div>
        </div>

        {/* Dynamic inline status labels */}
        {heatmapEnabled && (
          <div className="flex items-center gap-2.5 text-[8px] font-black uppercase tracking-wider text-slate-350">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-550"></span> ❄️ Low (&le;30%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span> ⚡ Mid (31-70%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-550"></span> 🔥 Hot (&gt;70%)
            </span>
          </div>
        )}

        <button
          onClick={() => setHeatmapEnabled(!heatmapEnabled)}
          className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all duration-155 border select-none
            ${heatmapEnabled 
              ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700 active:scale-97' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 active:scale-97'}`}
        >
          {heatmapEnabled ? '✨ Heatmap ON' : '📊 Heatmap OFF'}
        </button>
      </div>

      {/* Render active group panels */}
      <div className="space-y-4 relative">
        <AnimatePresence mode="popLayout">
          {activeGroups.map(group => {
            const stats = getRangeStats(group.start, group.end);
            const rangeTables = Array.from({ length: group.end - group.start + 1 }, (_, i) => group.start + i);
            const pct = Math.round((stats.occupied / stats.total) * 100) || 0;

            // Compute heatmap parameters as a direct overlay
            let cardBg = "bg-slate-50/75";
            let cardBorder = "border-slate-100";
            let leftBar = "";
            let heatLabelText = `Seats ${group.start} to ${group.end}`;
            let heatHeaderIcon = <Layers className="w-3.5 h-3.5 text-slate-400" />;
            let heatBadge = null;

            if (heatmapEnabled) {
              if (pct > 70) {
                cardBg = "bg-gradient-to-br from-rose-50/30 via-white to-transparent";
                cardBorder = "border-rose-150 shadow-[inset_0_1px_3px_rgba(244,63,94,0.03)]";
                leftBar = "border-l-3 border-l-rose-500";
                heatLabelText = "🔥 Hot spot! High density booking";
                heatHeaderIcon = <Layers className="w-3.5 h-3.5 text-rose-500 animate-pulse" />;
                heatBadge = (
                  <span className="text-[8.5px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-150 px-1.5 py-0.5 rounded-md leading-none">
                    🔥 {pct}% popular
                  </span>
                );
              } else if (pct > 30) {
                cardBg = "bg-gradient-to-br from-amber-50/20 via-white to-transparent";
                cardBorder = "border-amber-150 shadow-[inset_0_1px_3px_rgba(245,158,11,0.02)]";
                leftBar = "border-l-3 border-l-amber-500";
                heatLabelText = "⚡ Standard occupancy level";
                heatHeaderIcon = <Layers className="w-3.5 h-3.5 text-amber-550" />;
                heatBadge = (
                  <span className="text-[8.5px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.5 rounded-md leading-none">
                    ⚡ {pct}% occupied
                  </span>
                );
              } else {
                cardBg = "bg-gradient-to-br from-blue-50/20 via-white to-transparent";
                cardBorder = "border-blue-150 shadow-[inset_0_1px_3px_rgba(59,130,246,0.02)]";
                leftBar = "border-l-3 border-l-blue-400";
                heatLabelText = "❄️ Quiet area. Ideal for focus";
                heatHeaderIcon = <Layers className="w-3.5 h-3.5 text-blue-500" />;
                heatBadge = (
                  <span className="text-[8.5px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-150 px-1.5 py-0.5 rounded-md leading-none">
                    ❄️ {pct}% filled
                  </span>
                );
              }
            }

            return (
              <motion.div
                key={group.id}
                layout="position"
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`${cardBg} ${cardBorder} ${leftBar} border rounded-xl p-3 shadow-xs transition-colors duration-200`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {heatHeaderIcon}
                      {group.label}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {heatLabelText}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {heatBadge}
                    <div className="flex items-center gap-1 bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-2xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${heatmapEnabled ? pct > 70 ? 'bg-rose-500 animate-pulse' : pct > 30 ? 'bg-amber-500' : 'bg-blue-400' : 'bg-blue-500'}`}></span>
                      <span className="text-[9px] font-bold text-slate-600">
                        {stats.occupied}/{stats.total} Busy
                      </span>
                      {stats.overdueCount > 0 && (
                        <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1 py-0.5 rounded flex items-center leading-none">
                          {stats.overdueCount} due
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid of study tables optimized for mobile screens (exactly 3 columns) */}
                <div className="grid grid-cols-3 gap-2">
                  {rangeTables.map(num => {
                    const student = getStudentForTable(num);
                    const overdue = student ? isOverdue(student.nextDueDate) : false;

                    let cellBgBorder = "";
                    if (heatmapEnabled) {
                      if (student) {
                        cellBgBorder = overdue 
                          ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/70 shadow-2xs' 
                          : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100/70 shadow-2xs';
                      } else {
                        if (pct > 70) {
                          cellBgBorder = 'border-rose-250 bg-rose-50/15 hover:border-rose-400 hover:bg-rose-100/25 shadow-3xs';
                        } else if (pct > 30) {
                          cellBgBorder = 'border-amber-250 bg-amber-50/15 hover:border-amber-400 hover:bg-amber-100/25 shadow-3xs';
                        } else {
                          cellBgBorder = 'border-blue-250 bg-blue-50/15 hover:border-blue-400 hover:bg-blue-100/25 shadow-3xs';
                        }
                      }
                    } else {
                      cellBgBorder = student 
                        ? overdue 
                          ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/70 shadow-2xs' 
                          : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-2xs';
                    }

                    return (
                      <button
                        key={num}
                        onClick={() => onTableClick(num)}
                        className={`relative group h-16 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center p-1 ${cellBgBorder}`}
                      >
                        <span className="absolute top-1 left-1.5 text-[9px] font-bold text-slate-450 leading-none">
                          #{num}
                        </span>
                        
                        {student ? (
                          <div className="flex flex-col items-center w-full mt-2.5">
                            <span className="text-[10px] font-extrabold text-slate-800 truncate w-full text-center px-1">
                              {student.name.split(' ')[0]}
                            </span>
                            <span className={`text-[7px] font-black tracking-tight uppercase px-1 py-0.5 rounded leading-none mt-1
                              ${overdue 
                                ? 'bg-rose-105 text-rose-600' 
                                : 'bg-emerald-105 text-emerald-600'}`}
                            >
                              {overdue ? 'Due' : 'Paid'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center mt-2.5">
                            <span className={`text-[12px] font-medium leading-none ${heatmapEnabled ? pct > 70 ? 'text-rose-450 animate-pulse' : pct > 30 ? 'text-amber-450' : 'text-blue-450' : 'text-slate-300'}`}>
                              {heatmapEnabled ? (pct > 70 ? '🔥' : pct > 30 ? '⚡' : '❄️') : '+'}
                            </span>
                            <span className={`text-[7px] font-bold uppercase tracking-widest leading-none mt-1 ${heatmapEnabled ? pct > 70 ? 'text-rose-550' : pct > 30 ? 'text-amber-550' : 'text-blue-550' : 'text-slate-350'}`}>
                              {heatmapEnabled ? (pct > 70 ? 'Hot Seat' : pct > 35 ? 'Mid Busy' : 'Quiet') : 'Vacant'}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TableGrid;
