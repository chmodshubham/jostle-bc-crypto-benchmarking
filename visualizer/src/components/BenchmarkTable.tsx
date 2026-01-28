import { useRef } from "react";
import type { BenchmarkComparison, JmhMode } from "../types/benchmark";
import { JMH_MODE_LABELS } from "../types/benchmark";
import { downloadAsPng, formatFilename } from "../data/export";
import {
  formatAlgorithmName,
  formatOperationName,
  formatVariantName,
  formatScoreValue,
  formatErrorMargin,
  formatRatio,
} from "../utils/formatters";
import styles from "./BenchmarkTable.module.css";

interface BenchmarkTableProps {
  comparisons: BenchmarkComparison[];
  title: string;
  path: string;
  jmhMode: JmhMode;
}


function getRatioClass(ratio: number | null): string {
  if (ratio === null) return "";
  if (ratio > 1.1) return styles.faster;
  if (ratio < 0.9) return styles.slower;
  return styles.similar;
}

export function BenchmarkTable({
  comparisons,
  title,
  path,
  jmhMode,
}: BenchmarkTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  if (comparisons.length === 0) {
    return <div className={styles.empty}>No data available.</div>;
  }

  const modeLabel = JMH_MODE_LABELS[jmhMode];
  const unit = comparisons[0].scoreUnit;

  const uniqueAlgorithms = new Set(comparisons.map((c) => c.algorithm));
  const uniqueOperations = new Set(comparisons.map((c) => c.operation));
  const hasMultipleAlgorithms = uniqueAlgorithms.size > 1;
  const hasMultipleOperations = uniqueOperations.size > 1;

  const handleExport = async () => {
    if (tableRef.current) {
      await downloadAsPng(
        tableRef.current,
        formatFilename(path, `${jmhMode}-table`),
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title} - Detailed Data</h3>
          <p className={styles.subtitle}>
            {modeLabel} ({unit})
          </p>
        </div>
        <button onClick={handleExport} className={styles.exportButton}>
          Download PNG
        </button>
      </div>
      <div ref={tableRef} className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Benchmark</th>
              <th>BC Score</th>
              <th>BC Error</th>
              <th>Jostle Score</th>
              <th>Jostle Error</th>
              <th>Ratio (J/BC)</th>
              <th>Faster</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => {
              const ratio =
                c.bcScore !== null && c.jostleScore !== null
                  ? c.jostleScore / c.bcScore
                  : null;

              let winner = "N/A";
              let winnerKey = "";
              if (c.bcScore !== null && c.jostleScore !== null) {
                // For throughput, higher is better; for time modes, lower is better
                const isHigherBetter = jmhMode === "thrpt";
                if (isHigherBetter) {
                  winnerKey = c.jostleScore > c.bcScore ? "jostle" : "bc";
                  winner = c.jostleScore > c.bcScore ? "Jostle" : "BC";
                } else {
                  winnerKey = c.jostleScore < c.bcScore ? "jostle" : "bc";
                  winner = c.jostleScore < c.bcScore ? "Jostle" : "BC";
                }
              }

              const parts: string[] = [];

              if (hasMultipleAlgorithms) {
                parts.push(formatAlgorithmName(c.algorithm));
              }

              if (hasMultipleOperations) {
                parts.push(formatOperationName(c.operation));
              }

              if (c.category === "Symmetric") {
                parts.push(c.variant);
                if (c.cipherMode) parts.push(c.cipherMode);
                if (c.padding) parts.push(c.padding);
              } else if (c.category === "KDF") {
                if (c.hashAlgorithm) parts.push(c.hashAlgorithm);
                if (c.iterations) parts.push(c.iterations);
                if (parts.length === 0) parts.push(c.variant);
              } else {
                const variant = c.variant !== "default" ? c.variant : "";
                if (variant) parts.push(formatVariantName(variant));
              }

              const displayName = parts.filter(Boolean).join("  ·  ");

              return (
                <tr key={c.id}>
                  <td className={styles.nameCell}>{displayName}</td>
                  <td className={styles.numCell}>{formatScoreValue(c.bcScore)}</td>
                  <td className={styles.numCell}>{formatErrorMargin(c.bcError)}</td>
                  <td className={styles.numCell}>
                    {formatScoreValue(c.jostleScore)}
                  </td>
                  <td className={styles.numCell}>
                    {formatErrorMargin(c.jostleError)}
                  </td>
                  <td className={`${styles.numCell} ${getRatioClass(ratio)}`}>
                    {formatRatio(ratio)}
                  </td>
                  <td className={styles.winnerCell}>
                    <span
                      className={
                        winnerKey === "jostle"
                          ? styles.jostleWin
                          : winnerKey === "bc"
                            ? styles.bcWin
                            : ""
                      }
                    >
                      {winner}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
