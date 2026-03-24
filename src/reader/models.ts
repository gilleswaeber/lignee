import type { AttributesPayload, EntryLocation, LineLocation } from "../models";

export type BinaryLine = {
	loc: LineLocation;
	data: Uint8Array;
};
export type TextLine = {
	loc: LineLocation;
	text: string;
};
export type GedcomLine = {
	loc: LineLocation;
	text: string;
};
export type GedcomRecord = {
	loc?: EntryLocation;
	tag: string;
	xref?: string;
	value?: string;
	attr: AttributesPayload;
};
