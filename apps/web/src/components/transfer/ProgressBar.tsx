import { FC } from 'react';
import { ProgressBarProps } from '../../types/transfer.types'; // Adjust path as needed

export const ProgressBar: FC<ProgressBarProps> = ({ progress, gradient }) => (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div className={`${gradient} h-3 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
    </div>
);