import { FC } from 'react';
import { AlertCircle } from 'lucide-react';
import { ButtonProps, AlertProps, ProgressBarProps } from '@/types/transfer.types';

export const Btn: FC<ButtonProps> = ({ onClick, className = '', children, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} className={`transition font-semibold ${className}`} {...props}>
        {children}
    </button>
);

export const Alert: FC<AlertProps> = ({ type = 'error', children }) => {
    const colors = { error: 'red', warning: 'amber', success: 'green', info: 'blue' };
    const c = colors[type];
    return (
        <div className={`bg-${c}-50 border border-${c}-200 rounded-xl p-4 flex items-start gap-3`}>
            <AlertCircle className={`w-5 h-5 text-${c}-600 mt-0.5`} />
            <div className="flex-1">{children}</div>
        </div>
    );
};

export const ProgressBar: FC<ProgressBarProps> = ({ progress, gradient }) => (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div className={`${gradient} h-3 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
    </div>
);
