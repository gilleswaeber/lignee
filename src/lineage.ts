import type { GedcomRecord } from "./reader/models";

export type Lineage = {
	head: GedcomRecord | null;
	trailer: GedcomRecord | null;
	byXref: Record<string, GedcomRecord>;
	byTag: Record<string, string[]>;
	tags: string[];
	extraEntries: GedcomRecord[];
};
