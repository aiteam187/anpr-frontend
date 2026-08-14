import type { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <div className={`animate-fade-in-up ${className ?? ''}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
