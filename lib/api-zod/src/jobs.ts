import * as zod from "zod";

export const JobStatus = zod.enum(["pending", "processing", "completed", "failed"]);

export const JobType = zod.enum(["card_creation"]);

export const GetJobParams = zod.object({
  jobId: zod.coerce.number(),
});

export const GetJobResponse = zod.object({
  id: zod.number(),
  userId: zod.number(),
  type: zod.string(),
  status: JobStatus,
  result: zod.unknown().nullish(),
  error: zod.string().nullish(),
  createdAt: zod.string(),
  updatedAt: zod.string(),
});

export const CreateJobBody = zod.object({
  type: JobType,
});

export const CreateJobResponse = zod.object({
  id: zod.number(),
  userId: zod.number(),
  type: zod.string(),
  status: JobStatus,
  createdAt: zod.string(),
  updatedAt: zod.string(),
});

export const CardCreationResponse = zod.object({
  jobId: zod.number(),
}).passthrough();
