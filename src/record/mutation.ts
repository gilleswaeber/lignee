import type { ItemSelector, TagSelector } from "./selector";
import type { ItemPayload, ObjectPayload, TagPayload } from "../models";
import {
	AssignToNonExistentError,
	MissingItemError,
	AssignWithMissingParentError,
	RootUpdateError,
	DeleteWithMissingParentError,
	UnexpectedError,
	AssignOnNonExistentIndex,
} from "./errors";
import { resolveItem } from "./access";
import {
	RecordHandlerType,
	recordHandlerType,
	type RecordItem,
	type RecordTag,
} from "./interface";
import type { GedcomRecord } from "../reader/models";

function parentItemSelector(selector: ItemSelector) {
	if (!selector.path.length) throw new Error("No parent for the root selector");
	return { record: selector.record, path: selector.path.slice(0, -1) };
}

/* Ensure the selector points to an object payload. */
export function ensureObject(selector: ItemSelector): ObjectPayload {
	const item = resolveItem(selector);
	if (item == null) throw new MissingItemError(selector);
	if (typeof item == "string") {
		if (!selector.path.length) throw new UnexpectedError(`path.length == 0`);
		const parent = resolveItem(parentItemSelector(selector)) as ObjectPayload;
		const [tag, index] = selector.path.at(-1)!;
		const attr = parent.attr[tag]!;
		if (Array.isArray(attr)) {
			if (index > attr.length)
				throw new UnexpectedError(`index ${index} > ${attr.length}`);
			if (typeof attr[index] != "string")
				throw new UnexpectedError(`index ${index} > ${attr.length}`);
			return (parent.attr[index] = { value: attr[index], attr: {} });
		} else if (typeof attr == "string") {
			if (index != 0) throw new UnexpectedError(`index ${index}`);
			return (parent.attr[tag] = { value: attr, attr: {} });
		} else {
			throw new UnexpectedError(`attr ${attr}`);
		}
	}
	return item;
}

/* Ensure the selector points to an array of item payloads. */
export function ensureArray(selector: TagSelector): ItemPayload[] {
	const parent = ensureObject(selector);
	const attr = parent.attr[selector.tag];
	if (Array.isArray(attr)) {
		return attr;
	} else if (typeof attr != "undefined") {
		return (parent.attr[selector.tag] = [attr]);
	} else {
		return (parent.attr[selector.tag] = []);
	}
}

function tagPayload(
	value:
		| (TagPayload & { [recordHandlerType]?: undefined })
		| RecordTag
		| RecordItem,
) {
	switch (value[recordHandlerType]) {
		case RecordHandlerType.VALUE:
		case RecordHandlerType.ITEM:
			if (!value.exists) {
				throw new AssignToNonExistentError(value);
			}
			return structuredClone(value.raw);
		default:
			return value;
	}
}

export function setTag(
	selector: TagSelector,
	value:
		| (TagPayload & { [recordHandlerType]?: undefined })
		| RecordTag
		| RecordItem,
) {
	ensureObject(selector).attr[selector.tag] = tagPayload(value);
}

export function deleteTag(selector: TagSelector) {
	const parent = resolveItem(selector);
	if (parent == null) throw new DeleteWithMissingParentError(selector);
	if (typeof parent == "string") return;
	delete parent.attr[selector.tag];
}

export function setRoot(
	record: GedcomRecord,
	value: (ItemPayload & { [recordHandlerType]?: undefined }) | RecordItem,
) {
	const payload = itemPayload(value);
	if (typeof payload == "string") {
		record.value = payload;
		record.attr = {};
	} else {
		if (payload.tag && payload.tag != record.tag) {
			throw new RootUpdateError();
		}
		if (payload.xref && payload.xref != record.xref) {
			throw new RootUpdateError();
		}

		if (payload.value) record.value = payload.value;
		else delete record.value;
		record.attr = payload.attr;
	}
}

export function setItem(
	selector: ItemSelector,
	value: (ItemPayload & { [recordHandlerType]?: undefined }) | RecordItem,
) {
	const payload = itemPayload(value);
	const parent = resolveItem(parentItemSelector(selector));
	if (parent == null) throw new AssignWithMissingParentError(selector);
	const [tag, index] = selector.path.at(-1)!;
	const isFirst = index == 0;

	if (typeof parent == "string") {
		if (!isFirst) throw new AssignOnNonExistentIndex(selector);
		ensureObject(parentItemSelector(selector)).attr[tag] = payload;
	} else {
		const tagValue = parent.attr[tag];
		if (Array.isArray(tagValue)) {
			if (!isFirst && index > tagValue.length)
				throw new AssignOnNonExistentIndex(selector);
			if (isFirst && tagValue.length == 0) parent.attr[tag] = payload;
			else tagValue[index] = payload;
		} else {
			if (!isFirst) throw new AssignOnNonExistentIndex(selector);
			parent.attr[tag] = payload;
		}
	}
}

export function itemPayload(
	value: (ItemPayload & { [recordHandlerType]?: undefined }) | RecordItem,
): ItemPayload {
	switch (value[recordHandlerType]) {
		case RecordHandlerType.ITEM:
			if (!value.exists) {
				throw new AssignToNonExistentError(value);
			}
			return value.raw;
		default:
			return value;
	}
}
