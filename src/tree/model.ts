import type { GedcomRecord } from "../reader/models";

/**
 * In-memory full tree representation.
 */
export type TreeData = {
	head: GedcomRecord;
	trailer: GedcomRecord;
	byXref: Record<string, GedcomRecord>;
	byTag: Record<string, string[]>;
	/** Cross-references grouped by tag */
	tags: string[];
	/** Tags found, excluding HEAD and TRLR (unless duplicate) */
	extraRecords: Record<string, GedcomRecord[]>;
	/** Extra records (no cross-reference or duplicate, excl. first HEAD and TRLR) grouped by tag */
};
