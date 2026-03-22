import { Router, type IRouter } from "express";
import { CreateJobBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";
import { getJobById, createJob } from "../services/job.service.js";

const router: IRouter = Router();

router.post("/jobs", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const job = await createJob({ userId: req.session.userId!, type: parsed.data.type });

  res.status(201).json({
    id: job.id,
    userId: job.userId,
    type: job.type,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

router.get("/jobs/:jobId", requireAuth, async (req, res): Promise<void> => {
  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const job = await getJobById(jobId, req.session.userId!);
  if (!job) {
    res.status(404).json({ error: "Not found", message: "Job not found" });
    return;
  }

  res.json({
    id: job.id,
    userId: job.userId,
    type: job.type,
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

export default router;
