import type { GedcomRecord } from "../reader/models";
import { type RecordReaderRoot } from "./interface";
import { RecordReaderRootHandler } from "./root";

export function readRecord(record: GedcomRecord): RecordReaderRoot {
	return new RecordReaderRootHandler(record);
}
