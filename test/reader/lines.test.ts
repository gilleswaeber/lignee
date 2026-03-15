import {assert, describe, test} from "vitest";
import {readBinaryLines, readBinaryLinesAsync, readTextLines,} from "../../src/reader/lines";
import type {BinaryLine, TextLine} from "../../src/reader/models";
import {LineTerminator} from "../../src/models";
import {Status} from "../../src/status";

const minimalGedcom = [
	"0 HEAD", // 0-6
	"1 SOUR TestSource", // 7-24
	"1 GEDC", // 25-31
	"2 VERS 5.5.1", // 32-44
	"2 FORM LINEAGE-LINKED", // 45-66
	"0 TRLR", // 67-73
];

describe("readTextLines", () => {
	test("readTextLines on simple input", () => {
		const input = minimalGedcom.join("\n");
		const status = new Status();

		const expectedLines: TextLine[] = [
			{ loc: { u16Char: 0, line: 0 }, text: "0 HEAD" },
			{ loc: { u16Char: 7, line: 1 }, text: "1 SOUR TestSource" },
			{ loc: { u16Char: 25, line: 2 }, text: "1 GEDC" },
			{ loc: { u16Char: 32, line: 3 }, text: "2 VERS 5.5.1" },
			{ loc: { u16Char: 45, line: 4 }, text: "2 FORM LINEAGE-LINKED" },
			{ loc: { u16Char: 67, line: 5 }, text: "0 TRLR" },
		];

		const lines = Array.from(readTextLines(input, LineTerminator.MIXED));

		assert.deepEqual(lines, expectedLines);
		assert.deepEqual(status.warnings, []);
	});

	test("readTextLines with different line endings", () => {
		const inputs = {
			LF: minimalGedcom.join("\n"),
			CR: minimalGedcom.join("\r"),
			CRLF: minimalGedcom.join("\r\n"),
			MIXED: `${minimalGedcom[0]}\r${minimalGedcom[1]}\n\n${minimalGedcom[2]}\r\n${minimalGedcom[3]}\r\n${minimalGedcom[4]}\n\r${minimalGedcom[5]}`,
		};

		for (const [terminator, input] of Object.entries(inputs)) {
			const lines = Array.from(
				readTextLines(input, terminator as LineTerminator),
			).map((line) => line.text);
			assert.deepEqual(
				lines,
				minimalGedcom,
				`Failed for terminator: ${terminator}`,
			);
		}
	});

	test("readTextLines with CRLF endings", () => {
		const input = `AA\r\nB\nB\r\nC\rC\r\nD\n\rD`;
		const expectedLines = ["AA", "B\nB", "C\rC", "D\n\rD"];
		const lines = Array.from(readTextLines(input, LineTerminator.CRLF)).map(
			(line) => line.text,
		);
		assert.deepEqual(lines, expectedLines);
	});

	test("readTextLines with indentation", () => {
		const input = minimalGedcom
			.map((line) => "".repeat(parseInt(line[0]) * 2) + line)
			.join("\n");
		const lines = Array.from(readTextLines(input, LineTerminator.MIXED)).map(
			(line) => line.text,
		);
		assert.deepEqual(lines, minimalGedcom);
	});

	test("readTextLines with BOM", () => {
		const input = "\uFEFF" + minimalGedcom.join("\n");
		const textLines = Array.from(readTextLines(input, LineTerminator.MIXED));
		const lines = textLines.map((line) => line.text);
		assert.deepEqual(lines, minimalGedcom);
		assert.equal(textLines[0].loc.u16Char, 1);
	});
});

