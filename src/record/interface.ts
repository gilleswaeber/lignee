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

export interface RecordRoot {
	readonly location: Location;
	readonly tag: string;
	readonly attr: RecordAttributes;
	/** `item.attr.TAG = payload` can also be used */
	setAttr(tag: string, value: Immutable<TagPayload> | RecordTag | RecordItem): void;
	/** `delete item.attr.TAG` can also be used */
	deleteAttr(tag: string): void;
	set(value: Immutable<ItemPayload> | RecordItem): void;
	readonly index: 0;
	readonly [recordHandlerType]: RecordHandlerType.ROOT;
}

export interface ReadOnlyRecordRoot {
	readonly location: Location;
	readonly tag: string;
	readonly attr: ReadOnlyRecordAttributes;
	readonly index: 0;
	readonly [recordHandlerType]: RecordHandlerType.ROOT;
}

export type RecordAttributes = {
	[tag: string]: RecordTag;
	readonly [recordHandlerType]: RecordHandlerType.ATTRIBUTES;
} & Iterable<RecordTag>;

export type ReadOnlyRecordAttributes = {
	[tag: string]: ReadOnlyRecordTag;
	readonly [recordHandlerType]: RecordHandlerType.ATTRIBUTES;
} & Iterable<ReadOnlyRecordTag>;

export type RecordTag = (
	| { readonly exists: true; readonly raw: Immutable<TagPayload> }
	| { readonly exists: false; readonly raw: null }
) & {
	readonly tag: string;
	readonly first: RecordItem;
	readonly length: number;
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
	readonly [recordHandlerType]: RecordHandlerType.VALUE;
} & Iterable<{ readonly exists: true } & RecordItem>;

export type ReadOnlyRecordTag = (
	| { readonly exists: true; readonly raw: Immutable<TagPayload> }
	| { readonly exists: false; readonly raw: null }
	) & {
	readonly tag: string;
	readonly first: ReadOnlyRecordItem;
	readonly length: number;
	readonly [index: number]: ReadOnlyRecordItem;
	readonly [recordHandlerType]: RecordHandlerType.VALUE;
} & Iterable<{ readonly exists: true } & ReadOnlyRecordItem>;

export type RecordItem = (
	| { readonly exists: true; readonly hasValue: true; readonly value: string; readonly raw: Immutable<ItemPayload> }
	| { readonly exists: true; readonly hasValue: false; readonly value: null; readonly raw: Immutable<ObjectPayload> }
	| { readonly exists: false; readonly hasValue: false; readonly value: null; readonly raw: null }
) & {
	readonly attr: RecordAttributes;
	/** `item.attr.TAG = payload` can also be used */
	setAttr(tag: string, value: Immutable<TagPayload> | RecordTag | RecordItem): void;
	/** `delete item.attr.TAG` can also be used */
	deleteAttr(tag: string): void;
	readonly index: number;
	set(payload: Immutable<ItemPayload> | RecordItem): void;
	setValue(value: string): { hasValue: true } & RecordItem;
	readonly [recordHandlerType]: RecordHandlerType.ITEM;
};

export type ReadOnlyRecordItem = (
	| { readonly exists: true; readonly hasValue: true; readonly value: string; readonly raw: Immutable<ItemPayload> }
	| { readonly exists: true; readonly hasValue: false; readonly value: null; readonly raw: Immutable<ObjectPayload> }
	| { readonly exists: false; readonly hasValue: false; readonly value: null; readonly raw: null }
	) & {
	readonly attr: ReadOnlyRecordAttributes;
	readonly index: number;
	readonly [recordHandlerType]: RecordHandlerType.ITEM;
};
