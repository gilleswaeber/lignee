import type { ReaderSettings } from "./settings";
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
	settings?: ReaderSettings,
	status?: Status,
): { tree: TreeData; status: Status } {
	status ??= new Status();
	return {
		tree: treeFromRecords(readGedcomRecords(data, settings, status), status),
		status,
	};
}

export function readGedcomRecords(
	data: string | Uint8Array | Iterable<Uint8Array>,
	settings?: ReaderSettings,
	status?: Status,
): Iterable<GedcomRecord> {
	status ??= new Status();
	return readGedcomRecordsFromLines(
		readGedcomLines(data, settings?.ln, status),
		status,
	);
}

export function readGedcomRecordsAsync(
	data: AsyncIterable<Uint8Array>,
	settings?: ReaderSettings,
	status?: Status,
): AsyncGenerator<GedcomRecord> {
	status ??= new Status();
	return readGedcomRecordsFromLinesAsync(
		readGedcomLinesAsync(data, settings?.ln, status),
		status,
	);
}
