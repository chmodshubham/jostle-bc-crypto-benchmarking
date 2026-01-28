/**
 * Hierarchical navigation sidebar component
 */

import { useState } from 'react';
import type { HierarchyNode } from '../types/benchmark';
import { formatAlgorithmName, formatOperationName, formatVariantName } from '../utils/formatters';
import styles from './Sidebar.module.css';

interface SidebarProps {
  hierarchy: HierarchyNode;
  selectedPath: string;
  onSelect: (path: string) => void;
}

interface TreeNodeProps {
  node: HierarchyNode;
  selectedPath: string;
  onSelect: (path: string) => void;
  depth: number;
  category?: string;
}

function formatNodeName(name: string, depth: number, category?: string): string {
  // Depth 0 is category (PQC, KDF, Symmetric)
  if (depth === 0) {
    return name;
  }
  // Depth 1 is algorithm
  if (depth === 1) {
    return formatAlgorithmName(name);
  }
  // Depth 2 is typically operation (for PQC/Symmetric) or hash algorithm (for KDF)
  if (depth === 2) {
    if (category === 'KDF') {
      return name; // Hash algorithm names are already formatted
    }
    return formatOperationName(name);
  }
  // Deeper levels are variants or other parameters
  return formatVariantName(name);
}

function TreeNode({ node, selectedPath, onSelect, depth, category }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(
    depth < 2 || selectedPath.startsWith(node.path)
  );

  const hasChildren = node.children.length > 0;
  const isSelected = selectedPath === node.path;
  const isParentOfSelected = selectedPath.startsWith(node.path + '/');

  const handleClick = () => {
    onSelect(node.path);
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const benchmarkCount = node.comparisons.length;

  // Determine category for formatting context
  const currentCategory = depth === 0 ? node.name : category;
  const displayName = formatNodeName(node.name, depth, category);

  return (
    <div className={styles.treeNode}>
      <button
        className={`${styles.nodeButton} ${isSelected ? styles.selected : ''} ${isParentOfSelected ? styles.parentOfSelected : ''}`}
        onClick={handleClick}
        style={{ paddingLeft: `${16 + depth * 12}px` }}
      >
        {hasChildren && (
          <span className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
        {!hasChildren && <span className={styles.leafIcon}></span>}
        <span className={styles.nodeName}>{displayName}</span>
        <span className={styles.count}>{benchmarkCount}</span>
      </button>
      {hasChildren && expanded && (
        <div className={styles.children}>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
              category={currentCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ hierarchy, selectedPath, onSelect }: SidebarProps) {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.title}>JMH Benchmarks</h1>
        <p className={styles.subtitle}>Jostle vs BC Comparison</p>
      </div>
      <div className={styles.tree}>
        <button
          className={`${styles.nodeButton} ${styles.rootButton} ${selectedPath === '' ? styles.selected : ''}`}
          onClick={() => onSelect('')}
        >
          <span className={styles.nodeName}>All Benchmarks</span>
          <span className={styles.count}>{hierarchy.comparisons.length}</span>
        </button>
        {hierarchy.children.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>
    </nav>
  );
}
