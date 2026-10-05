import { useState, useCallback, useRef, useEffect } from 'react';

export function useProcessing() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const startProcessing = useCallback(
    (rowCount: number, onComplete: () => void) => {
      // Clear any prior pending timers
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      setIsProcessing(true);
      setProgress(0);
      setStatusMessage('[WebSocket Connected] Ingesting CSV stream...');

      const formattedRows = rowCount ? rowCount.toLocaleString() : '14,205';

      const timeline: { progress: number; message: string; delay: number }[] = [
        { progress: 0, message: '[WebSocket Connected] Ingesting CSV stream...', delay: 0 },
        { progress: 35, message: `Parsing ${formattedRows} rows for protected attributes...`, delay: 650 },
        { progress: 68, message: 'Calculating intersectional disparate impact...', delay: 1350 },
        { progress: 89, message: 'Generating remediation weights (Kamiran-Calders)...', delay: 1950 },
        { progress: 100, message: 'Audit complete.', delay: 2500 },
      ];

      timeline.forEach((step) => {
        const timer = setTimeout(() => {
          setProgress(step.progress);
          setStatusMessage(step.message);

          if (step.progress === 100) {
            const finishTimer = setTimeout(() => {
              setIsProcessing(false);
              onComplete();
            }, 300);
            timersRef.current.push(finishTimer);
          }
        }, step.delay);
        timersRef.current.push(timer);
      });
    },
    []
  );

  const resetProcessing = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsProcessing(false);
    setProgress(0);
    setStatusMessage('');
  }, []);

  return {
    isProcessing,
    progress,
    statusMessage,
    startProcessing,
    resetProcessing,
  };
}
