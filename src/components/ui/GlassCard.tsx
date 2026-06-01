import { forwardRef } from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className = '', hover = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = 'GlassCard';

export default GlassCard;
