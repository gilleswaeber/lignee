import { test, expect, describe } from "vitest";
import { readGedcomRecordsFromLines } from "../../src/reader/records";

import { Status } from "../../src/status";

describe("readGedcomRecords", () => {
	test("basic record reading", () => {
		const status = new Status();
		const input = [
			"0 HEAD",
			"1 SOUR TestSource",
			"1 GEDC",
			"2 VERS 5.5.1",
			"2 FORM LINEAGE-LINKED",
			"0 TRLR",
		];

		const expected = [
			{
				tag: "HEAD",
				loc: { line: 0, entry: 0 },
				attr: {
					SOUR: "TestSource",
					GEDC: {
						attr: {
							VERS: "5.5.1",
							FORM: "LINEAGE-LINKED",
						},
					},
				},
			},
			{ tag: "TRLR", loc: { line: 5, entry: 1 }, attr: {} },
		];

		const actual = Array.from(
			readGedcomRecordsFromLines(
				input.map((text, index) => ({ text, loc: { line: index } })),
				status,
			),
		);
		expect(status.warnings).toEqual([]);
		expect(actual).toEqual(expected);
	});
});
