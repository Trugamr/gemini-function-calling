import { env } from "./lib/env";
import { type Content, GoogleGenerativeAI } from "@google/generative-ai";
import readline from "node:readline/promises";

const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const terminal = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const contents: Content[] = [];

while (true) {
	const prompt = await terminal.question("Enter a prompt: ");
	contents.push({
		role: "user",
		parts: [{ text: prompt }],
	});

	const result = await model.generateContentStream({
		contents,
	});

	let answer = "";
	process.stdout.write("Assistant: ");

	for await (const delta of result.stream) {
		const text = delta.text();
		answer += text;

		process.stdout.write(text);
	}

	process.stdout.write("\n\n");
	contents.push({
		role: "model",
		parts: [{ text: answer }],
	});
}
