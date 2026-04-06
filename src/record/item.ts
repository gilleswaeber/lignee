import type { ItemSelector, TagSelector } from "./selector";
import type { ItemPayload, TagPayload } from "../models";
import { resolveItem } from "./access";
import {
	type RecordAttributes,
	RecordHandlerType,
	recordHandlerType,
	type RecordItem,
	type RecordTag,
} from "./interface";
import { makeRecordAttributes } from "./attributes";
import { deleteTag, setItem, setItemValue, setTag } from "./mutation";
import type { Immutable } from "../utils/immutable";

export function makeRecordItem(selector: ItemSelector): RecordItem {
	return new RecordItemValueHandler(selector) as unknown as RecordItem;
}

function itemExists(
	payload: Immutable<ItemPayload> | null,
): payload is ItemPayload {
	return payload != null;
}

class RecordItemValueHandler {
	constructor(private readonly selector: ItemSelector) {}

	get raw(): Immutable<ItemPayload> | null {
		return resolveItem(this.selector);
	}

	get exists(): boolean {
		return itemExists(this.raw);
	}

	get value(): string | null {
		const raw = this.raw;
		if (!itemExists(raw)) return null;
		return typeof raw == "string" ? raw : (raw.value ?? null);
	}

	get hasValue(): boolean {
		return this.value != null;
	}

	get attr(): RecordAttributes {
		return makeRecordAttributes(this.selector);
	}

	set(
		value:
			| (Immutable<ItemPayload> & { [recordHandlerType]: undefined })
			| RecordItem,
	): void {
		setItem(this.selector, value);
	}

	setAttr(
		tag: string,
		value:
			| (Immutable<TagPayload> & { [recordHandlerType]?: undefined })
			| RecordTag
			| RecordItem,
	): void {
		setTag({ ctx: this.selector.ctx, path: this.selector.path, tag }, value);
	}

	deleteAttr(tag: string): void {
		deleteTag(this.tagSelector(tag));
	}

	get index(): number {
		return this.selector.path.at(-1)![1];
	}

	private tagSelector(tag: string): TagSelector {
		return {
			ctx: this.selector.ctx,
			path: this.selector.path,
			tag,
		};
	}

	setValue(value: string): this {
		setItemValue(this.selector, value);
		return this;
	}

	get [recordHandlerType](): RecordHandlerType.ITEM {
		return RecordHandlerType.ITEM;
	}
}
