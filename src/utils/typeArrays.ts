/** Merge multiple Uint8Arrays */
export function mergeUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
	if (!arrays.length) return new Uint8Array(0);
	const length = arrays.reduce((sum, arr) => sum + arr.length, 0);
	if (arrays[0].length === length) return arrays[0];
	const result = new Uint8Array(length);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}
