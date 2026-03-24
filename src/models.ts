export enum LineTerminator {
	CRLF = "CRLF",
	CR = "CR",
	LF = "LF",
	MIXED = "MIXED",
}
export type CharLocation = {
	byte?: number;
	/** character position in UTF-16 code units */
	u16Char?: number;
};
export type LineLocation = CharLocation & {
	line?: number;
};
export type EntryLocation = LineLocation & {
	entry?: number;
};
export type Location = {
	byte?: number;
	/** character position in UTF-16 code units */
	u16Char?: number;
	line?: number;
	entry?: number;
};
export type StatusMessage = {
	loc: Location;
	message: string;
};

export type ObjectPayload = {
	loc?: Location;
	value?: string;
	attr: AttributesPayload;
	tag?: string;
	xref?: string;
};
export type ItemPayload = string | ObjectPayload;
export type TagPayload = ItemPayload | ItemPayload[];
export type AttributesPayload = {
	[key: string]: TagPayload | undefined;
};
