import type { Lineage } from "../lineage";
import { readGedcomLines } from "./gedcomLines";
import { readGedcomRecords } from "./records";
import { buildLineage } from "./lineage";
import { Status } from "../status";
import type { ReaderSettings } from "./settings";

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
