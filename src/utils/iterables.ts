export function* enumerate<T>(it: Iterable<T>): Generator<[number, T]> {
	let index = 0;
	for (const item of it) {
		yield [index++, item];
	}
}

export async function* asyncEnumerate<T>(
	it: Iterable<T> | AsyncIterable<T>,
): AsyncGenerator<[number, T]> {
	let index = 0;
	for await (const item of it) {
		yield [index++, item];
	}
}
