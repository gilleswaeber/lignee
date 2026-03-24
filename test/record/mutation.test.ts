import { describe, expect, test } from "vitest";
import { readRecord } from "../../src";
import { makeIndiRecord } from "./testData";

describe("record mutation", () => {
	test("set value", () => {
		const record = makeIndiRecord();
		const r = readRecord(record);

		r.setAttr("_TEST0", "TEST0");
		expect(record.attr._TEST0).equal("TEST0");
		expect(r.attr._TEST0.firstValue).equal("TEST0");

		r.attr._TEST1 = "TEST1";
		expect(record.attr._TEST1).equal("TEST1");
		expect(r.attr._TEST1.firstValue).equal("TEST1");

		r.attr._TEST2.set("TEST2");
		expect(record.attr._TEST2).equal("TEST2");
		expect(r.attr._TEST2.firstValue).equal("TEST2");

		r.attr._TEST3.first.set("TEST3");
		expect(record.attr._TEST3).equal("TEST3");
		expect(r.attr._TEST3.firstValue).equal("TEST3");

		r.attr._TEST4.first.setValue("TEST4");
		expect(record.attr._TEST4).equal("TEST4");
		expect(r.attr._TEST4.firstValue).equal("TEST4");

		r.attr._TEST5.setAt(0, "TEST5");
		expect(record.attr._TEST5).equal("TEST5");
		expect(r.attr._TEST5.firstValue).equal("TEST5");

		r.attr._TEST6.push("TEST6");
		expect(record.attr._TEST6).equal("TEST6");
		expect(r.attr._TEST6.firstValue).equal("TEST6");
	});
});
