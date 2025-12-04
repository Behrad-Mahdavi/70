import React from 'react';
import { UserProgress } from '../types';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Calendar, BookOpen, Flame, Target } from 'lucide-react';

interface DashboardProps {
  progress: UserProgress;
  onReset: () => void;
}

const JourneyMap: React.FC<{ completedDays: string[], streak: number }> = ({ completedDays }) => {
  const totalDays = 40;
  // محاسبه تعداد روزهای تکمیل شده (حداکثر ۴۰)
  const completedCount = Math.min(completedDays.length, totalDays);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <Target size={18} className="text-emerald-400" />
          سفر ۴۰ روزه
        </h3>
        <span className="text-slate-500 text-sm">{completedCount} از {totalDays} روز</span>
      </div>

      <div className="grid grid-cols-8 gap-2 md:gap-3">
        {Array.from({ length: totalDays }).map((_, index) => {
          const isCompleted = index < completedCount;
          const isToday = index === completedCount - 1; // آخرین روز تکمیل شده
          const dayNumber = index + 1;

          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.01, duration: 0.3 }}
              className={`
                aspect-square rounded-full flex items-center justify-center text-[10px] md:text-xs font-medium transition-colors
                ${isCompleted
                  ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' // تکمیل شده
                  : 'bg-slate-700/50 text-slate-600' // خالی
                }
                ${isToday ? 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-800 scale-110' : ''}
              `}
              title={`روز ${dayNumber}`}
            >
              {/* نمایش اعداد برای همه روزها یا فقط روزهای مهم */}
              {isCompleted || dayNumber % 5 === 0 || dayNumber === 1 ? dayNumber.toLocaleString('fa-IR') : ''}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / totalDays) * 100}%` }}
          transition={{ duration: 1, delay: 0.5, ease: "circOut" }}
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  delay?: number;
}> = ({ icon, value, label, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors"
  >
    <div className={`${color} mb-2 p-2 rounded-full bg-white/5`}>{icon}</div>
    <span className="text-3xl font-bold text-slate-100 font-mono">{Number(value).toLocaleString('fa-IR')}</span>
    <span className="text-xs text-slate-400 mt-1">{label}</span>
  </motion.div>
);

const Dashboard: React.FC<DashboardProps> = ({ progress, onReset }) => {
  // فرمت تاریخ استاندارد فارسی
  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto w-full text-slate-100">
      
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        >
          <Trophy size={40} className="text-emerald-400 drop-shadow-lg" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-2"
        >
          قبول باشد!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 text-sm"
        >
          شما امروز ۷۰ بند استغفار را خواندید
        </motion.p>
      </motion.div>

      {/* Journey Map */}
      <JourneyMap
        completedDays={progress.completedDays || []}
        streak={progress.streak}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<Flame size={24} />}
          value={progress.streak}
          label="روز متوالی"
          color="text-orange-400"
          delay={0.5}
        />
        <StatCard
          icon={<BookOpen size={24} />}
          value={progress.totalParagraphsRead}
          label="مجموع بندها"
          color="text-blue-400"
          delay={0.6}
        />
      </div>

      {/* Today's status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 mb-8"
      >
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-slate-400 flex items-center gap-2">
            <Calendar size={16} />
            تاریخ امروز
          </span>
          <span className="text-slate-200 font-medium text-xs">{today}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">وضعیت</span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 text-xs">
            تکمیل شده ✓
          </span>
        </div>
      </motion.div>

      {/* Reset button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onReset}
        className="flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 text-sm font-medium transition-colors py-3 w-full"
      >
        <RefreshCw size={16} />
        <span>خواندن مجدد (تمرینی)</span>
      </motion.button>

      {/* Motivational quote */}
{/* Motivational quote (Hadith) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-8 max-w-xs mx-auto"
      >
        <p className="text-slate-500 text-[10px] mb-1 font-arabic">
          «عَجِبتُ لِمَن يَقنَطُ و مَعَهُ الاستِغفارُ»
        </p>
        <p className="text-slate-400 text-xs leading-5 font-medium">
          «در شگفتم از کسی که ناامید می‌شود،<br/>در حالی که استغفار همراه اوست»
        </p>
        <span className="text-[9px] text-slate-600 block mt-1">(نهج‌البلاغه، حکمت ۸۷)</span>
      </motion.div>
    </div>
  );
};

export default Dashboard;