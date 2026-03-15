import { type ReaderSettings } from "../models.js";
import type { Lineage } from "../lineage.js";
import { readGedcomLines } from "./gedcomLines.js";
import { readGedcomRecords } from "./records.js";
import { buildLineage } from "./lineage.js";
import { Status } from "../status.js";

export function parseGedcom(
	data: string | Uint8Array | Iterable<Uint8Array>,
	settings?: ReaderSettings,
): { lineage: Lineage; status: Status } {
	const status = new Status();
	const lines = Array.from(readGedcomLines(data, settings?.ln, status));
	const entries = Array.from(readGedcomRecords(lines, status));
	const lineage = buildLineage(entries, status);
	return { lineage, status };
}
