import { LineTerminator } from "../models";

export type WriterSettings = {
	ln: LineTerminator;
	/** Use CONC to cut lines longer than 255 bytes as specified in the GEDCOM specification until 7.0. */
	wrapText: boolean;
};

export const DefaultWriterSettings: WriterSettings = {
	ln: LineTerminator.LF,
	wrapText: false,
};
