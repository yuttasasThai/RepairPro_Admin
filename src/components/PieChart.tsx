import React, { useState } from 'react';

export interface PieChartData {
  label: string;
  count: number;
  color: string;
  percentage: number;
  formattedValue?: string;
}

interface PieChartProps {
  data: PieChartData[];
  total: number;
  size?: number;
  centerTitle?: string;
  centerValue?: string;
  unitLabel?: string;
}

export const DonutPieChart: React.FC<PieChartProps> = ({
  data,
  total,
  size = 180,
  centerTitle = 'รวมทั้งหมด',
  centerValue,
  unitLabel = 'งาน',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (total <= 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-full border-2 border-dashed border-slate-200 text-slate-400 text-xs"
        style={{ width: size, height: size }}
      >
        <span className="font-medium text-slate-500">ไม่มีข้อมูล</span>
        <span className="text-[10px] text-slate-400">ในช่วงเวลานี้</span>
      </div>
    );
  }

  // Calculate SVG arc paths for donut
  const center = size / 2;
  const radius = (size / 2) - 12;
  const innerRadius = radius * 0.62;

  let accumulatedAngle = 0;

  const slices = data.map((item, index) => {
    const sliceAngle = (item.count / total) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    accumulatedAngle += sliceAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const x3 = center + innerRadius * Math.cos(endRad);
    const y3 = center + innerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(startRad);
    const y4 = center + innerRadius * Math.sin(startRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const pathData = sliceAngle >= 359.99
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} L ${center - 0.01} ${center - innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 ${center} ${center - innerRadius} Z`
      : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

    return {
      ...item,
      pathData,
      isHovered: hoveredIndex === index,
    };
  });

  const activeSlice = hoveredIndex !== null ? data[hoveredIndex] : null;

  const isCompact = size <= 130;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="overflow-visible drop-shadow-2xs">
        {slices.map((slice, i) => (
          <path
            key={slice.label}
            d={slice.pathData}
            fill={slice.color}
            className="transition-all duration-200 cursor-pointer hover:opacity-90"
            style={{
              transform: slice.isHovered ? 'scale(1.03)' : 'scale(1)',
              transformOrigin: `${center}px ${center}px`,
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </svg>

      {/* Center Text inside Donut */}
      <div 
        className="absolute flex flex-col items-center justify-center pointer-events-none text-center px-0.5 leading-none"
        style={{ width: innerRadius * 1.85, height: innerRadius * 1.85 }}
      >
        {activeSlice ? (
          <>
            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-semibold text-slate-500 leading-tight truncate max-w-full`}>
              {activeSlice.label}
            </span>
            <span className={`${isCompact ? 'text-xs' : 'text-sm sm:text-base'} font-black text-slate-900 leading-tight my-0.5 truncate max-w-full font-mono`}>
              {activeSlice.formattedValue || activeSlice.count}
            </span>
            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-400`}>
              {activeSlice.percentage}%
            </span>
          </>
        ) : (
          <>
            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-medium text-slate-400 leading-tight truncate max-w-full`}>
              {centerTitle}
            </span>
            <span className={`${isCompact ? 'text-xs' : 'text-sm sm:text-base'} font-black text-slate-900 leading-tight my-0.5 truncate max-w-full font-mono`}>
              {centerValue || total}
            </span>
            {unitLabel && (
              <span className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} text-slate-400 leading-tight`}>{unitLabel}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
