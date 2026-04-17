import { describe, expect, test } from "vitest";
import { readFile } from "node:fs/promises";
import { readTree, dumpTree } from "../../src";

describe("round-trip tests", () => {
	test.each([
		"gedcom70/escapes.ged",
		"gedcom70/extension-record.ged",
		"gedcom70/lang.ged",
		"gedcom70/maximal70.ged",
		"gedcom70/maximal70-lds.ged",
		"gedcom70/maximal70-memories1.ged",
		"gedcom70/maximal70-memories2.ged",
		"gedcom70/maximal70-tree1.ged",
		"gedcom70/maximal70-tree2.ged",
		"gedcom70/notes-1.ged",
		"gedcom70/obje-1.ged",
		"gedcom70/remarriage1-reorder.ged",
		"gedcom70/remarriage2.ged",
		"gedcom70/same-sex-marriage.ged",
		"gedcom70/voidptr.ged",
		"gedcom70/xref-reorder.ged",
	])("round-trip for %s", async (file) => {
		const text = await readFile(`test/example/${file}`, { encoding: "utf-8" });
		const { tree, status } = readTree(text);
		expect(status.warnings).ordered.members([]);
		const dump = dumpTree(tree);
		expect(dump).equal(text);
	});

	test.each([
		"gedcom70/minimal70.ged",
		"gedcom70/extensions-reorder.ged",
		"gedcom70/long-url.ged",
	])("round-trip (no BOM) for %s", async (file) => {
		const text = await readFile(`test/example/${file}`, { encoding: "utf-8" });
		const { tree, status } = readTree(text);
		expect(status.warnings).ordered.members([]);
		const dump = dumpTree(tree, { bom: false });
		expect(dump).equal(text);
	});

	test.each(["gedcom70/age.ged", "gedcom70/filename-1.ged"])(
		"round-trip (strip notes) for %s",
		async (file) => {
			// These example files contain NOTE records mixed-in, whose order is not preserved (records are sorted by type)
			let text = await readFile(`test/example/${file}`, { encoding: "utf-8" });
			text = text.replace(/1 NOTE.*(?:\n2.+)*\n([01])/g, "$1");
			const { tree, status } = readTree(text);
			expect(status.warnings).ordered.members([]);
			const dump = dumpTree(tree);
			expect(dump).equal(text);
		},
	);
});
