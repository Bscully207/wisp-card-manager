import { useState, useEffect, useRef, useCallback } from "react";
import { getJob, type Job, type JobStatus } from "@workspace/api-client-react";

interface UseJobPollingOptions {
  jobId: number | null;
  interval?: number;
}

interface UseJobPollingResult {
  job: Job | null;
  status: JobStatus | null;
  isPolling: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  error: string | null;
  retry: () => void;
}

export function useJobPolling({
  jobId,
  interval = 1500,
}: UseJobPollingOptions): UseJobPollingResult {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async (id: number) => {
    if (!mountedRef.current) return;

    try {
      const result = await getJob(id);
      if (!mountedRef.current) return;

      setJob(result);
      setError(null);

      if (result.status === "completed" || result.status === "failed") {
        setIsPolling(false);
        return;
      }

      timerRef.current = setTimeout(() => poll(id), interval);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to check job status");
      setIsPolling(false);
    }
  }, [interval]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    clearTimer();
    setJob(null);
    setError(null);

    if (jobId !== null && jobId > 0) {
      setIsPolling(true);
      poll(jobId);
    } else {
      setIsPolling(false);
    }

    return clearTimer;
  }, [jobId, poll, clearTimer]);

  const retry = useCallback(() => {
    if (jobId !== null && jobId > 0) {
      setIsPolling(true);
      setError(null);
      poll(jobId);
    }
  }, [jobId, poll]);

  const status = job?.status ?? (isPolling ? "pending" : null);

  return {
    job,
    status,
    isPolling,
    isCompleted: job?.status === "completed",
    isFailed: job?.status === "failed",
    error,
    retry,
  };
}
