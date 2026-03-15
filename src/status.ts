import type { Location, StatusMessage } from "./models.js";

export function extractLocation({
	line,
	byte,
	u16Char,
	entry,
}: Location): Location {
	let loc: Location = {};
	if (line !== undefined) loc.line = line;
	if (byte !== undefined) loc.byte = byte;
	if (u16Char !== undefined) loc.u16Char = u16Char;
	if (entry !== undefined) loc.entry = entry;
	return loc;
}

export class Status {
	public warnings: StatusMessage[] = [];

	public warn(loc: Location, message: string) {
		this.warnings.push({
			loc,
			message,
		});
	}
}
