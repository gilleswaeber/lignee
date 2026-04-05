type ImmutablePrimitive = undefined | null | boolean | string | number | Function;

/**
 * Recursively immutable type.
 * Source: https://stackoverflow.com/a/58993872 or https://github.com/microsoft/TypeScript/issues/13923#issuecomment-557509399
 */
export type Immutable<T> =
	T extends ImmutablePrimitive ? T :
		T extends Array<infer U> ? ImmutableArray<U> :
			T extends Map<infer K, infer V> ? ImmutableMap<K, V> :
				T extends Set<infer M> ? ImmutableSet<M> : ImmutableObject<T>;

type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };
