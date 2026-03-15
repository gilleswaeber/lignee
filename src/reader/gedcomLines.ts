import { LineTerminator } from "../models.js";
import {
	processTextLines,
	processBinaryLines,
	processBinaryLinesAsync,
} from "./continuation.js";
import {
	readTextLines,
	readBinaryLines,
	readBinaryLinesAsync,
} from "./lines.js";
import type { GedcomLine } from "./models.js";
import { Status } from "../status.js";

export function readGedcomLines(
	data: string | Uint8Array | Iterable<Uint8Array>,
	lineTerminator: LineTerminator = LineTerminator.MIXED,
	status: Status,
): Generator<GedcomLine> {
	if (typeof data === "string") {
		const lines = readTextLines(data, lineTerminator);
		return processTextLines(lines, status);
	} else {
		if (data instanceof Uint8Array) data = [data];
		const lines = readBinaryLines(data, lineTerminator);
		return processBinaryLines(lines, status);
	}
}

export async function* readGedcomLinesAsync(
	data: AsyncIterable<Uint8Array>,
	lineTerminator: LineTerminator = LineTerminator.MIXED,
	status: Status,
): AsyncGenerator<GedcomLine> {
	return processBinaryLinesAsync(
		readBinaryLinesAsync(data, lineTerminator),
		status,
	);
}
