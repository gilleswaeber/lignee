import type {
	ItemPayload,
	Location,
	ObjectPayload,
	TagPayload,
} from "../models";
import type {Immutable} from "../utils/immutable";

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
	setAttr(tag: string, value: Immutable<TagPayload> | RecordTag | RecordItem): void;
	/** `delete item.attr.TAG` can also be used */
	deleteAttr(tag: string): void;
	set(value: Immutable<ItemPayload> | RecordItem): void;
	get index(): 0;
	[recordHandlerType]: RecordHandlerType.ROOT;
}

export type RecordAttributes = {
	[tag: string]: RecordTag;
	[recordHandlerType]: RecordHandlerType.ATTRIBUTES;
} & Iterable<RecordTag>;

export type RecordTag = (
	| { exists: true; raw: Immutable<TagPayload> }
	| { exists: false; raw: null }
) & {
	get tag(): string;
	get first(): RecordItem;
	get length(): number;
	set(payload: Immutable<TagPayload>): void;
	delete(): void;
	push(...payload: Immutable<ItemPayload>[]): void;
	[index: number]: RecordItem;
	/**
	 * `value[i] = payload` and `value[i].set(payload)` can also be used.
	 */
	setAt(index: number, payload: Immutable<ItemPayload> | RecordItem): void;
	/**
	 * Delete items. **THIS WILL REINDEX THE ARRAY**
	 *
	 * `delete value[i]` can also be used.
	 */
	deleteAt(...index: number[]): void;
	[recordHandlerType]: RecordHandlerType.VALUE;
} & Iterable<{ exists: true } & RecordItem>;

export type RecordItem = (
	| { exists: true; hasValue: true; value: string; raw: Immutable<ItemPayload> }
	| { exists: true; hasValue: false; value: null; raw: Immutable<ObjectPayload> }
	| { exists: false; hasValue: false; value: null; raw: null }
) & {
	get attr(): RecordAttributes;
	/** `item.attr.TAG = payload` can also be used */
	setAttr(tag: string, value: Immutable<TagPayload> | RecordTag | RecordItem): void;
	/** `delete item.attr.TAG` can also be used */
	deleteAttr(tag: string): void;
	get index(): number;
	set(payload: Immutable<ItemPayload> | RecordItem): void;
	setValue(value: string): { hasValue: true } & RecordItem;
	[recordHandlerType]: RecordHandlerType.ITEM;
};
