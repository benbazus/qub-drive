import { FC } from 'react';
import { ButtonProps } from '../../types/transfer.types'; // Adjust path as needed

export const Btn: FC<ButtonProps> = ({ onClick, className = '', children, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} className={`transition font-semibold ${className}`} {...props}>
        {children}
    </button>
);