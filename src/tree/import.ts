import type { TreeData } from "./model";
import type { GedcomRecord } from "../reader/models";
import { enumerate } from "../utils/iterables";
import { Status } from "../status";

export function treeFromRecords(
	entries: Iterable<GedcomRecord>,
	status: Status,
): TreeData {
	let head = null as GedcomRecord | null;
	let trailer = null as GedcomRecord | null;
	const byXref: Record<string, GedcomRecord> = {};
	const byTag: Record<string, string[]> = {};
	const tags: string[] = [];
	const extraEntries: GedcomRecord[] = [];

	for (const [i, entry] of enumerate(entries)) {
		const loc = { ...entry.loc, entry: i };

		if (trailer) {
			status.warn(loc, `[treeFromRecords] Entries found after TRLR`);
			break;
		}

		// Check for HEAD entry
		if (entry.tag === "HEAD") {
			if (head) {
				status.warn(loc, `[treeFromRecords] Additional HEAD entry found`);
				extraEntries.push(entry);
			} else {
				if (i != 0) {
					status.warn(
						loc,
						`[treeFromRecords] HEAD entry is not the first entry`,
					);
				}
				head = entry;
			}
			continue;
		} else if (i == 0) {
			status.warn(
				loc,
				`[treeFromRecords] Expected the first entry to be a HEAD`,
			);
		}

		// Check for trailer entry
		if (entry.tag === "TRLR") {
			trailer = entry;
			continue;
		}

		if (entry.xref) {
			if (byXref[entry.xref]) {
				status.warn(loc, `[treeFromRecords] Duplicate xref: ${entry.xref}`);
				extraEntries.push(entry);
				continue;
			} else {
				byXref[entry.xref] = entry;
			}

			if (!byTag[entry.tag]) {
				byTag[entry.tag] = [];
				tags.push(entry.tag);
			}
			byTag[entry.tag].push(entry.xref);
		}
	}

	if (!trailer) {
		status.warn({}, `[treeFromRecords] Missing TRLR entry`);
	}

	return {
		head,
		trailer,
		byXref,
		byTag,
		tags,
		extraEntries,
	};
}
