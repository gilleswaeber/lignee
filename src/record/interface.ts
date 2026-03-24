import type {
	ItemPayload,
	Location,
	ObjectPayload,
	TagPayload,
} from "../models";

export const recordHandlerType = Symbol("recordHandlerType");

export enum RecordHandlerType {
	ROOT = "ROOT",
	ATTRIBUTES = "ATTRIBUTES",
	VALUE = "VALUE",
	ITEM = "ITEM",
}

export interface RecordReaderRoot {
	get location(): Location;
	get tag(): string;
	get attr(): RecordAttributes;
	/** `item.attr.TAG = payload` can also be used */
	setAttr(tag: string, value: TagPayload | RecordTag | RecordItem): void;
	/** `delete item.attr.TAG` can also be used */
	deleteAttr(tag: string): void;
	set(value: ItemPayload | RecordItem): void;
	get index(): 0;
	[recordHandlerType]: RecordHandlerType.ROOT;
}

export type RecordAttributes = {
	[tag: string]: RecordTag;
	[recordHandlerType]: RecordHandlerType.ATTRIBUTES;
} & Iterable<RecordTag>;

export type RecordTag = (
	| { exists: true; hasFirstValue: true; firstValue: string; raw: TagPayload }
	| { exists: true; hasFirstValue: false; firstValue: null; raw: TagPayload }
	| { exists: false; hasFirstValue: false; firstValue: null; raw: null }
) & {
	get tag(): string;
	get first(): RecordItem;
	get length(): number;
	set(payload: TagPayload): void;
	delete(): void;
	push(...payload: ItemPayload[]): void;
	[index: number]: RecordItem;
	/**
	 * `value[i] = payload` and `value[i].set(payload)` can also be used.
	 */
	setAt(index: number, payload: ItemPayload | RecordItem): void;
	/**
	 * Delete items. **THIS WILL REINDEX THE ARRAY**
	 *
	 * `delete value[i]` can also be used.
	 */
	deleteAt(...index: number[]): void;
	[recordHandlerType]: RecordHandlerType.VALUE;
} & Iterable<{ exists: true } & RecordItem>;

export type RecordItem = (
	| { exists: true; hasValue: true; value: string; raw: ItemPayload }
	| { exists: true; hasValue: false; value: null; raw: ObjectPayload }
	| { exists: false; hasValue: false; value: null; raw: null }
) & {
	get attr(): RecordAttributes;
	/** `item.attr.TAG = payload` can also be used */
	setAttr(tag: string, value: TagPayload | RecordTag | RecordItem): void;
	/** `delete item.attr.TAG` can also be used */
	deleteAttr(tag: string): void;
	get index(): number;
	set(payload: ItemPayload | RecordItem): void;
	setValue(value: string): { hasValue: true } & RecordItem;
	[recordHandlerType]: RecordHandlerType.ITEM;
};
