import type { GedcomRecord } from "../reader/models";
import type { ItemPayload, Location, TagPayload } from "../models";
import {
	type RecordAttributes,
	RecordHandlerType,
	recordHandlerType,
	type RecordItem,
	type RecordTag,
} from "./interface";
import { makeRecordAttributes } from "./attributes";
import { setRoot, setTag } from "./mutation";

export class RecordReaderRootHandler {
	constructor(private readonly record: GedcomRecord) {}

	get location(): Location {
		return this.record.loc ?? {};
	}

	get tag(): string {
		return this.record.tag;
	}

	get attr(): RecordAttributes {
		return makeRecordAttributes({ record: this.record, path: [] });
	}

	get index(): 0 {
		return 0;
	}

	set(value: (ItemPayload & { [recordHandlerType]?: undefined }) | RecordItem) {
		setRoot(this.record, value);
	}

	setAttr(
		tag: string,
		value:
			| (TagPayload & { [recordHandlerType]?: undefined })
			| RecordTag
			| RecordItem,
	): void {
		setTag({ record: this.record, path: [], tag }, value);
	}

	deleteAttr(tag: string): void {
		delete this.record.attr[tag];
	}

	get [recordHandlerType](): RecordHandlerType.ROOT {
		return RecordHandlerType.ROOT;
	}
}
