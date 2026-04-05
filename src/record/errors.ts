import type {ItemSelector} from "./selector";
import type {RecordItem, RecordTag} from "./interface";

export class MissingItemError extends Error {
	constructor(selector: ItemSelector) {
		super(`Item not found at ${selector.path}`);
	}
}

export class RootUpdateError extends Error {
	constructor() {
		super("The tag and xref elements of the root tag cannot be updated");
	}
}

export class DeleteWithMissingParentError extends Error {
	constructor(selector: ItemSelector) {
		super(
			`Deleting ${selector.path} when the parent item doesn't exist is not allowed`,
		);
	}
}

export class AssignWithMissingParentError extends Error {
	constructor(selector: ItemSelector) {
		super(
			`Setting ${selector.path} when the parent item doesn't exist is not supported`,
		);
	}
}

export class AssignToNonExistentError extends Error {
	constructor(value: RecordTag | RecordItem) {
		super("The assigned value does not exist");
	}
}

export class UnexpectedError extends Error {
	constructor(message: string) {
		super(`An unexpected condition occurred: ${message}`);
	}
}

export class AssignOnNonExistentIndex extends Error {
	constructor(selector: ItemSelector) {
		super(
			`Assigning to ${selector.path} when the index (non-first) does not exist is not supported`,
		);
	}
}

export class InactiveContextError extends Error {
	constructor() {
		super("Attempting to access or mutate a record after the produceRecord call completed.");
	}
}

export class ReadOnlyRecordError extends Error {
	constructor() {
		super("Attempting to mutate a read-only record");
	}
}
