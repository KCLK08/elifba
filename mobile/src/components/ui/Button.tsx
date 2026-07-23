import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  className?: string;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  ghost: 'bg-primary-soft',
  success: 'bg-success-soft',
  warning: 'bg-secondary-soft',
  danger: 'bg-error-soft',
};

const labelClass: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-primary-dark',
  success: 'text-primary-dark',
  warning: 'text-ink',
  danger: 'text-error',
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  disabled,
  className,
  ...props
}: ButtonProps) {
  const height = size === 'lg' ? 'min-h-[64px]' : 'min-h-[56px]';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`items-center justify-center rounded-button px-6 ${height} ${variantClass[variant]} ${
        disabled ? 'opacity-50' : 'active:opacity-90'
      } ${className ?? ''}`}
      {...props}
    >
      <Text className={`text-center text-xl font-bold ${labelClass[variant]}`}>{label}</Text>
    </Pressable>
  );
}
