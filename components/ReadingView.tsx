import React from 'react';
import { IstighfarData } from '../types';
import ProgressBar from './ProgressBar';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ReadingViewProps {
  item: IstighfarData;
  currentIndex: number;
  total: number;
  onNext: () => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ item, currentIndex, total, onNext }) => {
  return (
    <div className="flex flex-col min-h-[80vh] justify-center max-w-lg mx-auto w-full p-4 fade-enter-active">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col relative">
        
        {/* Header with counter */}
        <div className="bg-primary-50 p-6 flex items-center justify-between border-b border-primary-100">
           <span className="text-primary-700 font-bold text-lg">بند {item.id}</span>
           <span className="text-primary-400 text-sm font-medium">{item.id} از {total}</span>
        </div>

        {/* Content */}
        <div className="p-8 flex-grow flex items-center min-h-[300px]">
          <p className="text-xl md:text-2xl leading-10 text-gray-800 text-justify font-medium">
            {item.text}
          </p>
        </div>

        {/* Footer with action */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <ProgressBar current={currentIndex + 1} total={total} />
          
          <button 
            onClick={onNext}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-lg font-bold shadow-md transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]"
          >
            {currentIndex + 1 === total ? (
              <>
                <CheckCircle2 size={24} />
                <span>پایان و ثبت</span>
              </>
            ) : (
              <>
                 <ArrowLeft size={24} />
                 <span>تایید و بعدی</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadingView;