import {
	processBinaryLines,
	processBinaryLinesAsync,
	processTextLines,
} from "./continuation";
import { readBinaryLines, readBinaryLinesAsync, readTextLines } from "./lines";
import type { GedcomLine } from "./models";
import { Status } from "../status";
import type { ReaderSettings } from "./settings";

export function readGedcomLines(
	data: string | Uint8Array | Iterable<Uint8Array>,
	settings: ReaderSettings,
	status: Status,
): Generator<GedcomLine> {
	if (typeof data === "string") {
		const lines = readTextLines(data, settings);
		return processTextLines(lines, settings, status);
	} else {
		if (data instanceof Uint8Array) data = [data];
		const lines = readBinaryLines(data, settings);
		return processBinaryLines(lines, settings, status);
	}
}

export function readGedcomLinesAsync(
	data: AsyncIterable<Uint8Array>,
	settings: ReaderSettings,
	status: Status,
): AsyncGenerator<GedcomLine> {
	return processBinaryLinesAsync(
		readBinaryLinesAsync(data, settings),
		settings,
		status,
	);
}
