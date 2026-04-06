Lignée's What's Next
=====================

A rough plan of what might come at some point, ordered by theme.

### Higher-level APIs
- provide a tree class instead of using low-level functions to read and edit the tree
- improve error messages for status and operations

### Context-aware values
- dates parsing and serialization
  - support for common calendars
  - support for cusomizable locale-aware fallback parsing
- distinction between values and cross-references
  - automatically (un)escape `@` depending on the current GEDCOM version

### Schema integration
- reference schemas for GECOM 5.5 and 7
- tooling to derive/update/check a schema using a GEDCOM file
- generation of type files
- support of GEDCOM 7 namespaces

### Serialization
- streamable file writing

### Algorithms
- tree traversal
- common ancestors, parent search

## Out of scope

The features that are considered out of scope for this project.

### Special GEDCOM features
- migration between 5.5 and 7
- support for the [ANSEL character set](https://en.wikipedia.org/wiki/ANSEL)

### Visualization
- interactive UI
- report generation
