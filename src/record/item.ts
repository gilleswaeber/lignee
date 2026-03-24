import type { ItemSelector } from "./selector";
import type { ItemPayload, ObjectPayload, TagPayload } from "../models";
import { resolveItem } from "./access";
import {
	type RecordAttributes,
	RecordHandlerType,
	recordHandlerType,
	type RecordItem,
	type RecordTag,
} from "./interface";
import { makeRecordAttributes } from "./attributes";
import { setItem, setTag } from "./mutation";
import { MissingItemError } from "./errors";

export function makeRecordItem(selector: ItemSelector): RecordItem {
	return new RecordItemValueHandler(selector) as any as RecordItem;
}

function itemExists(payload: ItemPayload | null): payload is ItemPayload {
	return payload != null;
}

class RecordItemValueHandler {
	constructor(private readonly selector: ItemSelector) {}

	get raw(): ItemPayload | null {
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
		value: (ItemPayload & { [recordHandlerType]: undefined }) | RecordItem,
	): void {
		setItem(this.selector, value);
	}

	setAttr(
		tag: string,
		value:
			| (TagPayload & { [recordHandlerType]?: undefined })
			| RecordTag
			| RecordItem,
	): void {
		setTag(
			{ record: this.selector.record, path: this.selector.path, tag },
			value,
		);
	}

	deleteAttr(tag: string): void {
		const item = resolveItem(this.selector);
		if (item == null) throw new MissingItemError(this.selector);
		if (typeof item != "string") {
			delete item.attr[tag];
		}
	}

	get index(): number {
		return this.selector.path.at(-1)![1];
	}

	setValue(value: string): this {
		const raw = this.raw;
		if (!itemExists(raw)) {
			setItem(this.selector, value);
		} else if (typeof raw == "string") {
			const parent = resolveItem({
				record: this.selector.record,
				path: this.selector.path.slice(0, -1),
			}) as ObjectPayload;
			const [tag, index] = this.selector.path.at(-1) as [string, number];
			const p = parent.attr[tag]!;
			if (Array.isArray(p)) {
				p[index] = value;
			} else if (typeof p == "string") {
				if (index != 0) throw new Error(`Unexpected index ${index}`);
				parent.attr[tag] = value;
			} else {
				throw new Error(`Unexpected parent payload ${p}`);
			}
		} else {
			raw.value = value;
		}
		return this;
	}

	get [recordHandlerType](): RecordHandlerType.ITEM {
		return RecordHandlerType.ITEM;
	}
}
