import { type Location, type StatusMessage, WarningCode } from "./models";

export class Status {
	public warnings: StatusMessage[] = [];

	public warn(loc: Location, code: WarningCode, detail?: string) {
		this.warnings.push({
			loc,
			code,
			detail,
		});
	}
}
