/**
 * TypeScript types for JMH benchmark data
 */

export interface JmhPrimaryMetric {
  score: number;
  scoreError: number;
  scoreConfidence: [number, number];
  scorePercentiles: Record<string, number>;
  scoreUnit: string;
  rawData: number[][];
}

export interface JmhBenchmarkResult {
  jmhVersion: string;
  benchmark: string;
  mode: JmhMode;
  threads: number;
  forks: number;
  jvm: string;
  jvmArgs: string[];
  jdkVersion: string;
  vmName: string;
  vmVersion: string;
  warmupIterations: number;
  warmupTime: string;
  warmupBatchSize: number;
  measurementIterations: number;
  measurementTime: string;
  measurementBatchSize: number;
  params: Record<string, string>;
  primaryMetric: JmhPrimaryMetric;
  secondaryMetrics: Record<string, unknown>;
}

export type JmhMode = 'thrpt' | 'avgt' | 'ss' | 'sample';

export type Provider = 'BC' | 'Jostle';

export type BenchmarkCategory = 'PQC' | 'KDF' | 'Symmetric';

export interface ParsedBenchmark {
  id: string;
  category: BenchmarkCategory;
  algorithm: string;
  operation: string;
  variant: string;
  mode: string | null;
  // Additional fields for deeper hierarchy
  cipherMode: string | null;  // For Symmetric: CBC, CFB, CTR, etc.
  padding: string | null;     // For Symmetric: NoPadding, PKCS5Padding, etc.
  hashAlgorithm: string | null; // For KDF PBKDF2: SHA224, SHA256, etc.
  iterations: string | null;  // For KDF: iteration count or N parameter
  jmhMode: JmhMode;
  provider: Provider;
  score: number;
  scoreError: number;
  scoreUnit: string;
  rawData: JmhBenchmarkResult;
}

export interface BenchmarkComparison {
  id: string;
  category: BenchmarkCategory;
  algorithm: string;
  operation: string;
  variant: string;
  mode: string | null;
  // Additional fields for deeper hierarchy
  cipherMode: string | null;
  padding: string | null;
  hashAlgorithm: string | null;
  iterations: string | null;
  jmhMode: JmhMode;
  bcScore: number | null;
  bcError: number | null;
  jostleScore: number | null;
  jostleError: number | null;
  scoreUnit: string;
  bcRaw: JmhBenchmarkResult | null;
  jostleRaw: JmhBenchmarkResult | null;
}

export interface HierarchyNode {
  name: string;
  path: string;
  children: HierarchyNode[];
  comparisons: BenchmarkComparison[];
}

export const JMH_MODE_LABELS: Record<JmhMode, string> = {
  thrpt: 'Throughput',
  avgt: 'Average Time',
  ss: 'Single Shot',
  sample: 'Sampling',
};

export const CATEGORY_ORDER: BenchmarkCategory[] = ['PQC', 'KDF', 'Symmetric'];
