import * as vscode from 'vscode';

export function getMorph(this: void, morph: string | null, caseSensitive: boolean): IMorph {
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

export function run(
  this: void,
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  morph: IMorph,
  naturalSort: boolean,
) {
  const selections = unique(
    sort(editor.selections.map((selection) => getSelectionData(editor.document, selection, morph, naturalSort))),
  );
  const texts = sortTexts(selections);
  for (let i = selections.length - 1; i >= 0; --i) edit.replace(selections[i].line, texts[i]);
}

function getSelectionData(
  this: void,
  document: vscode.TextDocument,
  selection: vscode.Selection,
  morph: IMorph,
  naturalSort: boolean,
): ISelectionData {
  const line = lineFromSelection(document, selection);
  const comparisonText = morph(document.getText(selection));
  const comparison = naturalSort ? prepareNaturalSort(comparisonText) : [comparisonText];
  return {
    selection: selection,
    comparison,
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

const RE_NUMBER = /-?\d+(\.\d+)?/g;

type Chunk = string | number;

function prepareNaturalSort(s: string): Chunk[] {
  // Split the source string into character chunks and numeric chunks
  let m: RegExpExecArray | null;
  let i = 0;
  const ret: Chunk[] = [];
  while ((m = RE_NUMBER.exec(s))) {
    if (i < m.index) ret.push(s.substring(i, m.index));
    ret.push(parseFloat(m[0]));
    i = m.index + m[0].length;
  }
  if (i < s.length) ret.push(s.substring(i));
  return ret;
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
    .sort((a, b) => compare(a.comparison, b.comparison))
    .map((selection) => selection.lineText);
}

function compare(this: void, a: Chunk[], b: Chunk[]) {
  for (let i = 0; i < a.length && i < b.length; ++i) {
    // If different types, consider numbers less than character strings
    if (typeof a[i] !== typeof b[i]) return typeof a[i] == 'number' ? -1 : 1;

    // Same-type comparison
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }

  // If one array is a prefix of another, the longer array is greater.
  return a.length - b.length;
}

interface IMorph {
  (s: string): string;
}

interface ISelectionData {
  selection: vscode.Selection;
  comparison: Chunk[];
  line: vscode.Range;
  lineText: string;
}
