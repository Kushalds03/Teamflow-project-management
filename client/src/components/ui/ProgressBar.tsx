import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'auto' | 'indigo' | 'emerald' | 'amber' | 'blue';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = false,
  size = 'md',
  color = 'auto',
  className = ''
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5'
  };

  const getColorClass = () => {
    if (color !== 'auto') {
      switch (color) {
        case 'indigo':
          return 'bg-indigo-600';
        case 'emerald':
          return 'bg-emerald-500';
        case 'amber':
          return 'bg-amber-500';
        case 'blue':
          return 'bg-blue-600';
      }
    }

    if (clampedValue === 100) return 'bg-emerald-500';
    if (clampedValue >= 60) return 'bg-indigo-600';
    if (clampedValue >= 30) return 'bg-blue-600';
    return 'bg-amber-500';
  };

  return (
    <div className={`w-full flex items-center gap-2.5 ${className}`}>
      <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getColorClass()}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 min-w-8 text-right">
          {clampedValue}%
        </span>
      )}
    </div>
  );
};
