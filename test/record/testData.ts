import type { GedcomRecord } from "../../src/reader/models";

export function makeHeadRecord(): GedcomRecord {
	return {
		tag: "HEAD",
		loc: {},
		attr: {
			SOUR: "TestSource",
			GEDC: {
				attr: {
					VERS: "5.5.1",
					FORM: "LINEAGE-LINKED",
				},
			},
		},
	};
}

export function makeIndiRecord(): GedcomRecord {
	return {
		tag: "INDI",
		loc: {},
		xref: "@I1@",
		attr: {
			NAME: {
				value: "John /SMITH/",
				attr: {
					GIVN: "John",
					SURN: "SMITH",
				},
			},
			BIRT: {
				attr: {
					DATE: "1 JAN 1900",
					PLAC: "Example City",
				},
			},
			EVEN: [
				{ attr: { TYPE: "Award", NOTE: "For great stuff" } },
				{ attr: { TYPE: "Celebration", NOTE: "For winning an award" } },
			],
			FAMS: ["@F1@", "@F2@"],
		},
	};
}
