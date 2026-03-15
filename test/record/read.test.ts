import { readRecord } from "../../src";
import { describe, expect, test } from "vitest";
import { makeHeadRecord, makeIndiRecord } from "./testData";

describe("readRecord reading", () => {
	test("head record example", () => {
		const r = readRecord(makeHeadRecord());

		expect(r.tag).toEqual("HEAD");
		expect(r.index).toEqual(0);

		expect(r.attr.SOURCE.exists).toBe(false);

		const sour = r.attr.SOUR;
		expect(sour.exists).toBe(true);
		expect(sour.hasFirstValue).toBe(true);
		expect(sour.firstValue).toEqual("TestSource");
		expect(sour.first.exists).toBe(true);
		expect(sour.first.hasValue).toBe(true);
		expect(sour.first.value).toEqual("TestSource");
		expect(sour.length).toBe(1);
		expect([...sour].length).toBe(1);
		expect([...sour][0].value).toEqual("TestSource");
		expect([...sour.first.attr].length).toBe(0);
		expect(sour.raw).toEqual("TestSource");

		const gedc = r.attr.GEDC;
		expect(gedc.exists).toBe(true);
		expect(gedc.hasFirstValue).toBe(false);
		expect(gedc.firstValue).toBeNull();
		expect(gedc.length).toBe(1);
		expect(gedc.first.exists).toBe(true);
		expect([...gedc.first.attr].map((a) => a.tag)).ordered.members([
			"VERS",
			"FORM",
		]);
		expect(gedc.first.attr.VERS.firstValue).toEqual("5.5.1");
		expect(gedc.first.attr.VERS.first.value).toEqual("5.5.1");
		expect(gedc.first.attr.FORM.firstValue).toEqual("LINEAGE-LINKED");
		expect(gedc.first.attr.FORM.first.value).toEqual("LINEAGE-LINKED");
		expect(gedc.raw).deep.equal({
			attr: { VERS: "5.5.1", FORM: "LINEAGE-LINKED" },
		});
	});

	test("indi record example", () => {
		const r = readRecord(makeIndiRecord());

		expect(r.tag).toEqual("INDI");
		expect(r.attr.NAME.firstValue).toEqual("John /SMITH/");
		expect(r.attr.NAME.first.value).toEqual("John /SMITH/");
		expect(r.attr.NAME.first.attr.SURN.firstValue).toEqual("SMITH");
		expect(
			[...r.attr.NAME].flatMap((n) => [...n.attr.SURN]).map((s) => s.value),
		).toEqual(["SMITH"]);

		expect(r.attr.BIRT.exists).toBe(true);
		expect(r.attr.BIRT.length).toBe(1);
		expect(r.attr.DEAT.exists).toBe(false);

		expect(r.attr.EVEN.exists).toBe(true);
		expect(r.attr.EVEN.length).toBe(2);

		expect(r.attr.FAMS.length).toBe(2);
		expect([...r.attr.FAMS].map((f) => f.value)).toEqual(["@F1@", "@F2@"]);
	});
});
