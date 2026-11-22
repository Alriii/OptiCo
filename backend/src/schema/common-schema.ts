import { z } from "zod";

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const dateQuery = z.iso.date("Date must be YYYY-MM-DD");

export const paginationSchema = z.object({
  query: z.object(paginationQuery),
});

export const idParamsSchema = z.object({
  params: z.object({ id: z.uuid("A valid id is required") }),
});
