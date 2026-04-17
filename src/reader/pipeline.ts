import { DefaultReaderSettings, type ReaderSettings } from "./settings";
import type { TreeData } from "../tree/model";
import { Status } from "../status";
import { readGedcomLines, readGedcomLinesAsync } from "./gedcomLines";
import {
	readGedcomRecordsFromLines,
	readGedcomRecordsFromLinesAsync,
} from "./records";
import { treeFromRecords } from "../tree/import";
import type { GedcomRecord } from "./models";

export function readTree(
	data: string | Uint8Array | Iterable<Uint8Array>,
	settings: Partial<ReaderSettings> = {},
	status?: Status,
): { tree: TreeData; status: Status } {
	status ??= new Status();
	const s = { ...DefaultReaderSettings, ...settings };
	return {
		tree: treeFromRecords(readGedcomRecords(data, s, status), status),
		status,
	};
}

export function readGedcomRecords(
	data: string | Uint8Array | Iterable<Uint8Array>,
	settings: Partial<ReaderSettings> = {},
	status?: Status,
): Iterable<GedcomRecord> {
	status ??= new Status();
	const s = { ...DefaultReaderSettings, ...settings };
	return readGedcomRecordsFromLines(readGedcomLines(data, s, status), status);
}

export function readGedcomRecordsAsync(
	data: AsyncIterable<Uint8Array>,
	settings: Partial<ReaderSettings> = {},
	status?: Status,
): AsyncGenerator<GedcomRecord> {
	status ??= new Status();
	const s = { ...DefaultReaderSettings, ...settings };
	return readGedcomRecordsFromLinesAsync(
		readGedcomLinesAsync(data, s, status),
		status,
	);
}
