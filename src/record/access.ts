import type { ItemPayload, ObjectPayload, TagPayload } from "../models";
import type { ItemSelector, TagSelector } from "./selector";
import type { Immutable } from "../utils/immutable";
import {
	AssignOnNonExistentIndex,
	MissingItemError,
	UnexpectedError,
} from "./errors";
import type { GedcomRecord } from "../reader/models";

export function resolveItem(
	selector: ItemSelector,
): Immutable<ItemPayload> | null {
	let p: Immutable<ItemPayload> | null = selector.ctx.getRecord();
	for (const item of selector.path) {
		const [tag, index] = item;
		p = matchItemPayload(p, {
			missing: () => null,
			string: () => null,
			object: (obj) => {
				if (!Object.hasOwn(obj.attr, tag)) return null;
				return matchTagPayload(obj.attr[tag], {
					missing: () => null,
					single: (a0) => (index == 0 ? a0 : null),
					array: (arr) => (index < arr.length ? arr[index] : null),
				});
			},
		});
		if (p == null) break;
	}
	return p;
}

function deepItemUpdate(
	u: UpdateItem,
	it: Immutable<ItemPayload> | null,
	depth: number,
): Immutable<ItemPayload> {
	if (u.selector.path.length == depth) return u.update(it);
	const [tag, index] = u.selector.path[depth];
	return matchItemPayload<Immutable<ItemPayload>>(it, {
		missing: () => {
			if (!u.create) throw new MissingItemError(u.selector);
			if (index != 0) throw new AssignOnNonExistentIndex(u.selector);

			return { attr: { [tag]: deepItemUpdate(u, null, depth + 1) } };
		},
		string: (value) => {
			if (u.skipMissing) return value;
			if (!u.create) throw new MissingItemError(u.selector);
			if (index != 0) throw new AssignOnNonExistentIndex(u.selector);

			return {
				value,
				attr: { [tag]: deepItemUpdate(u, null, depth + 1) },
			};
		},
		object: (obj) =>
			matchTagPayload<Immutable<ItemPayload>>(obj.attr[tag], {
				single: (a) => {
					if (index > 0 && u.skipMissing) return obj;
					if (index == 1 && u.create)
						return {
							...obj,
							attr: {
								...obj.attr,
								[tag]: [a, deepItemUpdate(u, null, depth + 1)],
							},
						};
					if (index > 0) throw new MissingItemError(u.selector);

					return {
						...obj,
						attr: {
							...obj.attr,
							[tag]: deepItemUpdate(u, a, depth + 1),
						},
					};
				},
				array: (a) => {
					if (index >= a.length && u.skipMissing) return obj;
					if (index == a.length && u.create)
						return {
							...obj,
							attr: {
								...obj.attr,
								[tag]: [...a, deepItemUpdate(u, null, depth + 1)],
							},
						};
					if (index >= a.length) throw new MissingItemError(u.selector);

					return {
						...obj,
						attr: {
							...obj.attr,
							[tag]: a.map((v, k) =>
								k != index ? v : deepItemUpdate(u, a[index], depth + 1),
							),
						},
					};
				},
				missing: () => {
					if (u.skipMissing) return obj;
					if (!u.create) throw new MissingItemError(u.selector);

					return {
						...obj,
						attr: { ...obj.attr, [tag]: deepItemUpdate(u, null, depth + 1) },
					};
				},
			}),
	});
}

type UpdateItem = {
	selector: ItemSelector;
	update: (it: Immutable<ItemPayload> | null) => Immutable<ItemPayload>;
	create?: boolean;
	/** create the items when possible (attributes and first items) */
	skipMissing?: boolean;
	/** stop when encountering a missing object */
};

type UpdateTag = {
	selector: TagSelector;
	update: (it: Immutable<TagPayload> | null) => Immutable<TagPayload>;
	create?: boolean;
	/** create the items when possible (attributes and first items) */
	skipMissing?: boolean;
};

export function matchItemPayload<R>(
	p: Immutable<ItemPayload> | null | undefined,
	h: {
		missing: () => R;
		string: (p: string) => R;
		object: (p: Immutable<ObjectPayload>) => R;
	},
): R {
	if (typeof p == "undefined" || p == null) return h.missing();
	else if (typeof p == "string") return h.string(p);
	else return h.object(p);
}

export function matchTagPayload<R>(
	p: Immutable<TagPayload> | null | undefined,
	h: {
		missing: () => R;
		array: (a: Immutable<ItemPayload>[]) => R;
		single: (it: Immutable<ItemPayload>) => R;
	},
): R {
	if (typeof p == "undefined" || p == null) return h.missing();
	else if (Array.isArray(p)) return h.array(p);
	else return h.single(p as Immutable<ItemPayload>);
}

export function updateItem(update: UpdateItem): void {
	update.selector.ctx.setRecord(
		(r) => deepItemUpdate(update, r, 0) as Immutable<GedcomRecord>,
	);
}

export function updateTag({
	selector,
	update,
	create,
	skipMissing,
}: UpdateTag): void {
	updateItem({
		selector,
		update: (it) =>
			matchItemPayload<Immutable<ItemPayload>>(it, {
				missing: () => {
					if (skipMissing) throw new UnexpectedError("skipMissing");
					if (!create) throw new MissingItemError(selector);

					return { attr: { [selector.tag]: update(null) } };
				},
				string: (value) => {
					if (skipMissing) return value;
					if (!create) throw new MissingItemError(selector);

					return { value, attr: { [selector.tag]: update(null) } };
				},
				object: (it) => {
					if (Object.hasOwn(it.attr, selector.tag) && it.attr[selector.tag]) {
						return {
							...it,
							attr: {
								...it.attr,
								[selector.tag]: update(it.attr[selector.tag]!),
							},
						};
					} else {
						if (skipMissing) return it;
						if (!create) throw new MissingItemError(selector);

						return {
							...it,
							attr: { ...it.attr, [selector.tag]: update(null) },
						};
					}
				},
			}),
		create,
		skipMissing: skipMissing,
	});
}
