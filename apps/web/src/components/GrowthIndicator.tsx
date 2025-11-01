import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface GrowthIndicatorProps {
  growth: number;
  isAbsolute?: boolean;
}

export const GrowthIndicator: React.FC<GrowthIndicatorProps> = ({ growth, isAbsolute = false }) => {
  const isPositive = growth > 0;

  if (growth === 0) {
    return (
      <div className='mt-4 flex items-center text-sm'>
        <span className='text-muted-foreground'>No change vs last month</span>
      </div>
    );
  }

  return (
    <div className='mt-4 flex items-center text-sm'>
      {isPositive ? (
        <TrendingUp className='mr-1 h-4 w-4 text-green-500' />
      ) : (
        <TrendingDown className='mr-1 h-4 w-4 text-red-500' />
      )}
      <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isAbsolute ? (isPositive ? '+' : '') + growth : (isPositive ? '+' : '') + growth + '%'}
      </span>
      <span className='text-muted-foreground ml-1'>vs last month</span>
    </div>
  );
};