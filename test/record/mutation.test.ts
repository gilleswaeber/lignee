import { describe, expect, test } from "vitest";
import { editRecordInPlace } from "../../src";
import { makeIndiRecord } from "./testData";
import {produceRecord, readRecord} from "../../src/record/record";

describe("in-place record mutation", () => {
	test("set value", () => {
		const record = makeIndiRecord();
		const r = editRecordInPlace(record);

		r.setAttr("_TEST0", "TEST0");
		expect(record.attr._TEST0).equal("TEST0");
		expect(r.attr._TEST0.first.value).equal("TEST0");

		// @ts-expect-error TS2322
		r.attr._TEST1 = "TEST1";
		expect(record.attr._TEST1).equal("TEST1");
		expect(r.attr._TEST1.first.value).equal("TEST1");

		r.attr._TEST2.set("TEST2");
		expect(record.attr._TEST2).equal("TEST2");
		expect(r.attr._TEST2.first.value).equal("TEST2");

		r.attr._TEST3.first.set("TEST3");
		expect(record.attr._TEST3).equal("TEST3");
		expect(r.attr._TEST3.first.value).equal("TEST3");

		r.attr._TEST4.first.setValue("TEST4");
		expect(record.attr._TEST4).equal("TEST4");
		expect(r.attr._TEST4.first.value).equal("TEST4");

		r.attr._TEST5.setAt(0, "TEST5");
		expect(record.attr._TEST5).equal("TEST5");
		expect(r.attr._TEST5.first.value).equal("TEST5");

		r.attr._TEST6.push("TEST6");
		expect(record.attr._TEST6).equal("TEST6");
		expect(r.attr._TEST6.first.value).equal("TEST6");

		// @ts-expect-error TS2322
		r.attr._TEST7[0] = "TEST7"
		expect(record.attr._TEST7).equal("TEST7");
		expect(r.attr._TEST7.first.value).equal("TEST7");
	});
});

describe("producer record mutation", () => {
	test("set value", () => {
		const record = makeIndiRecord();

		const updated = produceRecord(record, r => {
			r.setAttr("_TEST0", "TEST0");
			expect(r.attr._TEST0.first.value).equal("TEST0");

			// @ts-expect-error TS2322
			r.attr._TEST1 = "TEST1";
			expect(r.attr._TEST1.first.value).equal("TEST1");

			r.attr._TEST2.set("TEST2");
			expect(r.attr._TEST2.first.value).equal("TEST2");

			r.attr._TEST3.first.set("TEST3");
			expect(r.attr._TEST3.first.value).equal("TEST3");

			r.attr._TEST4.first.setValue("TEST4");
			expect(r.attr._TEST4.first.value).equal("TEST4");

			r.attr._TEST5.setAt(0, "TEST5");
			expect(r.attr._TEST5.first.value).equal("TEST5");

			r.attr._TEST6.push("TEST6");
			expect(r.attr._TEST6.first.value).equal("TEST6");

			// @ts-expect-error TS2322
			r.attr._TEST7[0] = "TEST7"
			expect(r.attr._TEST7.first.value).equal("TEST7");
		});
		const r = readRecord(updated);

		expect(updated.attr._TEST0).equal("TEST0");
		expect(r.attr._TEST0.first.value).equal("TEST0");

		expect(updated.attr._TEST1).equal("TEST1");
		expect(r.attr._TEST1.first.value).equal("TEST1");

		expect(updated.attr._TEST2).equal("TEST2");
		expect(r.attr._TEST2.first.value).equal("TEST2");

		expect(updated.attr._TEST3).equal("TEST3");
		expect(r.attr._TEST3.first.value).equal("TEST3");

		expect(updated.attr._TEST4).equal("TEST4");
		expect(r.attr._TEST4.first.value).equal("TEST4");

		expect(updated.attr._TEST5).equal("TEST5");
		expect(r.attr._TEST5.first.value).equal("TEST5");

		expect(updated.attr._TEST6).equal("TEST6");
		expect(r.attr._TEST6.first.value).equal("TEST6");

		expect(updated.attr._TEST7).equal("TEST7");
		expect(r.attr._TEST7.first.value).equal("TEST7");

		expect(record).deep.equal(makeIndiRecord(), "original record must remain unchanged");
	});
});
