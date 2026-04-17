import type { BinaryLine, TextLine } from "./models";
import { mergeUint8Arrays } from "../utils/typeArrays";
import { LineTerminator } from "../models";
import { enumerate } from "../utils/iterables";
import type { ReaderSettings } from "./settings";

export function readBinaryLines(
	data: Iterable<Uint8Array>,
	settings: ReaderSettings,
): Generator<BinaryLine> {
	return RawLineGenerators[settings.ln](data);
}

export function readBinaryLinesAsync(
	data: Iterable<Uint8Array> | AsyncIterable<Uint8Array>,
	settings: ReaderSettings,
): AsyncGenerator<BinaryLine> {
	return RawLineGeneratorsAsync[settings.ln](data);
}

export function* readTextLines(
	data: string,
	settings: ReaderSettings,
): Generator<TextLine> {
	let u16Char = 0;

	// remove BOM if present
	if (data.startsWith("\uFEFF")) {
		data = data.slice(1);
		u16Char++;
	}

	for (const [i, text] of enumerate(
		data.split(LineTerminatorRegex[settings.ln]),
	)) {
		// even is text, odd is line terminator
		if (i % 2 === 0) {
			yield { loc: { u16Char, line: i / 2 }, text };
		}
		u16Char += text.length;
	}
}

type ReadBinaryState = {
	/** buffer for incomplete lines */
	buffer: Uint8Array[];
	/** current line */
	line: number;
};

/** Iterate over lines separated with mixed line terminators (sequence of CR and LF) without decoding */
function* readRawLines(
	chunks: Iterable<Uint8Array>,
	isLineTerminator: (byte: number) => boolean,
): Generator<BinaryLine> {
	const s: ReadBinaryState = { buffer: [], line: 0 };
	let offset = 0;

	for (let chunk of chunks) {
		if (!chunk.length) continue;

		// merge the first chunks to have at least 3 bytes for BOM detection
		if (offset <= 2 && s.buffer.length) {
			chunk = mergeUint8Arrays(...s.buffer, chunk);
			offset -= s.buffer.reduce((sum, b) => sum + b.length, 0);
			s.buffer.length = 0;
		}
		// detect and remove BOM \uFEFF (0xEF,0xBB,0xBF)
		if (
			offset == 0 &&
			chunk.length >= 3 &&
			chunk[0] == 0xef &&
			chunk[1] == 0xbb &&
			chunk[2] == 0xbf
		) {
			chunk = chunk.subarray(3);
			offset += 3;
		}

		yield* parseChunkRawLines(chunk, offset, s, isLineTerminator);
		offset += chunk.length;
	}

	if (s.buffer.length) {
		const data = mergeUint8Arrays(...s.buffer);
		yield { data, loc: { line: s.line++, byte: offset - data.length } };
	}
}

async function* readRawLinesAsync(
	chunks: Iterable<Uint8Array> | AsyncIterable<Uint8Array>,
	isLineTerminator: (byte: number) => boolean,
): AsyncGenerator<BinaryLine> {
	const s: ReadBinaryState = { buffer: [], line: 0 };
	let offset = 0;

	for await (const chunk of chunks) {
		yield* parseChunkRawLines(chunk, offset, s, isLineTerminator);
		offset += chunk.length;
	}

	if (s.buffer.length) {
		const data = mergeUint8Arrays(...s.buffer);
		yield { data, loc: { byte: offset - data.length, line: s.line++ } };
	}
}

/** Iterate over lines separated with CRLF line terminators without decoding */
function* readRawLinesCRLF(
	chunks: Iterable<Uint8Array>,
): Generator<BinaryLine> {
	const s: ReadBinaryState = { buffer: [], line: 0 };
	let offset = 0;

	for (let chunk of chunks) {
		if (!chunk.length) continue;

		// merge the first chunks to have at least 3 bytes for BOM detection
		if (offset <= 2 && s.buffer.length) {
			chunk = mergeUint8Arrays(...s.buffer, chunk);
			offset -= s.buffer.reduce((sum, b) => sum + b.length, 0);
			s.buffer.length = 0;
		}
		// detect and remove BOM \uFEFF (0xEF,0xBB,0xBF)
		if (
			offset == 0 &&
			chunk.length >= 3 &&
			chunk[0] == 0xef &&
			chunk[1] == 0xbb &&
			chunk[2] == 0xbf
		) {
			chunk = chunk.subarray(3);
			offset += 3;
		}

		yield* parseChunkRawLinesCRLF(chunk, offset, s);
		offset += chunk.length;
	}

	if (s.buffer.length) {
		const data = mergeUint8Arrays(...s.buffer);
		yield { data, loc: { byte: offset - data.length, line: s.line++ } };
	}
}

