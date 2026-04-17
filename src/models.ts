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
export function atLocation(loc: Location): string {
	const infos = [];
	if (typeof loc.entry == "number") infos.push(`entry ${loc.entry}`);
	if (typeof loc.line == "number") infos.push(`line ${loc.line}`);
	if (typeof loc.u16Char == "number") infos.push(`char ${loc.u16Char}`);
	if (typeof loc.byte == "number") infos.push(`byte ${loc.byte}`);
	if (!infos.length) return "?";
	return infos.join(", ");
}
export type StatusMessage = {
	loc: Location;
	code: WarningCode;
	detail?: string;
};
export enum WarningCode {
	// line-level warnings
	INVALID_LINE_IMPLICIT_CONTINUATION = "INVALID_LINE_IMPLICIT_CONTINUATION",
	INVALID_LEVEL_CONTINUATION = "INVALID_LEVEL_CONTINUATION",
	// record-level warnings
	RECORD_AFTER_TRLR = "RECORD_AFTER_TRLR",
	EXTRA_HEAD_RECORD = "EXTRA_HEAD_RECORD",
	DUPLICATE_XREF = "DUPLICATE_XREF",
}

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
