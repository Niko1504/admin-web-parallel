import React from 'react';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  fullWidth = false,
}) => {
  const baseStyles = `
    font-medium rounded-xl
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
  `;

  const variantStyles = {
    primary: `
      bg-blue-500 text-white
      hover:bg-blue-600
    `,
    secondary: `
      bg-gray-500 text-white
      hover:bg-gray-600
    `,
    success: `
      bg-green-500 text-white
      hover:bg-green-600
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600
    `,
    outline: `
      bg-transparent border-2 border-blue-500 text-blue-500
      hover:bg-blue-50
    `,
    ghost: `
      bg-transparent text-gray-600
      hover:bg-gray-100
    `,
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Загрузка...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default AnimatedButton;
