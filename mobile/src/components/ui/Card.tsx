import { View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({ elevated = true, className, children, ...props }: CardProps) {
  return (
    <View
      className={`rounded-card bg-card p-5 ${className ?? ''}`}
      style={
        elevated
          ? {
              shadowColor: '#134E4A',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }
          : undefined
      }
      {...props}
    >
      {children}
    </View>
  );
}
