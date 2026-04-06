import type { GedcomRecord } from "../reader/models";
import { type ReadOnlyRecordRoot, type RecordRoot } from "./interface";
import { RecordReaderRootHandler } from "./root";
import type { Immutable } from "../utils/immutable";
import { InactiveContextError, ReadOnlyRecordError } from "./errors";
import type { SelectorContext } from "./selector";

/** Load a record for in-place edition */
export function editRecordInPlace(record: GedcomRecord): RecordRoot {
	return new RecordReaderRootHandler({
		getRecord: () => record,
		setRecord: (update) => void Object.assign(record, update(record)),
	});
}

/** Load a record in read-only mode */
export function readRecord(
	record: Immutable<GedcomRecord>,
): ReadOnlyRecordRoot {
	return new RecordReaderRootHandler({
		getRecord: () => record,
		setRecord: () => {
			throw new ReadOnlyRecordError();
		},
	});
}

/**
 * Apply the recipe on the record and return the result, does not mutate the original record.
 *
 * Similar to immer's `produce` in its interface (currying has not been implemented yet)
 */
export function produceRecord(
	record: Immutable<GedcomRecord>,
	recipe: (record: RecordRoot) => void,
): Immutable<GedcomRecord> {
	let active = true;
	let current = record;
	const ctx: SelectorContext = {
		getRecord: () => {
			if (active) return current;
			else throw new InactiveContextError();
		},
		setRecord: (update) => {
			if (active) current = update(current);
			else throw new InactiveContextError();
		},
	};
	recipe(new RecordReaderRootHandler(ctx));
	active = false;
	return current;
}
