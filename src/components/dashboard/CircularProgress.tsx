
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isExceeded?: boolean;
  isApproaching?: boolean;
  children?: React.ReactNode;
}

export const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  isExceeded = false,
  isApproaching = false,
  children
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = (percentage * circumference) / 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E5DEFF"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isExceeded ? "#ea384c" : isApproaching ? "#f97316" : "#9b87f5"}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-1000 ease-in-out",
            isExceeded && "animate-pulse"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
