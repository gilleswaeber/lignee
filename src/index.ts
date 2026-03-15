export { parseGedcom } from "./reader/index.js";
export { dumpGedcom } from "./writer/index.js";
export { LineTerminator } from "./models.js";
export { readRecord } from "./record/record.js";

export type {
	RecordItem,
	RecordReaderRoot,
	RecordTag,
	RecordAttributes,
} from "./record/interface";
