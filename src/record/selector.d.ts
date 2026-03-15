import type { GedcomRecord } from "../reader/models.ts";

/**
 * Selector for a single element (existing or not).
 *
 * For example:
 * - `record.NAME.first` (path: `[['NAME', 0]]`) the first NAME item
 * - `[...record.NAME]` (path: `[['NAME', i]]`) for `i ∈ 0 .. record.NAME.length` all the NAME items taken separately.
 */
export type ItemSelector = {
	record: GedcomRecord;
	path: [string, number][];
};

/**
 * Selector for items of a given tag in a single element (can be empty, the parent element may not exist).
 *
 * For example:
 * - `record.NAME` (path: `[]`, tag: `'NAME'`) all root NAME items
 * - `record.NAME.first.attr.GIVN` (path: `[['NAME', 0]]`, tag: `'GIVN'`) all GIVN items in the first NAME element.
 * - `[...record.NAME.first.attr]` (path: `[['NAME', 0]]`, tag: `tag`) for `tag ∈ record.NAME.first.tags`
 *
 * `record.NAME.attr.GIVN` is not a valid selector as there can be any number of root NAME items.
 */
export type TagSelector = {
	record: GedcomRecord;
	path: [string, number][];
	tag: string;
};
