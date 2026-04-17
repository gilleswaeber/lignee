import type { TreeData } from "./model";
import type { GedcomRecord } from "../reader/models";
import { enumerate } from "../utils/iterables";
import { Status } from "../status";
import { WarningCode } from "../models";
import { MissingHeaderError, MissingTrailerError } from "../reader/errors";

export function treeFromRecords(
	records: Iterable<GedcomRecord>,
	status: Status,
): TreeData {
	let head = null as GedcomRecord | null;
	let trailer = null as GedcomRecord | null;
	const seenTags = new Set<string>();
	const byXref: Record<string, GedcomRecord> = {};
	const byTag: Record<string, string[]> = {};
	const tags: string[] = [];
	const extraRecords: Record<string, GedcomRecord[]> = {};

	function initializeTag(tag: string) {
		tags.push(tag);
		byTag[tag] = [];
		extraRecords[tag] = [];
		seenTags.add(tag);
	}

	for (const [i, record] of enumerate(records)) {
		const loc = { ...record.loc, entry: i };

		if (trailer) {
			status.warn(loc, WarningCode.RECORD_AFTER_TRLR);
			break;
		}

		// Check for HEAD record
		if (record.tag === "HEAD") {
			if (head) {
				status.warn(loc, WarningCode.EXTRA_HEAD_RECORD);
				if (!seenTags.has(record.tag)) initializeTag(record.tag);
				extraRecords[record.tag].push(record);
			} else {
				head = record;
			}
			continue;
		} else if (i == 0) {
			throw new MissingHeaderError();
		}

		// Check for trailer record
		if (record.tag === "TRLR") {
			trailer = record;
			continue;
		}

		if (!seenTags.has(record.tag)) initializeTag(record.tag);

		if (record.xref) {
			if (byXref[record.xref]) {
				status.warn(loc, WarningCode.DUPLICATE_XREF, record.xref);
				extraRecords[record.tag].push(record);
				continue;
			} else {
				byXref[record.xref] = record;
			}

			if (!seenTags.has(record.tag)) {
				byTag[record.tag] = [];
				seenTags.add(record.tag);
				tags.push(record.tag);
			}
			byTag[record.tag].push(record.xref);
		} else {
			extraRecords[record.tag].push(record);
		}
	}

	if (!head) throw new MissingHeaderError();
	if (!trailer) throw new MissingTrailerError();

	return {
		head,
		trailer,
		byXref,
		byTag,
		tags,
		extraRecords,
	};
}
