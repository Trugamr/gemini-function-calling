import { env } from "./lib/env";
import {
	FunctionCallingMode,
	FunctionDeclarationSchemaType,
	type FunctionResponse,
	GoogleGenerativeAI,
	type Tool,
} from "@google/generative-ai";
import readline from "node:readline/promises";
import logger from "./lib/logger";

const terminal = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({
	model: "gemini-1.5-pro-latest",
	systemInstruction:
		"You are a helpful assistant that can answer questions and provide information.",
});

// Define tools and implement functions
const tools: Tool[] = [
	{
		functionDeclarations: [
			{
				name: "getTimeByTimezone",
				parameters: {
					type: FunctionDeclarationSchemaType.OBJECT,
					properties: {
						timeZone: {
							type: FunctionDeclarationSchemaType.STRING,
							description: "The timezone to get the time for",
						},
					},
					required: ["timeZone"],
				},
			},
		],
	},
];

const functions = {
	getTimeByTimezone({ timeZone }: { timeZone: string }) {
		return {
			time: new Date().toLocaleString("en-US", { timeZone }),
		};
	},
};

// Start chat with model
const chat = model.startChat({
	tools,
	toolConfig: {
		functionCallingConfig: { mode: FunctionCallingMode.MODE_UNSPECIFIED },
	},
});

while (true) {
	const input = await terminal.question("You: ");

	const { response } = await chat.sendMessage([
		{
			text: input,
		},
	]);

	const calls = response.functionCalls();
	if (calls) {
		const responses: FunctionResponse[] = [];

		logger.debug("Model asked for %d function calls", calls.length);

		for (const call of calls) {
			logger.debug("Calling function %s with args %o", call.name, call.args);

			const result = functions[call.name](call.args);
			responses.push({
				name: call.name,
				response: result,
			});
		}

		logger.debug("Sending function call responses to model");
		// Send results to model
		const { response } = await chat.sendMessage(
			responses.map((item) => {
				return {
					functionResponse: item,
				};
			}),
		);

		// TODO: Handle subsequent function calls

		process.stdout.write(`Model: ${response.text()}\n`);
	} else {
		process.stdout.write(`Model: ${response.text()}\n`);
	}
}
