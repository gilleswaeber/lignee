import type { BinaryLine, GedcomLine, TextLine } from "./models";
import { mergeUint8Arrays } from "../utils/typeArrays";
import { Status } from "../status";
import type { LineLocation } from "../models";

/**
 * Merge CONT and CONC lines, and decode the text. The bytes are decoded AFTER merging the lines since some
 * implementations split multibyte characters.
 */
export function* processBinaryLines(
	lines: Iterable<BinaryLine>,
	status: Status,
): Generator<GedcomLine> {
	const b = new BinaryContinuationBuffer();

	for (const data of lines) {
		yield* processBinaryLine(b, status, data);
	}
	yield* flushBinaryBuffer(b);
}

/**
 * Merge CONT and CONC lines, and decode the text. The bytes are decoded AFTER merging the lines since some
 * implementations split multibyte characters.
 */
export async function* processBinaryLinesAsync(
	lines: Iterable<BinaryLine> | AsyncIterable<BinaryLine>,
	status: Status,
): AsyncGenerator<GedcomLine> {
	const b = new BinaryContinuationBuffer();

	for await (const data of lines) {
		yield* processBinaryLine(b, status, data);
	}
	yield* flushBinaryBuffer(b);
}

function* processBinaryLine(
	b: BinaryContinuationBuffer,
	status: Status,
	{ loc, data }: BinaryLine,
): Generator<GedcomLine> {
	if (!data.length) return;
	let pos = 0;
	while (pos < data.length && isSpacing(data[pos])) pos++;
	const levelStart = pos;
	while (pos < data.length && isDigit(data[pos])) pos++;
	const levelEnd = pos;
	if (levelStart == levelEnd) {
		status.warn(
			loc,
			`[processBinaryLine] invalid line, no level, assuming implicit CONT: ${UTF8_DECODER.decode(data)}`,
		);
		b.buffer.push(LF_TOKEN, data);
		return;
	}
	const level = parseInt(
		UTF8_DECODER.decode(data.subarray(levelStart, levelEnd)),
	);
	while (pos < data.length && isSpacing(data[pos])) pos++;
	if (pos == levelEnd) {
		status.warn(
			loc,
			`[processBinaryLine] invalid line, no spacing after level, assuming implicit CONT: ${UTF8_DECODER.decode(data)}`,
		);
		b.buffer.push(LF_TOKEN, data);
		return;
	}
	const rest = data.subarray(pos);
	const isContinuation =
		rest.length >= 4 &&
		rest[0] == CHR_C &&
		rest[1] == CHR_O &&
		rest[2] == CHR_N &&
		(rest[3] == CHR_C || rest[3] == CHR_T) &&
		(rest.length == 4 || isSpacing(rest[4]));
	if (isContinuation) {
		pos += 5;
		if (level != b.bufferLevel + 1) {
			status.warn(
				loc,
				`[processBinaryLine] invalid level for continuation: ${level} (expected ${b.bufferLevel + 1})`,
			);
		}
		if (!b.buffer.length) {
			status.warn(
				loc,
				`[processBinaryLine] continuation without previous content`,
			);
			return;
		}
		if (rest[3] == CHR_C) {
			// CONC
			if (pos < data.length) {
				b.buffer.push(data.subarray(pos));
			}
		} else {
			// CONT
			b.buffer.push(LF_TOKEN);
			if (pos < data.length) {
				b.buffer.push(data.subarray(pos));
			}
		}
	} else {
		yield* flushBinaryBuffer(b);
		b.bufferLevel = level;
		b.loc = loc;
		b.buffer.push(data);
	}
}

function* flushBinaryBuffer(
	buffer: BinaryContinuationBuffer,
): Generator<GedcomLine> {
	if (!buffer.buffer.length) {
		// no data
	} else {
		const data = mergeUint8Arrays(...buffer.buffer);
		yield { loc: buffer.loc, text: UTF8_DECODER.decode(data) };
		buffer.buffer.length = 0;
	}
}

export function* processTextLines(
	lines: Iterable<TextLine>,
	status: Status,
): Generator<GedcomLine> {
	const b = new TextContinuationBuffer();

	for (const { loc, text } of lines) {
		if (!text.length) continue;
		const m = LINE_REGEX.exec(text);
		if (!m || !m.groups) {
			status.warnings.push({
				loc,
				message: `[processTextLines] invalid line, assuming implicit CONT: ${text}`,
			});
			b.buffer.push("\n", text);
			continue;
		}
		const level = parseInt(m.groups.level, 10);
		const tag = m.groups.tag;
		const rest = m.groups.rest;
		const isContinuation = tag === "CONC" || tag === "CONT";
		if (isContinuation) {
			if (level != b.bufferLevel + 1) {
				status.warn(
					loc,
					`[processTextLines] invalid level for continuation: ${level} (expected ${b.bufferLevel + 1})`,
				);
			}
			if (!b.buffer.length) {
				status.warn(
					loc,
					`[processTextLines] continuation without previous content`,
				);
				continue;
			}
			if (tag == "CONC") {
				// CONC
				if (rest && rest.length) {
					b.buffer.push(rest);
				}
			} else {
				// CONT
				b.buffer.push("\n");
				if (rest && rest.length) {
					b.buffer.push(rest);
				}
			}
		} else {
			yield* flushTextBuffer(b);
			b.bufferLevel = level;
			b.loc = loc;
			b.buffer.push(text);
		}
	}
	yield* flushTextBuffer(b);
}

function* flushTextBuffer(
	buffer: TextContinuationBuffer,
): Generator<GedcomLine> {
	if (!buffer.buffer.length) {
		// no data
	} else {
		const text = buffer.buffer.join("");
		yield { loc: buffer.loc, text };
		buffer.buffer.length = 0;
	}
}

const CHR_0 = "0".charCodeAt(0);
const CHR_9 = "9".charCodeAt(0);
const CHR_C = "C".charCodeAt(0);
const CHR_O = "O".charCodeAt(0);
const CHR_N = "N".charCodeAt(0);
const CHR_T = "T".charCodeAt(0);
const SPACE = " ".charCodeAt(0);
const TAB = "\t".charCodeAt(0);
const LF = "\n".charCodeAt(0);
const LINE_REGEX = /^\s*(?<level>\d+)\s+(?<tag>\S+)(?:\s(?<rest>.*))?$/;

const isDigit = (byte: number) => byte >= CHR_0 && byte <= CHR_9;
const isSpacing = (byte: number) => byte === SPACE || byte === TAB;

const LF_TOKEN = new Uint8Array([LF]);
const UTF8_DECODER = new TextDecoder("utf-8");

class BinaryContinuationBuffer {
	public buffer: Uint8Array[] = [];
	public bufferLevel: number = -1;
	public loc: LineLocation = {};
}

class TextContinuationBuffer {
	public buffer: string[] = [];
	public bufferLevel: number = -1;
	public loc: LineLocation = {};
}
