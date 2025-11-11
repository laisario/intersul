import { z } from "zod/v4";
import type { Service } from "$lib/api/types/service.types.js";

export const schema = z.object({
	id: z.number(),
	description: z.string().optional(),
	client: z.object({
		id: z.number(),
		name: z.string(),
		email: z.string().optional(),
	}),
	category: z.object({
		id: z.number(),
		name: z.string(),
		description: z.string().optional(),
		color: z.string().optional(),
	}),
	created_at: z.string(),
	updated_at: z.string(),
	steps: z.array(z.any()).optional().default([]),
	// Additional properties for service form
	assignedTo: z.object({
		id: z.number(),
		name: z.string(),
	}).optional(),
	clientCopyMachineId: z.number().optional(),
});

export type Schema = z.infer<typeof schema>;
