import { FC } from 'react';
import { AlertCircle } from 'lucide-react';
import { AlertProps } from '../../types/transfer.types'; // Adjust path as needed

export const Alert: FC<AlertProps> = ({ type = 'error', children }) => {
    // const colors = { error: 'red', warning: 'amber', success: 'green', info: 'blue' };
    //const c = colors[type];

    // Note: PurgeCSS requires full class names, so string interpolation like `bg-${c}-50` may not work.
    // It's safer to map full classes. This is a simplified example.
    const bgClass = { error: 'bg-red-50', warning: 'bg-amber-50', success: 'bg-green-50', info: 'bg-blue-50' }[type];
    const borderClass = { error: 'border-red-200', warning: 'border-amber-200', success: 'border-green-200', info: 'border-blue-200' }[type];
    const textClass = { error: 'text-red-600', warning: 'text-amber-600', success: 'text-green-600', info: 'text-blue-600' }[type];

    return (
        <div className={`${bgClass} ${borderClass} border rounded-xl p-4 flex items-start gap-3`}>
            <AlertCircle className={`w-5 h-5 ${textClass} mt-0.5`} />
            <div className="flex-1">{children}</div>
        </div>
    );
};