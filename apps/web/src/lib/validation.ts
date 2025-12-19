import { z } from "zod";

export const WorkStartBody = z.object({
  source: z.string().min(1).optional(), // "manual" など
});

export const BreakStartBody = z.object({
  kind: z.string().min(1).optional(), // "manual" など
});
