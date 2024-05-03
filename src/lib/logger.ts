import pino from "pino";
import pretty from "pino-pretty";

const stream = pretty({
	colorize: true,
	ignore: "time,pid,hostname",
});

const logger = pino(stream);

export default logger;
