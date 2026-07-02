"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns3, Grid } from 'lucide-react';

export type DayType = {
  day: string;
  classNames: string;
  meetingInfo?: {
    date: string;
    time: string;
    title: string;
    participants: string[];
    location: string;
  }[];
};

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: string | null) => void;
}

const Day: React.FC<DayProps> = ({ classNames, day, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className={`relative flex items-center justify-center py-1 ${classNames}`}
      style={{ height: '4rem', borderRadius: 16 }}
      onMouseEnter={() => { setIsHovered(true); onHover(day.day); }}
      onMouseLeave={() => { setIsHovered(false); onHover(null); }}
      id={`day-${day.day}`}
    >
      <motion.div className="flex flex-col items-center justify-center">
        {!(day.day[0] === '+' || day.day[0] === '-') && (
          <span className="text-sm text-white">{day.day}</span>
        )}
      </motion.div>
      {day.meetingInfo && (
        <motion.div
          className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-zinc-700 p-1 text-[10px] font-bold text-white"
          layoutId={`day-${day.day}-meeting-count`}
          style={{ borderRadius: 999 }}
        >
          {day.meetingInfo.length}
        </motion.div>
      )}
      <AnimatePresence>
        {day.meetingInfo && isHovered && (
          <div className="absolute inset-0 flex size-full items-center justify-center">
            <motion.div
              className="flex size-10 items-center justify-center bg-zinc-700 p-1 text-xs font-bold text-white"
              layoutId={`day-${day.day}-meeting-count`}
              style={{ borderRadius: 999 }}
            >
              {day.meetingInfo.length}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CalendarGrid: React.FC<{ onHover: (day: string | null) => void }> = ({ onHover }) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map((day, index) => (
        <Day key={`${day.day}-${index}`} classNames={day.classNames} day={day} onHover={onHover} />
      ))}
    </div>
  );
};

const InteractiveCalendar = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>
>(
  ({ className, ...props }, ref) => {
    const [moreView, setMoreView] = useState(false);
    const [hoveredDay, setHoveredDay] = useState<string | null>(null);

    const sortedDays = React.useMemo(() => {
      if (!hoveredDay) return DAYS;
      return [...DAYS].sort((a, b) => {
        if (a.day === hoveredDay) return -1;
        if (b.day === hoveredDay) return 1;
        return 0;
      });
    }, [hoveredDay]);

    return (
      <AnimatePresence mode="wait">
        <motion.div ref={ref} className="relative mx-auto my-10 flex w-full flex-col items-center justify-center gap-8 lg:flex-row" {...props}>
          <motion.div layout className="w-full max-w-lg">
            <motion.div key="calendar-view" className="flex w-full flex-col gap-4">
              <div className="flex w-full items-center justify-between">
                <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-zinc-300">LN <span className="opacity-50">2026</span></motion.h2>
                <motion.button className="relative flex items-center gap-3 rounded-lg border border-[#323232] px-1.5 py-1 text-[#323232]" onClick={() => setMoreView(!moreView)}>
                  <Columns3 className="z-[2]" />
                  <Grid className="z-[2]" />
                  <div className="absolute left-0 top-0 h-[85%] w-7 rounded-md bg-white transition-transform duration-300" style={{ top: '50%', transform: moreView ? 'translateY(-50%) translateX(40px)' : 'translateY(-50%) translateX(4px)' }} />
                </motion.button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="px-0/5 rounded-xl bg-[#323232] py-1 text-center text-xs text-white">{day}</div>
                ))}
              </div>
              <CalendarGrid onHover={setHoveredDay} />
            </motion.div>
          </motion.div>
          {moreView && (
            <motion.div className="w-full max-w-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
              <motion.div key="more-view" className="mt-4 flex w-full flex-col gap-4">
                <div className="flex w-full flex-col items-start justify-between">
                  <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-zinc-300">Prenotazioni</motion.h2>
                  <p className="font-medium text-zinc-300/50">Vedi eventi passati e futuri prenotati tramite i tuoi link.</p>
                </div>
                <motion.div className="flex h-[620px] flex-col items-start justify-start overflow-hidden overflow-y-scroll rounded-xl border-2 border-[#323232] shadow-md" layout>
                  <AnimatePresence>
                    {sortedDays.filter((day) => day.meetingInfo).map((day) => (
                      <motion.div key={day.day} className="w-full border-b-2 border-[#323232] py-0 last:border-b-0" layout>
                        {day.meetingInfo && day.meetingInfo.map((meeting, mIndex) => (
                          <motion.div key={mIndex} className="border-b border-[#323232] p-3 last:border-b-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, delay: mIndex * 0.05 }}>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm text-white">{meeting.date}</span>
                              <span className="text-sm text-white">{meeting.time}</span>
                            </div>
                            <h3 className="mb-1 text-lg font-semibold text-white">{meeting.title}</h3>
                            <p className="mb-1 text-sm text-zinc-600">{meeting.participants.join(', ')}</p>
                            <div className="flex items-center text-blue-500">
                              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm">{meeting.location}</span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }
);
InteractiveCalendar.displayName = 'InteractiveCalendar';

export default InteractiveCalendar;

const DAYS: DayType[] = [
  { day: '-3', classNames: 'bg-zinc-700/20' },
  { day: '-2', classNames: 'bg-zinc-700/20' },
  { day: '-1', classNames: 'bg-zinc-700/20' },
  { day: '01', classNames: 'bg-[#1e1e1e]' },
  { day: '02', classNames: 'bg-[#1e1e1e] cursor-pointer', meetingInfo: [
    { date: 'Mer, 2 Nov', time: '10:00 - 11:00', title: 'Design Review', participants: ['Mario Rossi', 'Anna Bianchi'], location: 'Zoom' },
    { date: 'Mer, 2 Nov', time: '13:00 - 14:00', title: 'Sprint Planning', participants: ['Luca Verdi', 'Giulia Neri'], location: 'Google Meet' },
  ] },
  { day: '03', classNames: 'bg-[#1e1e1e]' },
  { day: '04', classNames: 'bg-zinc-700/20' },
  { day: '05', classNames: 'bg-zinc-700/20' },
  { day: '06', classNames: 'bg-[#1e1e1e] cursor-pointer', meetingInfo: [
    { date: 'Lun, 6 Nov', time: '10:00 - 11:00', title: 'Brainstorming', participants: ['Sara Conti', 'Paolo Costa'], location: 'Zoom' },
  ] },
  { day: '07', classNames: 'bg-[#1e1e1e]' },
  { day: '08', classNames: 'bg-[#1e1e1e] cursor-pointer', meetingInfo: [
    { date: 'Mer, 8 Nov', time: '14:00 - 15:00', title: 'Strategia', participants: ['Roberto Marini'], location: 'Google Meet' },
    { date: 'Mer, 8 Nov', time: '16:00 - 17:00', title: 'Budget Review', participants: ['Giulia Neri'], location: 'Microsoft Teams' },
  ] },
  { day: '09', classNames: 'bg-[#1e1e1e]' },
  { day: '10', classNames: 'bg-[#1e1e1e]' },
  { day: '11', classNames: 'bg-zinc-700/20' },
  { day: '12', classNames: 'bg-zinc-700/20' },
  { day: '13', classNames: 'bg-[#1e1e1e]' },
  { day: '14', classNames: 'bg-[#1e1e1e]' },
  { day: '15', classNames: 'bg-[#1e1e1e] cursor-pointer', meetingInfo: [
    { date: 'Mer, 15 Nov', time: '09:00 - 10:00', title: 'Feedback Cliente', participants: ['Sara Conti'], location: 'In ufficio' },
  ] },
  { day: '16', classNames: 'bg-[#1e1e1e]' },
  { day: '17', classNames: 'bg-[#1e1e1e] cursor-pointer', meetingInfo: [
    { date: 'Ven, 17 Nov', time: '09:00 - 10:00', title: 'Standup Settimanale', participants: ['Luca Verdi', 'Sara Conti'], location: 'Microsoft Teams' },
    { date: 'Ven, 17 Nov', time: '11:00 - 12:00', title: 'Update Cliente', participants: ['Mario Rossi'], location: 'In presenza' },
  ] },
  { day: '18', classNames: 'bg-zinc-700/20' },
  { day: '19', classNames: 'bg-zinc-700/20' },
  { day: '20', classNames: 'bg-[#1e1e1e]' },
  { day: '21', classNames: 'bg-[#1e1e1e] cursor-pointer', meetingInfo: [
    { date: 'Mar, 21 Nov', time: '11:00 - 12:00', title: 'Lancio Prodotto', participants: ['Mario Rossi', 'Anna Bianchi'], location: 'Zoom' },
  ] },
  { day: '22', classNames: 'bg-[#1e1e1e]' },
  { day: '23', classNames: 'bg-[#1e1e1e]' },
  { day: '24', classNames: 'bg-[#1e1e1e]' },
  { day: '25', classNames: 'bg-zinc-700/20' },
  { day: '26', classNames: 'bg-zinc-700/20' },
  { day: '27', classNames: 'bg-[#1e1e1e]' },
  { day: '28', classNames: 'bg-[#1e1e1e]' },
  { day: '29', classNames: 'bg-[#1e1e1e]' },
  { day: '30', classNames: 'bg-[#1e1e1e] cursor-pointer', meetingInfo: [
    { date: 'Gio, 30 Nov', time: '11:00 - 12:00', title: 'Brainstorming', participants: ['Luca Verdi'], location: 'Zoom' },
  ] },
  { day: '+1', classNames: 'bg-zinc-700/20' },
  { day: '+2', classNames: 'bg-zinc-700/20' },
];

const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
