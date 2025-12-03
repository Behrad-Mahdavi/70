import React from 'react';
import { UserProgress } from '../types';
import { Trophy, RefreshCw, Calendar, BookOpen } from 'lucide-react';

interface DashboardProps {
  progress: UserProgress;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-md mx-auto w-full fade-enter-active">
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-4 shadow-sm">
          <Trophy size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">قبول باشد!</h1>
        <p className="text-gray-500">شما امروز ۷۰ بند استغفار را خواندید.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        {/* Streak Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="text-orange-500 mb-2">
            <Calendar size={28} />
          </div>
          <span className="text-3xl font-bold text-gray-800">{progress.streak}</span>
          <span className="text-xs text-gray-500 mt-1">روز متوالی</span>
        </div>

        {/* Total Read Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="text-blue-500 mb-2">
            <BookOpen size={28} />
          </div>
          <span className="text-3xl font-bold text-gray-800">{progress.totalParagraphsRead}</span>
          <span className="text-xs text-gray-500 mt-1">مجموع بندها</span>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-center border-b border-gray-100 pb-3">وضعیت امروز</h3>
        <div className="flex items-center justify-between text-sm">
           <span className="text-gray-500">تاریخ:</span>
           <span className="font-mono dir-ltr text-gray-800">
             {new Date().toLocaleDateString('fa-IR')}
           </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-3">
           <span className="text-gray-500">وضعیت:</span>
           <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">تکمیل شده</span>
        </div>
      </div>

      <button 
        onClick={onReset}
        className="text-gray-500 hover:text-primary-600 flex items-center gap-2 text-sm font-medium transition-colors p-3"
      >
        <RefreshCw size={16} />
        <span>خواندن مجدد (بدون ثبت امتیاز)</span>
      </button>

    </div>
  );
};

export default Dashboard;