import { atLocation, type Location } from "../models";

export class MissingHeaderError extends Error {
	constructor() {
		super("The file does not start with a HEAD record.");
	}
}

export class MissingTrailerError extends Error {
	constructor() {
		super("The file does not end with a TRLR record.");
	}
}

export class ContinuationWithoutPreviousContentError extends Error {
	constructor(loc: Location) {
		super(
			`There is a continuation structure without previous content (at ${atLocation(loc)})`,
		);
	}
}

export class LinesBeforeTheFirstRecordError extends Error {
	constructor() {
		super("There are non-empty lines before the start of the first record.");
	}
}

export class InvalidGedcomLineError extends Error {
	constructor(loc: Location) {
		super(`Invalid GEDCOM line (at ${atLocation(loc)})`);
	}
}

export class InvalidGedcomLineLevelError extends Error {
	constructor(loc: Location, detail: string) {
		super(`Invalid GEDCOM line level ${detail} (at ${atLocation(loc)})`);
	}
}
