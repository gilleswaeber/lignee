import type { Lineage } from "../lineage";
import type { GedcomRecord } from "./models";
import { enumerate } from "../utils/iterables";
import { extractLocation, Status } from "../status";

export function buildLineage(
	entries: Iterable<GedcomRecord>,
	status: Status,
): Lineage {
	let head = null as GedcomRecord | null;
	let trailer = null as GedcomRecord | null;
	const byXref: Record<string, GedcomRecord> = {};
	const byTag: Record<string, string[]> = {};
	const tags: string[] = [];
	const extraEntries: GedcomRecord[] = [];

	for (const [i, entry] of enumerate(entries)) {
		const loc = { ...extractLocation(entry), entry: i };

		if (trailer) {
			status.warn(loc, `[buildLineage] Entries found after TRLR`);
			break;
		}

		// Check for HEAD entry
		if (entry.tag === "HEAD") {
			if (head) {
				status.warn(loc, `[buildLineage] Additional HEAD entry found`);
				extraEntries.push(entry);
			} else {
				if (i != 0) {
					status.warn(loc, `[buildLineage] HEAD entry is not the first entry`);
				}
				head = entry;
			}
			continue;
		} else if (i == 0) {
			status.warn(loc, `[buildLineage] Expected the first entry to be a HEAD`);
		}

		// Check for trailer entry
		if (entry.tag === "TRLR") {
			trailer = entry;
			continue;
		}

		if (entry.xref) {
			if (byXref[entry.xref]) {
				status.warn(loc, `[buildLineage] Duplicate xref: ${entry.xref}`);
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
		status.warn({}, `[buildLineage] Missing TRLR entry`);
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
