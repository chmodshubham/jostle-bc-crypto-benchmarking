/**
 * Export utilities for downloading visualizations as PNG
 */

import { toPng } from 'html-to-image';

/**
 * Download a DOM element as a PNG image
 */
export async function downloadAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2, // Higher quality
      cacheBust: true,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting PNG:', error);
    throw error;
  }
}

/**
 * Format a filename from benchmark path
 */
export function formatFilename(path: string, suffix?: string): string {
  const base = path
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .toLowerCase();

  const timestamp = new Date().toISOString().slice(0, 10);

  if (suffix) {
    return `jmh-${base}-${suffix}-${timestamp}`;
  }
  return `jmh-${base}-${timestamp}`;
}
