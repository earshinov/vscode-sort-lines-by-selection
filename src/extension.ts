'use strict';
import * as vscode from 'vscode';

export function activate(this: void, context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('sort-lines-by-selection.sortLinesBySelection', (editor, edit, args) => {
      try {
        const { morph = null, case_sensitive = false } = args || {};
        run(editor, edit, getMorph(morph, case_sensitive));
      } catch (e) {
        console.error(e);
        throw e;
      }
    }),
  );
}

function getMorph(this: void, morph: string | null, caseSensitive: boolean): IMorph {
  const morphFunction: IMorph = (morph && compileMorph(morph)) || ((s) => s);
  return caseSensitive ? morphFunction : (s) => morphFunction(s.toLowerCase());
}

function compileMorph(this: void, morph: string): IMorph | null {
  try {
    return eval('s => ' + morph);
  } catch (e) {
    return null;
  }
}

function run(this: void, editor: vscode.TextEditor, edit: vscode.TextEditorEdit, morph: IMorph) {
  const selections = unique(
    sort(editor.selections.map((selection) => getSelectionData(editor.document, selection, morph))),
  );
  const texts = sortTexts(selections);
  for (let i = selections.length - 1; i >= 0; --i) edit.replace(selections[i].line, texts[i]);
}

function getSelectionData(
  this: void,
  document: vscode.TextDocument,
  selection: vscode.Selection,
  morph: IMorph,
): ISelectionData {
  const line = lineFromSelection(document, selection);
  return {
    selection: selection,
    comparisonText: morph(document.getText(selection)),
    line: line,
    lineText: document.getText(line),
  };
}

function lineFromSelection(this: void, document: vscode.TextDocument, selection: vscode.Selection) {
  const pos = selection.start;
  const lineStart = pos.with({ character: 0 });
  const lineEnd = document.lineAt(pos).range.end;
  return new vscode.Range(lineStart, lineEnd);
}

function sort(this: void, selections: ISelectionData[]) {
  return selections
    .slice() // clone
    .sort(function (a, b) {
      const aStart = a.line.start;
      const bStart = b.line.start;
      return aStart.compareTo(bStart);
    });
}

function unique(this: void, selections: ISelectionData[]) {
  const unique: ISelectionData[] = [];
  let prev: vscode.Position | null = null;
  for (const selection of selections) {
    const current = selection.line.start;
    if (prev != null && current.isEqual(prev)) continue;
    unique.push(selection);
    prev = current;
  }
  return unique;
}

function sortTexts(this: void, selections: ISelectionData[]) {
  return selections
    .slice() // clone
    .sort((a, b) => compare(a.comparisonText, b.comparisonText))
    .map((selection) => selection.lineText);
}

function compare(this: void, a: any, b: any) {
  return a < b ? -1 : a > b ? 1 : 0;
}

interface IMorph {
  (s: string): string;
}

interface ISelectionData {
  selection: vscode.Selection;
  comparisonText: string;
  line: vscode.Range;
  lineText: string;
}
