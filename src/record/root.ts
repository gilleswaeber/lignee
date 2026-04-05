import type {ItemPayload, Location, TagPayload} from "../models";
import {
	type RecordAttributes,
	RecordHandlerType,
	recordHandlerType,
	type RecordItem,
	type RecordTag,
} from "./interface";
import {makeRecordAttributes} from "./attributes";
import {setRoot, setTag} from "./mutation";
import type {SelectorContext} from "./selector";

export class RecordReaderRootHandler {
	constructor(private readonly ctx: SelectorContext) {}

	get location(): Location {
		return this.ctx.getRecord().loc ?? {};
	}

	get tag(): string {
		return this.ctx.getRecord().tag;
	}

	get attr(): RecordAttributes {
		return makeRecordAttributes({ ctx: this.ctx, path: [] });
	}

	get index(): 0 {
		return 0;
	}

	set(value: (ItemPayload & { [recordHandlerType]?: undefined }) | RecordItem) {
		setRoot(this.ctx, value);
	}

	setAttr(
		tag: string,
		value:
			| (TagPayload & { [recordHandlerType]?: undefined })
			| RecordTag
			| RecordItem,
	): void {
		setTag({ ctx: this.ctx, path: [], tag }, value);
	}

	deleteAttr(tag: string): void {
		this.ctx.setRecord(r => ({
			...r,
			attr: Object.fromEntries(Object.entries(r.attr).filter(([k, _]) => k != tag))
		}));
	}

	get [recordHandlerType](): RecordHandlerType.ROOT {
		return RecordHandlerType.ROOT;
	}
}
