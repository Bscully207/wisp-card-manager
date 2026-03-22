import { useQuery } from "@tanstack/react-query";
import type {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";

export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type JobType = "card_creation";

export interface CardCreationResponse {
  jobId: number;
  [key: string]: unknown;
}

export interface Job {
  id: number;
  userId: number;
  type: JobType;
  status: JobStatus;
  result: unknown;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getGetJobUrl = (jobId: number) => {
  return `/api/jobs/${jobId}`;
};

export const getJob = async (
  jobId: number,
  options?: RequestInit,
): Promise<Job> => {
  return customFetch<Job>(getGetJobUrl(jobId), {
    ...options,
    method: "GET",
  });
};

export const getGetJobQueryKey = (jobId: number) => {
  return [`/api/jobs/${jobId}`] as const;
};

export const getGetJobQueryOptions = <
  TData = Job,
  TError = ErrorType<unknown>,
>(
  jobId: number,
  options?: {
    query?: UseQueryOptions<Job, TError, TData>;
  },
) => {
  const { query: queryOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getGetJobQueryKey(jobId);

  const queryFn: QueryFunction<Job> = ({ signal }) =>
    getJob(jobId, { signal });

  return {
    queryKey,
    queryFn,
    enabled: jobId > 0,
    ...queryOptions,
  } as UseQueryOptions<Job, TError, TData> & { queryKey: QueryKey };
};

export function useGetJob<
  TData = Job,
  TError = ErrorType<unknown>,
>(
  jobId: number,
  options?: {
    query?: UseQueryOptions<Job, TError, TData>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetJobQueryOptions(jobId, options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}
