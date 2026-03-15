import type { ItemPayload, TagPayload } from "../models";
import type { ItemSelector } from "./selector";

export function resolveItem(selector: ItemSelector): ItemPayload | null {
	let p: ItemPayload = selector.record;
	for (const item of selector.path) {
		const [tag, index] = item;
		if (typeof p == "string") return null;
		if (!Object.hasOwn(p.attr, tag)) return null;
		const a: TagPayload | undefined = p.attr[tag];
		if (typeof a == "undefined") return null;
		if (Array.isArray(a)) {
			if (index > a.length) return null;
			p = a[index];
		} else {
			if (index > 0) return null;
			p = a;
		}
	}
	return p;
}

export function firstValue(payload: TagPayload | null): string | null {
	payload = firstItem(payload);
	if (typeof payload == "string" || payload == null) {
		return payload;
	}
	return payload.value ?? null;
}

export function firstItem(payload: TagPayload | null): ItemPayload | null {
	if (Array.isArray(payload)) {
		return payload.length ? payload[0] : null;
	} else {
		return payload;
	}
}
