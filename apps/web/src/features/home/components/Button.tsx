import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'text'
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'transition-all duration-300'
  const variantStyles = {
    default: '',
    outline: '',
    text: 'bg-transparent hover:bg-transparent',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
