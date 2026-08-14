interface AnimatedTextProps {
  text: string;
  className?: string;
}

const NBSP = ' ';

export default function AnimatedText({ text, className }: AnimatedTextProps) {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span key={`${index}-${char}`} className="digit-tick">
          {char === ' ' ? NBSP : char}
        </span>
      ))}
    </span>
  );
}
