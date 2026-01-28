/**
 * Main content panel for viewing benchmark comparisons
 */

import { useState } from 'react';
import type { BenchmarkComparison, HierarchyNode, JmhMode } from '../types/benchmark';
import { JMH_MODE_LABELS } from '../types/benchmark';
import { filterByJmhMode, getUniqueJmhModes } from '../data/parser';
import { formatAlgorithmName, formatOperationName, formatVariantName } from '../utils/formatters';
import { BenchmarkChart } from './BenchmarkChart';
import { BenchmarkTable } from './BenchmarkTable';
import styles from './BenchmarkView.module.css';

interface BenchmarkViewProps {
  hierarchy: HierarchyNode;
  selectedPath: string;
}

function findNode(hierarchy: HierarchyNode, path: string): HierarchyNode | null {
  if (path === '' || path === hierarchy.path) {
    return hierarchy;
  }

  for (const child of hierarchy.children) {
    if (child.path === path) {
      return child;
    }
    const found = findNode(child, path);
    if (found) {
      return found;
    }
  }

  return null;
}

function formatBreadcrumbPart(part: string, index: number, category?: string): string {
  const decoded = decodeURIComponent(part);
  // Index 0 is category (PQC, KDF, Symmetric)
  if (index === 0) {
    return decoded;
  }
  // Index 1 is algorithm
  if (index === 1) {
    return formatAlgorithmName(decoded);
  }
  // Index 2 is typically operation (for PQC/Symmetric) or hash algorithm (for KDF)
  if (index === 2) {
    if (category === 'KDF') {
      return decoded;
    }
    return formatOperationName(decoded);
  }
  // Deeper levels are variants or other parameters
  return formatVariantName(decoded);
}

function getBreadcrumbs(path: string): { name: string; path: string }[] {
  if (!path) {
    return [{ name: 'All Benchmarks', path: '' }];
  }

  const parts = path.split('/');
  const breadcrumbs = [{ name: 'All', path: '' }];
  const category = parts[0]; // First part is the category

  let currentPath = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    breadcrumbs.push({
      name: formatBreadcrumbPart(part, i, category),
      path: currentPath,
    });
  }

  return breadcrumbs;
}

type ViewMode = 'chart' | 'table' | 'both';

export function BenchmarkView({ hierarchy, selectedPath }: BenchmarkViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [selectedJmhMode, setSelectedJmhMode] = useState<JmhMode | 'all'>('all');

  const node = findNode(hierarchy, selectedPath);

  if (!node) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          Select a benchmark from the sidebar to view results.
        </div>
      </div>
    );
  }

  const comparisons = node.comparisons;
  const jmhModes = getUniqueJmhModes(comparisons);
  const breadcrumbs = getBreadcrumbs(selectedPath);

  // Format the display title based on the path depth
  let displayTitle = node.name || 'All Benchmarks';
  if (selectedPath) {
    const pathParts = selectedPath.split('/');
    const depth = pathParts.length - 1;
    const category = pathParts[0];
    displayTitle = formatBreadcrumbPart(node.name, depth, category);
  }

  // Filter comparisons by selected JMH mode if not 'all'
  const filteredComparisons =
    selectedJmhMode === 'all'
      ? comparisons
      : filterByJmhMode(comparisons, selectedJmhMode);

  // Group by JMH mode for display
  const groupedByJmhMode = new Map<JmhMode, BenchmarkComparison[]>();
  for (const c of filteredComparisons) {
    if (!groupedByJmhMode.has(c.jmhMode)) {
      groupedByJmhMode.set(c.jmhMode, []);
    }
    groupedByJmhMode.get(c.jmhMode)!.push(c);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <nav className={styles.breadcrumbs}>
          {breadcrumbs.map((bc, i) => (
            <span key={bc.path}>
              {i > 0 && <span className={styles.separator}>/</span>}
              <span className={i === breadcrumbs.length - 1 ? styles.current : ''}>
                {bc.name}
              </span>
            </span>
          ))}
        </nav>

        <h2 className={styles.title}>{displayTitle}</h2>

        <div className={styles.stats}>
          <span className={styles.stat}>
            {comparisons.length} benchmark comparison{comparisons.length !== 1 ? 's' : ''}
          </span>
          <span className={styles.stat}>
            {jmhModes.length} JMH mode{jmhModes.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label className={styles.label}>View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className={styles.select}
            >
              <option value="both">Chart + Table</option>
              <option value="chart">Chart Only</option>
              <option value="table">Table Only</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>JMH Mode:</label>
            <select
              value={selectedJmhMode}
              onChange={(e) => setSelectedJmhMode(e.target.value as JmhMode | 'all')}
              className={styles.select}
            >
              <option value="all">All Modes</option>
              {jmhModes.map((mode) => (
                <option key={mode} value={mode}>
                  {JMH_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {Array.from(groupedByJmhMode).map(([jmhMode, modeComparisons]) => (
          <div key={jmhMode} className={styles.modeSection}>
            <h3 className={styles.modeTitle}>{JMH_MODE_LABELS[jmhMode]}</h3>

            {(viewMode === 'chart' || viewMode === 'both') && (
              <BenchmarkChart
                comparisons={modeComparisons}
                title={displayTitle}
                path={selectedPath || 'all'}
                jmhMode={jmhMode}
              />
            )}

            {(viewMode === 'table' || viewMode === 'both') && (
              <BenchmarkTable
                comparisons={modeComparisons}
                title={displayTitle}
                path={selectedPath || 'all'}
                jmhMode={jmhMode}
              />
            )}
          </div>
        ))}

        {filteredComparisons.length === 0 && (
          <div className={styles.empty}>
            No benchmarks found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
