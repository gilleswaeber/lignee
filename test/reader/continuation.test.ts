import { describe, expect, test } from "vitest";
import {
	processBinaryLines,
	processBinaryLinesAsync,
	processTextLines,
} from "../../src/reader/continuation";
import { mergeUint8Arrays } from "../../src/utils/typeArrays";
import type { BinaryLine } from "../../src/reader/models";
import { Status } from "../../src/status";
import { WarningCode } from "../../src/models";
import { DefaultReaderSettings } from "../../src/reader/settings";
import {
	ContinuationWithoutPreviousContentError,
	InvalidGedcomLineError,
} from "../../src/reader/errors";

describe("processTextLines", () => {
	test("processTextLines with continuations", () => {
		const status = new Status();

		const input = [
			"0 NOTE This is a note",
			"",
			"1 CONC",
			" 1 CONT that continues on the next line. ",
			"1  CONC And this is concatenated.",
			"    0 NOTE Another note",
			"1 CONT",
			"\t1 CONT with continuation.",
		];

		const expected = [
			"0 NOTE This is a note\nthat continues on the next line. And this is concatenated.",
			"    0 NOTE Another note\n\nwith continuation.",
		];

		const lines = Array.from(
			processTextLines(
				input.map((text) => ({ loc: {}, text })),
				DefaultReaderSettings,
				status,
			),
		);
		const texts = lines.map((line) => line.text);
		expect(texts).toEqual(expected);
		expect(status.warnings).toHaveLength(0);
	});

	test("processTextLines with invalid level", () => {
		const status = new Status();

		const input = [
			"0 NOTE This is a note",
			"2 CONT bad level. ",
			"2 CONC also bad level.",
			"1 CONT this one is fine.",
		];

		const expected =
			"0 NOTE This is a note\nbad level. also bad level.\nthis one is fine.";

		const lines = Array.from(
			processTextLines(
				input.map((text, line) => ({ loc: { line }, text })),
				DefaultReaderSettings,
				status,
			),
		).map((line) => line.text);
		expect(lines).toEqual([expected]);
		expect(status.warnings).toHaveLength(2);
		expect(status.warnings[0].code).toBe(
			WarningCode.INVALID_LEVEL_CONTINUATION,
		);
		expect(status.warnings[0].loc.line).toBe(1);
		expect(status.warnings[1].code).toBe(
			WarningCode.INVALID_LEVEL_CONTINUATION,
		);
		expect(status.warnings[1].loc.line).toBe(2);
	});

	test.each([
		{ name: "CONT", inputs: ["0 CONT no previous content."] },
		{ name: "CONC", inputs: ["0 CONC no previous content."] },
		{
			name: "CONT+CONC",
			inputs: ["0 CONT no previous content.", "0 CONC no previous content."],
		},
	])("processTextLines without previous content for $name", ({ inputs }) => {
		expect(() =>
			Array.from(
				processTextLines(
					inputs.map((text, line) => ({ loc: { line }, text })),
					DefaultReaderSettings,
					new Status(),
				),
			),
		).toThrowError(ContinuationWithoutPreviousContentError);
	});

	test.each(["Invalid line", "0", "1TAG"])(
		"processTextLines with invalid line %s",
		(line) => {
			const status = new Status();
			expect(() =>
				Array.from(
					processTextLines(
						[{ loc: { line: 0 }, text: line }],
						DefaultReaderSettings,
						status,
					),
				),
			).toThrowError(InvalidGedcomLineError);
		},
	);
});

