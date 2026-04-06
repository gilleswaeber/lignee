/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * TextDecoder class declaration
 *
 * Widely available since January 2020 in browsers and added in Node v8.3.0.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/TextDecoder)
 * [Node.js Reference](https://nodejs.org/api/util.html#class-utiltextdecoder)
 */
declare class TextDecoder {
	constructor(
		encoding?: string,
		options?: {
			fatal?: boolean;
			ignoreBOM?: boolean;
		},
	);
	decode(input?: Uint8Array | ArrayBuffer): string;
}

/**
 * TextEncoder class declaration
 *
 * Widely available since January 2020 in browsers and added in Node v8.3.0.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/TextEncoder)
 * [Node.js Reference](https://nodejs.org/api/util.html#class-utiltextencoder)
 */
declare class TextEncoder {
	constructor();
	encode(input?: string): Uint8Array;
}

/**
 * Creates a deep clone of a given value using the structured clone algorithm.
 *
 * Widely available sins March 2022 in browsers and added in Node v17.
 *
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
 */
declare function structuredClone<T>(
	value: T,
	options?: { transfer: unknown[] },
): T;
