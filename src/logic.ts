import * as vscode from 'vscode';

export function getMorph(morph: string | null, caseSensitive: boolean): IMorph {
  const morphFunction: IMorph = (morph && compileMorph(morph)) || ((s) => s);
  return caseSensitive ? morphFunction : (s) => morphFunction(s.toLowerCase());
}

function compileMorph(morph: string): IMorph | null {
  try {
    // eslint-disable-next-line no-eval
    return eval('s => ' + morph);
  } catch (e) {
    return null;
  }
}

export function run(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, morph: IMorph, naturalSort: boolean): void {
  let selections: ISelectionData[];
  if (editor.selections.length === 1) {
    // Sort whole lines when given a single selection (#1)
    selections = [];
    for (let i = editor.selection.start.line; i <= editor.selection.end.line; ++i)
      selections.push(getLineData(editor.document, i, morph, naturalSort));
    selections = sort(selections);
  } else {
    // Sort lines by selection
    selections = unique(
      sort(editor.selections.map((selection) => getSelectionData(editor.document, selection, morph, naturalSort)))
    );
  }
  const texts = sortTexts(selections);
  for (let i = selections.length - 1; i >= 0; --i) edit.replace(selections[i].line, texts[i]);
}

function getSelectionData(
  document: vscode.TextDocument,
  selection: vscode.Selection,
  morph: IMorph,
  naturalSort: boolean
): ISelectionData {
  const line = document.lineAt(selection.start);
  const comparisonText = morph(document.getText(selection));
  const comparison = naturalSort ? prepareNaturalSort(comparisonText) : [comparisonText];
  return {
    comparison,
    line: line.range,
    lineText: line.text
  };
}

function getLineData(
  document: vscode.TextDocument,
  lineno: number,
  morph: IMorph,
  naturalSort: boolean
): ISelectionData {
  const line = document.lineAt(lineno);
  const comparisonText = morph(line.text);
  const comparison = naturalSort ? prepareNaturalSort(comparisonText) : [comparisonText];
  return {
    comparison,
    line: line.range,
    lineText: line.text
  };
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

function sort(selections: ISelectionData[]) {
  return selections
    .slice() // clone
    .sort((a, b) => {
      const aStart = a.line.start;
      const bStart = b.line.start;
      return aStart.compareTo(bStart);
    });
}

function unique(selections: ISelectionData[]) {
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

function sortTexts(selections: ISelectionData[]) {
  return selections
    .slice() // clone
    .sort((a, b) => compare(a.comparison, b.comparison))
    .map((selection) => selection.lineText);
}

function compare(a: Chunk[], b: Chunk[]) {
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

type IMorph = (s: string) => string;

interface ISelectionData {
  comparison: Chunk[];
  line: vscode.Range;
  lineText: string;
}
