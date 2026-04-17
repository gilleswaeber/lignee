import {
	type AttributesPayload,
	type LineLocation,
	type Location,
} from "../models";
import type { GedcomLine, GedcomRecord } from "./models";
import { Status } from "../status";
import {
	InvalidGedcomLineError,
	InvalidGedcomLineLevelError,
	LinesBeforeTheFirstRecordError,
} from "./errors";

type InnerLine = {
	loc: Location;
	level: number;
	tag: string;
	xref?: string;
	value?: string;
	text: string;
};

export function* readGedcomRecordsFromLines(
	lines: Iterable<GedcomLine>,
	status: Status,
): Generator<GedcomRecord> {
	const b = new RecordBuffer(status);

	for (const line of lines) {
		yield* b.processLine(line);
	}

	yield* b.flush();
}

export async function* readGedcomRecordsFromLinesAsync(
	lines: AsyncIterable<GedcomLine>,
	status: Status,
): AsyncGenerator<GedcomRecord> {
	const b = new RecordBuffer(status);

	for await (const line of lines) {
		yield* b.processLine(line);
	}

	yield* b.flush();
}

class RecordBuffer {
	constructor(private readonly status: Status) {}

	public root: { tag: string; xref?: string; value?: string } | null = null;
	public loc: LineLocation = {};
	public i = 0;
	public inner: InnerLine[] = [];

	*flush(): Generator<GedcomRecord> {
		if (!this.root) {
			if (this.inner.length) throw new LinesBeforeTheFirstRecordError();
		} else {
			const attr = buildAttributes(this.inner);

			const entry: GedcomRecord = {
				loc: { ...this.loc, entry: this.i++ },
				tag: this.root.tag,
				attr,
			};
			if (typeof this.root.value != "undefined") entry.value = this.root.value;
			if (typeof this.root.xref != "undefined") entry.xref = this.root.xref;
			yield entry;

			this.root = null;
			this.inner.length = 0;
		}
	}

	*processLine(line: GedcomLine): Generator<GedcomRecord> {
		const m = GedcomLinePattern.exec(line.text);
		if (!m) throw new InvalidGedcomLineError(line.loc);
		const groups = m.groups as {
			level: string;
			tag: string;
			xref?: string;
			value?: string;
		};
		const level = parseInt(groups.level, 10);
		if (level == 0) {
			yield* this.flush();
			this.root = groups;
			this.loc = line.loc;
		} else {
			const { tag, xref, value } = groups;
			this.inner.push({
				loc: line.loc,
				level,
				tag,
				xref,
				value,
				text: line.text,
			});
		}
	}
}

function buildAttributes(inner: InnerLine[]): AttributesPayload {
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
			throw new InvalidGedcomLineLevelError(
				line.loc,
				`is: ${level} expected: ≤${depth + 1}`,
			);
		}
		flush(level);
		currentVal[level] = line.value;
		currentLine[level] = line;
		depth = level;
	}
	flush(1);
	return (currentVal[0] as { attr: AttributesPayload }).attr;
}

const GedcomLinePattern =
	/^(?<level>[0-9]+) +(?:(?<xref>@[^@]+@) +)?(?<tag>[A-Za-z0-9_]+)(?: +(?<value>.+))?$/s;
