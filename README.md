Lignée
======

Lignée is a library for parsing, editing, and writing GEDCOM files.
It is designed to be fast, able to read files that don't totally respect the spec, and to have a nice serialized data representation.

## Features
- version independent parsing: supports GEDCOM 5.5 and 7.0+ files
- parsing from text, binary, (async-)iterable binary streams
- immutable objects used for records
- typed interface to traverse and mutate records
- no dependency on node or the browser, so both are supported

## How to use
```javascript
import {readTree, dumpTree, readRecord, produceRecord} from "lignee";
import {readFile, writeFile} from "node:fs/promises";

const fileData = await readFile("tree.ged");
const {tree, status} = readTree(fileData);

// display all warnings
console.log(JSON.stringify(status, null, 2));

// list all individuals
for (const xref of tree.byTag["INDI"]) {
	const r = readRecord(tree.byXref[xref]);
	const name = r.attr.NAME.first;
	console.log(`${xref} ${name.GIVN.first.value ?? "?"} ${name.SURN.first.value ?? "?"}`)
}

// change all last names to be uppercase
for (const xref of tree.byTag["INDI"]) {
	tree.byXref[xref] = produceRecord(tree.byXref[xref], r => {
		for (const name of r.attr.NAME) {
			for (const surn of name.attr.SURN) {
				if (surn.hasValue) surn.setValue(surn.value.toUpperCase());
			}
		}
	});
}

// write file
const updatedTree = dumpTree(tree);
await writeFile("tree.updated.ged", updatedTree, {encoding: "utf8"});
```
