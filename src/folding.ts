import { FoldingRangeProvider, TextDocument, FoldingContext, CancellationToken,
    ProviderResult, FoldingRange } from 'vscode';

enum FoldingType {
    LocalDocComment,
    GlobalDocComment,
    ExternCrate,
    Mod,
}

export class MyFoldingRangeProvider implements FoldingRangeProvider {
    provideFoldingRanges(document: TextDocument, _context: FoldingContext, token: CancellationToken): ProviderResult<FoldingRange[]> {
        const ret: FoldingRange[] = [];
        let type: FoldingType | undefined = undefined;
        let from;

        for (const line of lines(document)) {
            if (token.isCancellationRequested) {
                return [];
            }
            const text = line.text.substr(line.firstNonWhitespaceCharacterIndex);
            if (text.startsWith('///')) {
                if (type != FoldingType.LocalDocComment) {
                    maybePushFoldingRange(from, line.lineNumber, ret);
                    from = line.lineNumber;
                }
                type = FoldingType.LocalDocComment;
            } else if (text.startsWith('//!')) {
                if (type != FoldingType.GlobalDocComment) {
                    maybePushFoldingRange(from, line.lineNumber, ret);
                    from = line.lineNumber;
                }
                type = FoldingType.GlobalDocComment;
            } else if (text.startsWith('extern crate')) { //TODO: do not get "disturbed" by attributes
                if (type != FoldingType.ExternCrate) {
                    maybePushFoldingRange(from, line.lineNumber, ret);
                    from = line.lineNumber;
                }
                type = FoldingType.ExternCrate;
            } else if (text.startsWith('mod')) { //TODO: do not get "disturbed" by attributes
                if (type != FoldingType.Mod) {
                    maybePushFoldingRange(from, line.lineNumber, ret);
                    from = line.lineNumber;
                }
                type = FoldingType.Mod;
            } else if (type != undefined) {
                maybePushFoldingRange(from, line.lineNumber, ret);
                type = undefined;
            }
        }
        return ret;
    }
}

/* Helpers */

function* lines(doc: TextDocument) {
    for (let i = 0; i < doc.lineCount; ++i) {
        yield doc.lineAt(i);
    }
}

function maybePushFoldingRange(from: number | undefined, to: number, ret: FoldingRange[]) {
    --to;
    if (from != undefined && from != to) {
        ret.push(new FoldingRange(from, to));
    }
}
