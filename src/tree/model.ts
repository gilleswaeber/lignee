import type { GedcomRecord } from "../reader/models";

/**
 * In-memory full tree representation.
 */
export type TreeData = {
	head: GedcomRecord | null;
	trailer: GedcomRecord | null;
	byXref: Record<string, GedcomRecord>;
	byTag: Record<string, string[]>;
	tags: string[];
	extraEntries: GedcomRecord[];
};
