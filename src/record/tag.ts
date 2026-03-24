import type { ItemSelector, TagSelector } from "./selector";
import {
	RecordHandlerType,
	recordHandlerType,
	type RecordItem,
	type RecordTag,
} from "./interface";
import type { ItemPayload, TagPayload } from "../models";
import { firstValue, resolveItem } from "./access";
import { makeRecordItem } from "./item";
import { MissingItemError } from "./errors";
import {
	deleteTag,
	ensureArray,
	itemPayload,
	setItem,
	setTag,
} from "./mutation";

export function makeRecordTag(selector: TagSelector): RecordTag {
	return new Proxy(
		new RecordTagHandler(selector),
		recordTagProxyHandler,
	) as any as RecordTag;
}

const recordTagProxyHandler: ProxyHandler<RecordTagHandler> = {
	get(target, prop) {
		if (typeof prop == "string" && /^[0-9]+$/.test(prop)) {
			return target.at(parseInt(prop, 10));
		}
		// @ts-ignore
		return Reflect.get(...arguments);
	},
	set(target, prop, value) {
		if (typeof prop == "string" && /^[0-9]+$/.test(prop)) {
			target.setAt(parseInt(prop, 10), value);
			return true;
		}
		return false;
	},
	deleteProperty(target: RecordTagHandler, prop: string | symbol): boolean {
		if (typeof prop == "string" && /^[0-9]+$/.test(prop)) {
			target.deleteAt(parseInt(prop, 10));
			return true;
		}
		return false;
	},
};

function tagLength(payload: TagPayload | null): number {
	if (Array.isArray(payload)) return payload.length;
	else if (payload != null) return 1;
	else return 0;
}

class RecordTagHandler {
	constructor(private readonly selector: TagSelector) {}

	private get raw(): TagPayload | null {
		const parent = resolveItem(this.selector);
		if (parent == null || typeof parent == "string") return null;
		return parent.attr[this.selector.tag] ?? null;
	}

	get exists(): boolean {
		return this.raw != null;
	}

	get hasFirstValue(): boolean {
		return this.firstValue != null;
	}

	get firstValue(): string | null {
		return firstValue(this.raw);
	}

	get tag(): string {
		return this.selector.tag;
	}

	get first(): RecordItem {
		return makeRecordItem(this.itemSelector(0));
	}

	get length(): number {
		return tagLength(this.raw);
	}

	at(index: number): RecordItem {
		return makeRecordItem(this.itemSelector(index));
	}

	private itemSelector(index: number): ItemSelector {
		return {
			record: this.selector.record,
			path: [...this.selector.path, [this.selector.tag, index]],
		};
	}

	set(
		value:
			| (TagPayload & { [recordHandlerType]: undefined })
			| RecordTag
			| RecordItem,
	): void {
		setTag(this.selector, value);
	}

	setAt(
		index: number,
		value: (ItemPayload & { [recordHandlerType]: undefined }) | RecordItem,
	) {
		setItem(this.itemSelector(index), value);
	}

	deleteAt(...index: number[]): void {
		const raw = this.raw;
		const length = tagLength(raw);
		const invalid = index.filter((i) => i < 0 || i > length);
		if (invalid)
			throw new MissingItemError({
				record: this.selector.record,
				path: [...this.selector.path, [this.selector.tag, invalid[0]]],
			});

		if (Array.isArray(raw)) {
			const updated = raw.filter((_, i) => !index.includes(i));
			if (updated.length) setTag(this.selector, updated);
			else deleteTag(this.selector);
		} else {
			if (length > 0 && index.includes(0)) {
				deleteTag(this.selector);
			}
		}
	}

	push(
		...payload: (
			| (ItemPayload & { [recordHandlerType]: undefined })
			| RecordItem
		)[]
	): void {
		if (!payload.length) return;
		else if (payload.length == 1 && !this.exists) this.set(payload[0]);
		else ensureArray(this.selector).push(...payload.map((p) => itemPayload(p)));
	}

	[Symbol.iterator](): Iterator<RecordItem> {
		const raw = this.raw;
		if (Array.isArray(raw)) {
			return raw
				.map((_, i) =>
					makeRecordItem({
						record: this.selector.record,
						path: [...this.selector.path, [this.selector.tag, i]],
					}),
				)
				.values();
		} else if (raw != null) {
			return [
				makeRecordItem({
					record: this.selector.record,
					path: [...this.selector.path, [this.selector.tag, 0]],
				}),
			].values();
		} else {
			return [].values();
		}
	}

	get [recordHandlerType](): RecordHandlerType.VALUE {
		return RecordHandlerType.VALUE;
	}
}
