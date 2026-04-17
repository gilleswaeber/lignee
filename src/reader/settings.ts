import { LineTerminator } from "../models";

export type ReaderSettings = {
	/** Set the line terminator, default is 'mixed'. */
	ln: LineTerminator;
	/** When a line is not valid GEDCOM, assume an implicit continuation instead of raising an error. */
	allowImplicitContinuation: boolean;
};

export const DefaultReaderSettings: ReaderSettings = {
	ln: LineTerminator.LF,
	allowImplicitContinuation: false,
} as const;
