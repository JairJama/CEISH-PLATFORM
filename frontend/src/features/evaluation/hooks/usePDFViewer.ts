import { useState, useCallback, useRef } from 'react';

interface PDFViewerState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  isLoading: boolean;
  pdfFile: File | string | null;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;

export function usePDFViewer() {
  const [state, setState] = useState<PDFViewerState>({
    currentPage: 1,
    totalPages: 0,
    zoom: 1.0,
    isLoading: false,
    pdfFile: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const setTotalPages = useCallback((total: number) => {
    setState((s) => ({ ...s, totalPages: total, isLoading: false }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setState((s) => ({
      ...s,
      currentPage: Math.max(1, Math.min(page, s.totalPages)),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState((s) => ({ ...s, currentPage: Math.min(s.currentPage + 1, s.totalPages) }));
  }, []);

  const prevPage = useCallback(() => {
    setState((s) => ({ ...s, currentPage: Math.max(s.currentPage - 1, 1) }));
  }, []);

  const zoomIn = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.min(+(s.zoom + ZOOM_STEP).toFixed(2), ZOOM_MAX) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.max(+(s.zoom - ZOOM_STEP).toFixed(2), ZOOM_MIN) }));
  }, []);

  const resetZoom = useCallback(() => {
    setState((s) => ({ ...s, zoom: 1.0 }));
  }, []);

  const loadFile = useCallback((file: File | string) => {
    setState((s) => ({
      ...s,
      pdfFile: file,
      currentPage: 1,
      totalPages: 0,
      isLoading: true,
    }));
  }, []);

  return {
    ...state,
    containerRef,
    setTotalPages,
    goToPage,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    resetZoom,
    loadFile,
  };
}
