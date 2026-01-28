import { useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts';
import type { BenchmarkComparison, JmhMode } from '../types/benchmark';
import { JMH_MODE_LABELS } from '../types/benchmark';
import { downloadAsPng, formatFilename } from '../data/export';
import { formatAlgorithmName, formatOperationName, formatVariantName, formatScoreWithUnit, formatTooltipError, formatPowerOfTen } from '../utils/formatters';
import styles from './BenchmarkChart.module.css';

interface BenchmarkChartProps {
  comparisons: BenchmarkComparison[];
  title: string;
  path: string;
  jmhMode: JmhMode;
}

interface ChartDataPoint {
  name: string;
  bc: number | null;
  bcError: number | null;
  jostle: number | null;
  jostleError: number | null;
  unit: string;
  jmhMode: JmhMode;
  fullData: BenchmarkComparison;
  algorithmDisplay: string;
  operationDisplay: string;
  variantDisplay: string;
}

function formatLabel(comparison: BenchmarkComparison, context: { hasMultipleAlgorithms: boolean; hasMultipleOperations: boolean }): string {
  const parts: string[] = [];

  if (context.hasMultipleAlgorithms) {
    parts.push(formatAlgorithmName(comparison.algorithm));
  }

  if (context.hasMultipleOperations) {
    parts.push(formatOperationName(comparison.operation));
  }

  if (comparison.category === 'Symmetric') {
    parts.push(comparison.variant);
    if (comparison.cipherMode) parts.push(comparison.cipherMode);
    if (comparison.padding) parts.push(comparison.padding);
  } else if (comparison.category === 'KDF') {
    if (comparison.hashAlgorithm) parts.push(comparison.hashAlgorithm);
    if (comparison.iterations) parts.push(comparison.iterations);
    if (parts.length === 0) parts.push(comparison.variant);
  } else {
    const variant = comparison.variant !== 'default' ? comparison.variant : '';
    if (variant) parts.push(formatVariantName(variant));
  }

  return parts.filter(Boolean).join('  ·  ');
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; payload: ChartDataPoint }> }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  // For throughput, higher is better; for time modes, lower is better
  const isHigherBetter = data.jmhMode === 'thrpt';

  let winner = '';
  let winnerColor = '';
  if (data.bc !== null && data.jostle !== null) {
    const jostleWins = isHigherBetter
      ? data.jostle > data.bc
      : data.jostle < data.bc;
    winner = jostleWins ? 'Jostle' : 'BC';
    winnerColor = jostleWins ? '#059669' : '#059669';
  }

  let diffPercent = '';
  if (data.bc !== null && data.jostle !== null && data.bc !== 0) {
    const ratio = data.jostle / data.bc;
    if (isHigherBetter) {
      diffPercent = ratio > 1
        ? `${((ratio - 1) * 100).toFixed(1)}% faster`
        : `${((1 - ratio) * 100).toFixed(1)}% slower`;
    } else {
      diffPercent = ratio < 1
        ? `${((1 - ratio) * 100).toFixed(1)}% faster`
        : `${((ratio - 1) * 100).toFixed(1)}% slower`;
    }
  }

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <p className={styles.tooltipAlgorithm}>{data.algorithmDisplay}</p>
        <p className={styles.tooltipOperation}>{data.operationDisplay}</p>
      </div>
      <p className={styles.tooltipVariant}>{data.variantDisplay}</p>
      <div className={styles.tooltipDivider} />
      <div className={styles.tooltipContent}>
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel} style={{ color: '#3b82f6' }}>BC (Bouncy Castle):</span>
          <span className={styles.tooltipValue}>
            {formatScoreWithUnit(data.bc, data.unit)}
          </span>
        </div>
        {data.bcError !== null && (
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabelSmall}>Error margin:</span>
            <span className={styles.tooltipValueSmall}>+/- {formatTooltipError(data.bcError)}</span>
          </div>
        )}
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel} style={{ color: '#ef4444' }}>Jostle (OpenSSL):</span>
          <span className={styles.tooltipValue}>
            {formatScoreWithUnit(data.jostle, data.unit)}
          </span>
        </div>
        {data.jostleError !== null && (
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabelSmall}>Error margin:</span>
            <span className={styles.tooltipValueSmall}>+/- {formatTooltipError(data.jostleError)}</span>
          </div>
        )}
        {data.bc !== null && data.jostle !== null && (
          <>
            <div className={styles.tooltipDivider} />
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Ratio (Jostle/BC):</span>
              <span className={styles.tooltipValue}>{(data.jostle / data.bc).toFixed(3)}x</span>
            </div>
            <div className={styles.tooltipWinner}>
              <span style={{ color: winnerColor }}>{winner} wins</span>
              <span className={styles.tooltipDiff}>({diffPercent})</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function BenchmarkChart({ comparisons, title, path, jmhMode }: BenchmarkChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  if (comparisons.length === 0) {
    return <div className={styles.empty}>No data available for this selection.</div>;
  }

  const uniqueAlgorithms = new Set(comparisons.map((c) => c.algorithm));
  const uniqueOperations = new Set(comparisons.map((c) => c.operation));
  const labelContext = {
    hasMultipleAlgorithms: uniqueAlgorithms.size > 1,
    hasMultipleOperations: uniqueOperations.size > 1,
  };

  const chartData: ChartDataPoint[] = comparisons.map((c) => ({
    name: formatLabel(c, labelContext),
    bc: c.bcScore,
    bcError: c.bcError,
    jostle: c.jostleScore,
    jostleError: c.jostleError,
    unit: c.scoreUnit,
    jmhMode: jmhMode,
    fullData: c,
    algorithmDisplay: formatAlgorithmName(c.algorithm),
    operationDisplay: formatOperationName(c.operation),
    variantDisplay: formatVariantName(c.variant),
  }));

  const unit = comparisons[0].scoreUnit;
  const modeLabel = JMH_MODE_LABELS[jmhMode];

  const handleExport = async () => {
    if (chartRef.current) {
      await downloadAsPng(chartRef.current, formatFilename(path, jmhMode));
    }
  };

  // If values are in similar range (within 10x), start axis near minimum for better visibility
  const allValues = chartData.flatMap((d) => [d.bc, d.jostle].filter((v): v is number => v !== null && v > 0));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const rangeRatio = maxValue / minValue;
  const useAdjustedDomain = rangeRatio < 10 && minValue > 0;
  const domainMin = useAdjustedDomain ? minValue * 0.5 : 0;
  const domainMax = maxValue * 1.15;

  const formatXAxis = (value: number): string => {
    if (value === 0) return '0';
    if (value >= 1000 || (value > 0 && value < 0.01)) {
      return formatPowerOfTen(value, 1);
    }
    if (value < 1) {
      return value.toFixed(2);
    }
    return value.toFixed(0);
  };

  const chartHeight = Math.max(400, comparisons.length * 70);
  const maxLabelLength = Math.max(...chartData.map((d) => d.name.length));
  const labelWidth = Math.min(400, Math.max(200, maxLabelLength * 8));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>
            {modeLabel} ({unit})
            {useAdjustedDomain && <span className={styles.scaleNote}> · Axis scaled for visibility</span>}
          </p>
        </div>
        <button onClick={handleExport} className={styles.exportButton}>
          Download PNG
        </button>
      </div>
      <div ref={chartRef} className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatXAxis}
              domain={[domainMin, domainMax]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              tickCount={6}
              allowDataOverflow={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 13, fill: '#374151', fontWeight: 500, style: { whiteSpace: 'nowrap' } }}
              width={labelWidth}
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={44}
              wrapperStyle={{ paddingBottom: '12px' }}
              formatter={(value) => <span style={{ color: '#334155', fontWeight: 600, fontSize: '13px' }}>{value}</span>}
            />
            <Bar
              dataKey="bc"
              name="BC (Bouncy Castle)"
              fill="#3b82f6"
              barSize={18}
              radius={[0, 4, 4, 0]}
            >
              <ErrorBar
                dataKey="bcError"
                width={4}
                strokeWidth={1.5}
                stroke="#1d4ed8"
              />
            </Bar>
            <Bar
              dataKey="jostle"
              name="Jostle (OpenSSL)"
              fill="#ef4444"
              barSize={18}
              radius={[0, 4, 4, 0]}
            >
              <ErrorBar
                dataKey="jostleError"
                width={5}
                strokeWidth={1.5}
                stroke="#b91c1c"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