async function* readRawLinesCRLFAsync(
	chunks: Iterable<Uint8Array> | AsyncIterable<Uint8Array>,
): AsyncGenerator<BinaryLine> {
	const s: ReadBinaryState = { buffer: [], line: 0 };
	let offset = 0;

	for await (const chunk of chunks) {
		yield* parseChunkRawLinesCRLF(chunk, offset, s);
		offset += chunk.length;
	}

	if (s.buffer.length) {
		const data = mergeUint8Arrays(...s.buffer);
		yield { data, loc: { byte: offset - data.length, line: s.line++ } };
	}
}

/** Parse a chunk into lines, using the buffer for incomplete lines */
function* parseChunkRawLines(
	chunk: Uint8Array,
	offset: number,
	s: ReadBinaryState,
	isLineTerminator: (byte: number) => boolean,
): Generator<BinaryLine> {
	let start = 0;
	while (start < chunk.length) {
		const pos = start + chunk.subarray(start).findIndex(isLineTerminator);
		if (pos < start) break;
		let data = chunk.subarray(start, pos);
		let byte = offset + start;
		if (s.buffer.length) {
			data = mergeUint8Arrays(...s.buffer, data);
			byte = offset + start - data.length;
			s.buffer.length = 0;
		}
		if (data.length) {
			yield { data, loc: { byte, line: s.line++ } };
		}
		start = pos + 1;
	}
	if (start < chunk.length) {
		s.buffer.push(chunk.subarray(start));
	}
}

/** Parse a chunk into lines, CRLF-terminated, using the buffer for incomplete lines */
function* parseChunkRawLinesCRLF(
	chunk: Uint8Array,
	offset: number,
	s: ReadBinaryState,
): Generator<BinaryLine> {
	let start = 0;
	while (start < chunk.length) {
		const pos = start + chunk.subarray(start).findIndex(isLf);
		if (pos < start) break;
		let data = chunk.subarray(start, pos);
		let byte = offset + start;
		if (s.buffer.length) {
			data = mergeUint8Arrays(...s.buffer, data);
			byte = offset + start - data.length;
			s.buffer.length = 0;
		}
		if (data.length && isCr(data[data.length - 1])) {
			yield {
				data: data.subarray(0, data.length - 1),
				loc: { byte, line: s.line++ },
			};
		} else {
			s.buffer.push(data, LF_TOKEN);
		}
		start = pos + 1;
	}
	if (start < chunk.length) {
		s.buffer.push(chunk.subarray(start));
	}
}

const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);

const isCr = (byte: number) => byte === CR;
const isLf = (byte: number) => byte === LF;
const isCrOrLf = (byte: number) => byte === CR || byte === LF;

const LineTerminatorRegex: { [key in LineTerminator]: RegExp } = {
	[LineTerminator.CRLF]: /(\r\n)/g,
	[LineTerminator.CR]: /(\r)/g,
	[LineTerminator.LF]: /(\n)/g,
	[LineTerminator.MIXED]: /([\r\n]+)/g,
};

const RawLineGenerators: {
	[key in LineTerminator]: (
		data: Iterable<Uint8Array>,
	) => Generator<BinaryLine>;
} = {
	[LineTerminator.CRLF]: readRawLinesCRLF,
	[LineTerminator.CR]: (data) => readRawLines(data, isCr),
	[LineTerminator.LF]: (data) => readRawLines(data, isLf),
	[LineTerminator.MIXED]: (data) => readRawLines(data, isCrOrLf),
};

const RawLineGeneratorsAsync: {
	[key in LineTerminator]: (
		data: Iterable<Uint8Array> | AsyncIterable<Uint8Array>,
	) => AsyncGenerator<BinaryLine>;
} = {
	[LineTerminator.CRLF]: readRawLinesCRLFAsync,
	[LineTerminator.CR]: (data) => readRawLinesAsync(data, isCr),
	[LineTerminator.LF]: (data) => readRawLinesAsync(data, isLf),
	[LineTerminator.MIXED]: (data) => readRawLinesAsync(data, isCrOrLf),
};

const LF_TOKEN = new Uint8Array([LF]);
