import type { GedcomRecord } from "../reader/models.js";
import { type RecordReaderRoot } from "./interface";
import { RecordReaderRootHandler } from "./root.js";

export function readRecord(record: GedcomRecord): RecordReaderRoot {
	return new RecordReaderRootHandler(record);
}