describe("processBinaryLines", () => {
	test("processBinaryLines with continuations", () => {
		const status = new Status();

		const input = [
			"0 NOTE This is a note",
			"",
			"1 CONC",
			" 1 CONT that continues on the next line. ",
			"1  CONC And this is concatenated.",
			"    0 NOTE Another note",
			"1 CONT",
			"\t1 CONT with continuation.",
		];

		const expected = [
			"0 NOTE This is a note\nthat continues on the next line. And this is concatenated.",
			"    0 NOTE Another note\n\nwith continuation.",
		];

		const lines = Array.from(
			processBinaryLines(
				input.map((text, line) => ({
					loc: { line },
					data: UTF8_ENCODER.encode(text),
				})),
				DefaultReaderSettings,
				status,
			),
		);
		const texts = lines.map((line) => line.text);
		expect(texts).toEqual(expected);
		expect(status.warnings).toHaveLength(0);
	});

	test("processBinaryLines with invalid level", () => {
		const status = new Status();

		const input = [
			"0 NOTE This is a note",
			"2 CONT bad level. ",
			"2 CONC also bad level.",
			"1 CONT this one is fine.",
		];

		const expected =
			"0 NOTE This is a note\nbad level. also bad level.\nthis one is fine.";

		const lines = Array.from(
			processBinaryLines(
				input.map((text, line) => ({
					loc: { line },
					data: UTF8_ENCODER.encode(text),
				})),
				DefaultReaderSettings,
				status,
			),
		).map((line) => line.text);
		expect(lines).toEqual([expected]);
		expect(status.warnings).toHaveLength(2);
		expect(status.warnings[0].code).toEqual(
			WarningCode.INVALID_LEVEL_CONTINUATION,
		);
		expect(status.warnings[0].loc.line).toBe(1);
		expect(status.warnings[1].code).toEqual(
			WarningCode.INVALID_LEVEL_CONTINUATION,
		);
		expect(status.warnings[1].loc.line).toBe(2);
	});

	test.each([
		{ name: "CONT", inputs: ["0 CONT no previous content."] },
		{ name: "CONC", inputs: ["0 CONC no previous content."] },
		{
			name: "CONT+CONC",
			inputs: ["0 CONT no previous content.", "0 CONC no previous content."],
		},
	])("processBinaryLines without previous content for $name", ({ inputs }) => {
		expect(() =>
			Array.from(
				processBinaryLines(
					inputs.map((text, line) => ({
						loc: { line },
						data: UTF8_ENCODER.encode(text),
					})),
					DefaultReaderSettings,
					new Status(),
				),
			),
		).toThrowError(ContinuationWithoutPreviousContentError);
	});

	test.each(["Invalid line", "0", "1TAG"])(
		"processBinaryLines with invalid line %s",
		(line) => {
			expect(() =>
				Array.from(
					processBinaryLines(
						[{ loc: { line: 0 }, data: UTF8_ENCODER.encode(line) }],
						DefaultReaderSettings,
						new Status(),
					),
				),
			).toThrowError(InvalidGedcomLineError);
		},
	);

	test("processBinaryLines with separated multibyte characters", () => {
		const status = new Status();
		const source = "with ém̄ôȷï 😁🙃🫠 𝕒𝕟𝕕 greek Δυσγραφια!";
		const conc = UTF8_ENCODER.encode("1 CONC ");
		const encoded = UTF8_ENCODER.encode(source);
		const input: BinaryLine[] = [
			{ loc: {}, data: UTF8_ENCODER.encode("0 NOTE A note ") },
		];
		for (let i = 0; i < encoded.length; ++i) {
			input.push({
				loc: {},
				data: mergeUint8Arrays(conc, encoded.subarray(i, i + 1)),
			});
		}
		const expected = ["0 NOTE A note " + source];

		const lines = Array.from(
			processBinaryLines(input, DefaultReaderSettings, status),
		).map((line) => line.text);
		expect(lines).toEqual(expected);
		expect(status.warnings).toHaveLength(0);
	});
});

describe("processBinaryLinesAsync", () => {
	test("processBinaryLinesAsync with continuations", async () => {
		const status = new Status();

		const input = [
			"0 NOTE This is a note",
			" 1 CONT that continues on the next line. ",
			"1  CONC And this is concatenated.",
			"    0 NOTE Another note",
			"1 CONT",
			"\t1 CONT with continuation.",
		];

		const expected = [
			"0 NOTE This is a note\nthat continues on the next line. And this is concatenated.",
			"    0 NOTE Another note\n\nwith continuation.",
		];

		const asyncInput = (async function* () {
			yield* input.map((text) => ({
				loc: {},
				data: UTF8_ENCODER.encode(text),
			}));
		})();
		const lines = await Array.fromAsync(
			processBinaryLinesAsync(asyncInput, DefaultReaderSettings, status),
		);
		const texts = lines.map((line) => line.text);
		expect(texts).toEqual(expected);
		expect(status.warnings).toHaveLength(0);
	});
});

const UTF8_ENCODER = new TextEncoder();
