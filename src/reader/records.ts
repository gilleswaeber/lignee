import {
	type AttributesPayload,
	type LineLocation,
	type Location,
} from "../models";
import type { GedcomLine, GedcomRecord } from "./models";
import { Status } from "../status";

type InnerLine = {
	loc: Location;
	level: number;
	tag: string;
	xref?: string;
	value?: string;
	text: string;
};

export function* readGedcomRecords(
	lines: Iterable<GedcomLine>,
	status: Status,
): Generator<GedcomRecord> {
	let root: { tag: string; xref?: string; value?: string } | null = null;
	let loc: LineLocation = {};
	let i = 0;
	const inner: InnerLine[] = [];

	function* flush(): Generator<GedcomRecord> {
		if (!root) {
			if (inner.length)
				status.warn(
					inner[0].loc,
					`[readGedcomRecords] Lines before the first level 0 line: ${inner.map((l) => l.text).join(", ")}`,
				);
			inner.length = 0;
		} else {
			const attr = buildAttributes(inner, status);

			const entry: GedcomRecord = {
				loc: { ...loc, entry: i++ },
				tag: root.tag,
				attr,
			};
			if (typeof root.value != "undefined") entry.value = root.value;
			if (typeof root.xref != "undefined") entry.xref = root.xref;
			yield entry;

			root = null;
			inner.length = 0;
		}
	}

	for (const line of lines) {
		const m = GedcomLinePattern.exec(line.text);
		if (!m) {
			status.warn(
				line.loc,
				`[readGedcomRecords] invalid gedcom line: ${line.text}`,
			);
			continue;
		}
		const groups = m.groups as {
			level: string;
			tag: string;
			xref?: string;
			value?: string;
		};
		const level = parseInt(groups.level, 10);
		if (level == 0) {
			yield* flush();
			root = groups;
			loc = line.loc;
		} else {
			const { tag, xref, value } = groups;
			inner.push({ loc: line.loc, level, tag, xref, value, text: line.text });
		}
	}

	yield* flush();
}

function buildAttributes(
	inner: InnerLine[],
	status: Status,
): AttributesPayload {
	const currentLine: { [index: number]: InnerLine } = {};
	const currentVal: {
		[level: number]:
			| string
			| undefined
			| { value?: string; attr: AttributesPayload };
	} = {
		0: { attr: {} },
	};
	let depth = 0;

	function flush(level: number) {
		while (depth >= level) {
			const line = currentLine[depth];
			const val = currentVal[depth] ?? "";
			const parentVal = currentVal[depth - 1];
			if (typeof parentVal === "string") {
				currentVal[depth - 1] = { value: parentVal, attr: { [line.tag]: val } };
			} else if (typeof parentVal === "undefined") {
				currentVal[depth - 1] = { attr: { [line.tag]: val } };
			} else {
				const pAttr = parentVal.attr[line.tag];
				if (typeof pAttr === "undefined") {
					parentVal.attr[line.tag] = val;
				} else if (Array.isArray(pAttr)) {
					pAttr.push(val);
				} else {
					parentVal.attr[line.tag] = [pAttr, val];
				}
			}
			--depth;
		}
	}

	for (const line of inner) {
		const level = line.level;
		if (level < 1 || level > depth + 1) {
			status.warn(
				line.loc,
				`[buildAttributes] invalid level (expected at most ${depth + 1}): ${line.text}`,
			);
			continue;
		}
		flush(level);
		currentVal[level] = line.value;
		currentLine[level] = line;
		depth = level;
	}
	flush(1);
	return (currentVal[0] as { attr: AttributesPayload }).attr;
}

export const RootTagsWithoutRef = ["HEAD", "TRLR"];

const TagPattern = /^[_A-Z][A-Z0-9_]+$/;
const GedcomLinePattern =
	/^(?<level>[0-9]+) +(?:(?<xref>@[^@]+@) +)?(?<tag>[A-Za-z0-9_]+)(?: +(?<value>.+))?$/;
