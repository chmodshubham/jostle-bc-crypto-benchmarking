import { useEffect, useState } from 'react';
import type { HierarchyNode } from './types/benchmark';
import { loadBenchmarkData } from './data/parser';
import { Sidebar } from './components/Sidebar';
import { BenchmarkView } from './components/BenchmarkView';
import './App.css';

function App() {
  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBenchmarkData()
      .then(({ hierarchy }) => {
        setHierarchy(hierarchy);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load benchmark data:', err);
        setError('Failed to load benchmark data. Run benchmarks first with: ./scripts/run_benchmarks.sh');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading benchmark data...</p>
      </div>
    );
  }

  if (error || !hierarchy) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        hierarchy={hierarchy}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
      />
      <BenchmarkView
        hierarchy={hierarchy}
        selectedPath={selectedPath}
      />
    </div>
  );
}

export default App;
