import type { ItemSelector, TagSelector } from "./selector";
import {
	type RecordAttributes,
	RecordHandlerType,
	recordHandlerType,
	type RecordItem,
	type RecordTag,
} from "./interface";
import type { TagPayload } from "../models";
import { makeRecordTag } from "./tag";
import { resolveItem } from "./access";
import { MissingItemError } from "./errors";
import { setTag } from "./mutation";

export function makeRecordAttributes(selector: ItemSelector): RecordAttributes {
	return new Proxy(
		new RecordAttributesHandler(selector),
		recordAttributesProxyHandler,
	) as any;
}

const recordAttributesProxyHandler: ProxyHandler<RecordAttributesHandler> = {
	get(target, prop) {
		if (
			typeof prop == "string" &&
			prop != "get" &&
			prop != "set" &&
			prop != "delete"
		) {
			return target.get(prop);
		}
		// @ts-ignore
		return Reflect.get(...arguments);
	},
	set(target, prop, value) {
		if (typeof prop == "string") {
			target.set(prop, value);
			return true;
		}
		return false;
	},
	deleteProperty(target, prop): boolean {
		if (typeof prop == "string") {
			target.delete(prop);
			return true;
		}
		return false;
	},
};

class RecordAttributesHandler {
	constructor(private readonly selector: ItemSelector) {}

	get(tag: string): RecordTag {
		return makeRecordTag({
			record: this.selector.record,
			path: this.selector.path,
			tag,
		});
	}

	set(
		tag: string,
		value:
			| (TagPayload & { [recordHandlerType]: undefined })
			| RecordTag
			| RecordItem,
	): void {
		setTag(this.tagSelector(tag), value);
	}

	delete(tag: string): void {
		const item = resolveItem(this.selector);
		if (item == null) throw new MissingItemError(this.selector);
		if (typeof item != "string") {
			delete item.attr[tag];
		}
	}

	[Symbol.iterator]: () => Iterator<RecordTag> = () => {
		const item = resolveItem(this.selector);
		if (item === null || typeof item == "string") return [].values();
		return Object.entries(item.attr)
			.filter(([_tag, v]) => typeof v != "undefined")
			.map(([tag, _v]) => makeRecordTag(this.tagSelector(tag)))
			.values();
	};

	private tagSelector(tag: string): TagSelector {
		return {
			record: this.selector.record,
			path: this.selector.path,
			tag,
		};
	}

	get [recordHandlerType](): RecordHandlerType.ATTRIBUTES {
		return RecordHandlerType.ATTRIBUTES;
	}
}
