import React from 'react';
import { clsx } from 'clsx';
import { generateInitials } from '@kingshare/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'relative flex shrink-0 overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            className="aspect-square h-full w-full"
            src={src}
            alt={alt || name || 'Avatar'}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
            <span className="font-medium text-muted-foreground">
              {name ? generateInitials(name) : '?'}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';