describe("readBinaryLines", () => {
	test("readBinaryLines on simple input", () => {
		const input = UTF8_ENCODER.encode(minimalGedcom.join("\n"));
		const status = new Status();

		const expectedLines: BinaryLine[] = [
			{ loc: { byte: 0, line: 0 }, data: UTF8_ENCODER.encode("0 HEAD") },
			{
				loc: { byte: 7, line: 1 },
				data: UTF8_ENCODER.encode("1 SOUR TestSource"),
			},
			{ loc: { byte: 25, line: 2 }, data: UTF8_ENCODER.encode("1 GEDC") },
			{ loc: { byte: 32, line: 3 }, data: UTF8_ENCODER.encode("2 VERS 5.5.1") },
			{
				loc: { byte: 45, line: 4 },
				data: UTF8_ENCODER.encode("2 FORM LINEAGE-LINKED"),
			},
			{ loc: { byte: 67, line: 5 }, data: UTF8_ENCODER.encode("0 TRLR") },
		];

		const lines = Array.from(readBinaryLines([input], LineTerminator.MIXED));

		assert.deepEqual(lines, expectedLines);
		assert.deepEqual(status.warnings, []);
	});

	test("readBinaryLines with different line endings", () => {
		const inputs = {
			LF: UTF8_ENCODER.encode(minimalGedcom.join("\n")),
			CR: UTF8_ENCODER.encode(minimalGedcom.join("\r")),
			CRLF: UTF8_ENCODER.encode(minimalGedcom.join("\r\n")),
			MIXED: UTF8_ENCODER.encode(
				`${minimalGedcom[0]}\r${minimalGedcom[1]}\n\n${minimalGedcom[2]}\r\n${minimalGedcom[3]}\r\n${minimalGedcom[4]}\n\r${minimalGedcom[5]}`,
			),
		};

		for (const [terminator, input] of Object.entries(inputs)) {
			const lines = Array.from(
				readBinaryLines([input], terminator as LineTerminator),
			).map((line) => UTF8_DECODER.decode(line.data));
			assert.deepEqual(
				lines,
				minimalGedcom,
				`Failed for terminator: ${terminator}`,
			);
		}
	});

	test("readBinaryLines with CRLF endings", () => {
		const input = UTF8_ENCODER.encode(`AA\r\nB\nB\r\nC\rC\r\nD\n\rD`);
		const expectedLines = ["AA", "B\nB", "C\rC", "D\n\rD"];
		const lines = Array.from(readBinaryLines([input], LineTerminator.CRLF)).map(
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, expectedLines);
	});

	test("readBinaryLines with line-aligned chunks", () => {
		const chunks = minimalGedcom.map((line) =>
			UTF8_ENCODER.encode(line + "\n"),
		);

		const lines = Array.from(readBinaryLines(chunks, LineTerminator.MIXED)).map(
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, minimalGedcom);
	});

	test("readBinaryLines with arbitrary chunks", () => {
		const fullData = UTF8_ENCODER.encode(minimalGedcom.join("\n"));
		const chunkSizes = [1, 2, 3, 5, 8, 13, 21, 34];

		const chunks = [];
		let offset = 0;
		for (const size of chunkSizes) {
			chunks.push(fullData.subarray(offset, offset + size));
			offset += size;
		}

		const lines = Array.from(readBinaryLines(chunks, LineTerminator.MIXED)).map(
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, minimalGedcom);
	});

	test("readBinaryLines with cut on CRLF", () => {
		const chunks = [
			"AA\r",
			"\nB\nB\r\nC\r",
			"C\r\n",
			"D\n\rD",
			"DD",
			"\r\nEE",
		].map((part) => UTF8_ENCODER.encode(part));
		const expectedLines = ["AA", "B\nB", "C\rC", "D\n\rDDD", "EE"];

		const lines = Array.from(readBinaryLines(chunks, LineTerminator.CRLF)).map(
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, expectedLines);
	});

	test.each([
		{ ln: LineTerminator.MIXED, sep: "\n" },
		{ ln: LineTerminator.LF, sep: "\n" },
		{ ln: LineTerminator.CRLF, sep: "\r\n" },
	])("readBinaryLines with indentation with $ln terminator", ({ ln, sep }) => {
		const input = UTF8_ENCODER.encode(
			minimalGedcom
				.map((line) => "".repeat(parseInt(line[0]) * 2) + line)
				.join(sep),
		);
		const lines = Array.from(readBinaryLines([input], ln)).map((line) =>
			UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, minimalGedcom);
	});
});

