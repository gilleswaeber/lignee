import { DefaultWriterSettings, type WriterSettings } from "./settings";
import type { GedcomRecord } from "../reader/models";
import { LineTerminator, type TagPayload } from "../models";
import { RootTagsWithoutRef } from "../reader/records";
import type { Lineage } from "../lineage";

const LineTerminatorText: { [key in LineTerminator]: string } = {
	[LineTerminator.CRLF]: "\r\n",
	[LineTerminator.CR]: "\r",
	[LineTerminator.LF]: "\n",
	[LineTerminator.MIXED]: "\n",
};

export function dumpGedcom(
	lineage: Lineage,
	p: Partial<WriterSettings> = DefaultWriterSettings,
): string {
	const s = { ...DefaultWriterSettings, ...p };
	let data = "";
	data += dumpGedcomEntry(lineage.head ?? DEFAULT_HEAD_RECORD, s);
	for (const tag of lineage.tags) {
		for (const xref of lineage.byTag[tag]) {
			const entry = lineage.byXref[xref];
			data += dumpGedcomEntry(entry, s);
		}
	}
	for (const extraEntry of lineage.extraEntries) {
		data += dumpGedcomEntry(extraEntry, s);
	}
	data += dumpGedcomEntry(lineage.trailer ?? DEFAULT_TRAILER_RECORD, s);
	return data;
}

/** Convert an entry to a string using the GEDCOM format. */
export function dumpGedcomEntry(
	entry: GedcomRecord,
	p: WriterSettings,
): string {
	const lf = LineTerminatorText[p.ln];

	let str = "";
	if (RootTagsWithoutRef.includes(entry.tag)) {
		str += `0 ${entry.tag}${lf}`;
	} else {
		if (typeof entry.value === "string" && entry.value.length) {
			writeValue(0, entry.xref ?? "", `${entry.tag} ${entry.value}`, p);
		} else str += `0 ${entry.xref ?? ""} ${entry.tag}${lf}`;
	}

	function writeEntry(key: string, value: TagPayload, level: number) {
		if (Array.isArray(value)) {
			for (const val of value) {
				writeEntry(key, val, level);
			}
		} else if (typeof value === "string") {
			str += writeValue(level, key, value, p);
		} else {
			if (typeof value.value === "string" && value.value.length) {
				writeEntry(key, value.value, level);
			} else {
				str += `${level} ${key}${lf}`;
			}
			for (const [key2, val] of Object.entries(value.attr)) {
				if (typeof val != "undefined") writeEntry(key2, val, level + 1);
			}
		}
	}

	for (const [key, val] of Object.entries(entry.attr)) {
		if (typeof val != "undefined") writeEntry(key, val, 1);
	}
	return str;
}

/** Write a single value which may be split over several lines using CONC and CONT, while making not to break multibyte utf-8 sequences */
function writeValue(
	level: number,
	tag: string,
	value: string,
	p: WriterSettings,
): string {
	// Split lines using LF, CRLF, CR, FF, FS, GS, RS, US, LSEP, PSEP
	// eslint-disable-next-line no-control-regex
	const lines = value.split(/\r?\n|[\r\x0C\x1C\x1D\x1E\x1F\u2028\u2029]/g);
	const lf = LineTerminatorText[p.ln];
	if (p.wrapText) {
		let str = "";
		let firstLine = true;
		// The GEDCOM specification before 7.0 states that a line should not be longer than 255 (wide) characters
		// While it's not 100% clear what that means for UTF-8, we'll take 255 bytes as the limit
		// We consider the size of the line terminator to be 2 bytes to avoid issues after conversion
		const concStr = `${level + 1} CONC `;
		const conc = UTF8_ENCODER.encode(concStr);
		for (const line of lines) {
			const text = firstLine
				? `${level} ${tag} ${line}`
				: `${level + 1} CONT ${line}`;
			firstLine = false;
			let encoded = UTF8_ENCODER.encode(text);
			let firstChunk = true;
			while (encoded.length > 253 - (firstChunk ? 0 : conc.length)) {
				if (!firstChunk) str += concStr;
				let end = 253 - (firstChunk ? 0 : conc.length);
				firstChunk = false;
				if (encoded[end] >= 0x80) {
					// byte is part of a multibyte utf-8 sequence
					// find the first byte of the sequence (starts with 0b11xxxxxx == 0xC0)
					while (encoded[end] < 0xc0) end--;
				}
				str += UTF8_DECODER.decode(encoded.subarray(0, end)) + lf;
				encoded = encoded.subarray(end);
			}
			if (!firstChunk) str += concStr;
			str += UTF8_DECODER.decode(encoded) + lf;
		}
		return str;
	} else {
		return `${level} ${tag} ` + lines.join(`${lf}${level + 1} CONT `) + lf;
	}
}

const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder();

const DEFAULT_HEAD_RECORD: GedcomRecord = {
	tag: "HEAD",
	value: "HEAD",
	attr: {
		CHAR: "UTF-8",
		SOUR: "BLOODLINE_JS",
		DEST: "BLOODLINE_JS",
		GEDC: {
			attr: {
				VERS: "5.5.1",
				FORM: "LINEAGE-LINKED",
			},
		},
		SUBM: {
			attr: {
				NAME: "BLOODLINE_JS",
			},
		},
	},
};

const DEFAULT_TRAILER_RECORD: GedcomRecord = {
	tag: "TRLR",
	value: "TRLR",
	attr: {},
};
