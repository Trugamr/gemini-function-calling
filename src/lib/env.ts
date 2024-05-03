import { z } from "zod";

export const env = z
	.object({
		GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
	})
	.parse(process.env);