describe("readBinaryLinesAsync", () => {
	test("readBinaryLinesAsync on simple input", async () => {
		const input = UTF8_ENCODER.encode(minimalGedcom.join("\n"));
		const status = new Status();

		const expectedLines: BinaryLine[] = [
			{ loc: { byte: 0, line: 0 }, data: UTF8_ENCODER.encode("0 HEAD") },
			{
				loc: { byte: 7, line: 1 },
				data: UTF8_ENCODER.encode("1 SOUR TestSource"),
			},
			{ loc: { byte: 25, line: 2 }, data: UTF8_ENCODER.encode("1 GEDC") },
			{ loc: { byte: 32, line: 3 }, data: UTF8_ENCODER.encode("2 VERS 5.5.1") },
			{
				loc: { byte: 45, line: 4 },
				data: UTF8_ENCODER.encode("2 FORM LINEAGE-LINKED"),
			},
			{ loc: { byte: 67, line: 5 }, data: UTF8_ENCODER.encode("0 TRLR") },
		];

		const lines = await Array.fromAsync(
			readBinaryLinesAsync([input], LineTerminator.MIXED),
		);

		assert.deepEqual(lines, expectedLines);
		assert.deepEqual(status.warnings, []);
	});

	test("readBinaryLinesAsync with different line endings", async () => {
		const inputs = {
			LF: UTF8_ENCODER.encode(minimalGedcom.join("\n")),
			CR: UTF8_ENCODER.encode(minimalGedcom.join("\r")),
			CRLF: UTF8_ENCODER.encode(minimalGedcom.join("\r\n")),
			MIXED: UTF8_ENCODER.encode(
				`${minimalGedcom[0]}\r${minimalGedcom[1]}\n\n${minimalGedcom[2]}\r\n${minimalGedcom[3]}\r\n${minimalGedcom[4]}\n\r${minimalGedcom[5]}`,
			),
		};

		for (const [terminator, input] of Object.entries(inputs)) {
			const lines = await Array.fromAsync(
				readBinaryLinesAsync([input], terminator as LineTerminator),
				(line) => UTF8_DECODER.decode(line.data),
			);
			assert.deepEqual(
				lines,
				minimalGedcom,
				`Failed for terminator: ${terminator}`,
			);
		}
	});

	test("readBinaryLinesAsync with CRLF endings", async () => {
		const input = UTF8_ENCODER.encode(`AA\r\nB\nB\r\nC\rC\r\nD\n\rD`);
		const expectedLines = ["AA", "B\nB", "C\rC", "D\n\rD"];
		const lines = await Array.fromAsync(
			readBinaryLinesAsync([input], LineTerminator.CRLF),
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, expectedLines);
	});

	test("readBinaryLinesAsync with line-aligned chunks", async () => {
		const chunks = minimalGedcom.map((line) =>
			UTF8_ENCODER.encode(line + "\n"),
		);

		const lines = await Array.fromAsync(
			readBinaryLinesAsync(chunks, LineTerminator.MIXED),
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, minimalGedcom);
	});

	test("readBinaryLinesAsync with arbitrary chunks", async () => {
		const fullData = UTF8_ENCODER.encode(minimalGedcom.join("\n"));
		const chunkSizes = [1, 2, 3, 5, 8, 13, 21, 34];

		const chunks = [];
		let offset = 0;
		for (const size of chunkSizes) {
			chunks.push(fullData.subarray(offset, offset + size));
			offset += size;
		}

		const lines = await Array.fromAsync(
			readBinaryLinesAsync(chunks, LineTerminator.MIXED),
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, minimalGedcom);
	});

	test("readBinaryLinesAsync with cut on CRLF", () => {
		const chunks = [
			"AA\r",
			"\nB\nB\r\nC\r",
			"C\r\n",
			"D\n\rD",
			"DD",
			"\r\nEE",
		].map((part) => UTF8_ENCODER.encode(part));
		const expectedLines = ["AA", "B\nB", "C\rC", "D\n\rDDD", "EE"];

		const lines = Array.from(readBinaryLines(chunks, LineTerminator.CRLF)).map(
			(line) => UTF8_DECODER.decode(line.data),
		);
		assert.deepEqual(lines, expectedLines);
	});
});

const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder();
