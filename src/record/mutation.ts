import type {ItemSelector, SelectorContext, TagSelector} from "./selector";
import type {ItemPayload, TagPayload} from "../models";
import {AssignToNonExistentError, DeleteWithMissingParentError, RootUpdateError,} from "./errors";
import {matchItemPayload, matchTagPayload, updateItem, updateTag} from "./access";
import {RecordHandlerType, recordHandlerType, type RecordItem, type RecordTag,} from "./interface";
import type {Immutable} from "../utils/immutable";

function tagPayload(
	value:
		| (Immutable<TagPayload> & { [recordHandlerType]?: undefined })
		| RecordTag
		| RecordItem,
): Immutable<TagPayload> {
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
		| (Immutable<TagPayload> & { [recordHandlerType]?: undefined })
		| RecordTag
		| RecordItem,
) {
	const payload = tagPayload(value);
	updateItem({
		selector,
		create: true,
		update: parent => {
			if (parent == null) return {attr: {[selector.tag]: payload}};
			else if (typeof parent == "string") return {value: parent, attr: {[selector.tag]: payload}};
			else return {...parent, attr: {...parent.attr, [selector.tag]: payload}};
		}
	});
}

export function deleteTag(selector: TagSelector) {
	updateItem({
		selector,
		skipMissing: true,
		update: parent => {
			if (parent == null) throw new DeleteWithMissingParentError(selector);
			if (typeof parent == "string") return parent;
			return {
				...parent,
				attr: Object.fromEntries(Object.entries(parent.attr).filter(([k, _]) => k != selector.tag))
			}
		}
	});
}

export function setRoot(
	ctx: SelectorContext,
	value: (ItemPayload & { [recordHandlerType]?: undefined }) | RecordItem,
) {
	const payload = itemPayload(value);
	ctx.setRecord(r => {
		if (typeof payload == "string") {
			return {...r, value: payload, attr: {}};
		} else {
			if (payload.tag && payload.tag != r.tag) {
				throw new RootUpdateError();
			}
			if (payload.xref && payload.xref != r.xref) {
				throw new RootUpdateError();
			}

			return {
				...r,
				value: payload.value,
				attr: payload.attr,
			};
		}
	});
}

export function setItem(
	selector: ItemSelector,
	value: (Immutable<ItemPayload> & { [recordHandlerType]?: undefined }) | RecordItem,
): void {
	updateItem({
		selector,
		create: true,
		update: () => itemPayload(value),
	});
}

export function pushItems(
	selector: TagSelector,
	value: ((Immutable<ItemPayload> & { [recordHandlerType]: undefined }) | RecordItem)[]
): void {
	if (!value.length) return;
	const payloads = value.map((p) => itemPayload(p));
	updateTag({
		selector,
		create: true,
		update: it => matchTagPayload<Immutable<TagPayload>>(it, {
			missing: () => payloads.length == 1 ? payloads[0] : payloads,
			array: arr => (arr.length == 0 && payloads.length == 1) ? payloads[0] : [...arr, ...payloads],
			single: a0 => [a0, ...payloads],
		})
	});
}

export function setItemValue(selector: ItemSelector, value: string): void {
	updateItem({
		selector,
		create: true,
		update: it => matchItemPayload<Immutable<ItemPayload>>(it, {
			missing: () => value,
			object: obj => ({...obj, value}),
			string: () => value,
		})
	});
}

function itemPayload(
	value: (Immutable<ItemPayload> & { [recordHandlerType]?: undefined }) | RecordItem,
): Immutable<ItemPayload> {
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
