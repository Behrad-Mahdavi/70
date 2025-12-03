import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 rtl:flex-row-reverse">
      <div 
        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;