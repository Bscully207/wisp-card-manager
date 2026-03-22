import { db, jobsTable } from "@workspace/db";
import type { JobStatus, JobType } from "@workspace/db";
import { eq, and } from "drizzle-orm";

interface CreateJobOptions {
  userId: number;
  type: JobType;
}

export async function createJob({ userId, type }: CreateJobOptions) {
  const [job] = await db.insert(jobsTable).values({
    userId,
    type,
    status: "pending",
  }).returning();
  return job;
}

export async function getJobById(jobId: number, userId: number) {
  const [job] = await db.select().from(jobsTable).where(
    and(eq(jobsTable.id, jobId), eq(jobsTable.userId, userId))
  );
  return job ?? null;
}

export async function updateJobStatus(
  jobId: number,
  status: JobStatus,
  result?: unknown,
  error?: string
) {
  const [job] = await db.update(jobsTable)
    .set({
      status,
      result: result ?? null,
      error: error ?? null,
    })
    .where(eq(jobsTable.id, jobId))
    .returning();
  return job ?? null;
}

export async function completeJobWithResult(jobId: number, result: unknown) {
  return updateJobStatus(jobId, "completed", result);
}

export async function failJob(jobId: number, error: string) {
  return updateJobStatus(jobId, "failed", undefined, error);
}
