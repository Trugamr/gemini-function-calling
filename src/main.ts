import { env } from "./lib/env";
import {
	FunctionDeclarationSchemaType,
	GoogleGenerativeAI,
	type Tool,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({
	model: "gemini-1.5-pro-latest",
	systemInstruction:
		"You are a helpful assistant that can answer questions and provide information.",
});

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

const chat = model.startChat({
	tools,
});

const { response } = await chat.sendMessage([
	{
		text: "What is current time of day i.e morning, afternoon, evening or night in India?",
	},
]);

// Check if model is asking for a tool
const call = response.functionCalls()?.[0];

if (call) {
	console.log(
		`[DEBUG] Calling function: ${call.name} with args: ${JSON.stringify(
			call.args,
		)}`,
	);

	const result = functions[call.name](call.args);

	console.log("[DEBUG] Sending result to model");
	const { response } = await chat.sendMessage([
		{
			functionResponse: {
				name: call.name,
				response: result,
			},
		},
	]);

	process.stdout.write(`Model: ${response.text()}`);
} else {
	process.stdout.write(`Model: ${response.text()}`);
}
