import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

export function createFileBasedTestSuite(suiteName: string, f: () => Thenable<void>): void {
  suite(suiteName, () => {
    createFileBasedTests(suiteName, f);
  });
}

export function createFileBasedTests(suiteName: string, f: () => Thenable<void>): void {
  const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;

  for (const filename of fs.readdirSync(path.join(workspacePath, suiteName))) {
    if (filename.includes('.expected')) continue;

    const absoluteFilename = path.join(workspacePath, suiteName, filename);
    if (fs.statSync(absoluteFilename).isFile()) {
      const extname = path.extname(filename);
      const basename = filename.substring(0, filename.length - extname.length);
      test(basename, () => runFileBasedTest(workspacePath, suiteName, basename, extname, f));
    }
  }
}

async function runFileBasedTest(
  workspacePath: string,
  suiteName: string,
  basename: string,
  extname: string,
  f: () => Thenable<void>
): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');

  let actual: string;
  {
    const filepath = path.join(workspacePath, suiteName, `${basename}${extname}`);
    const doc = await vscode.workspace.openTextDocument(filepath);
    const editor = await vscode.window.showTextDocument(doc);
    selectDesignatedRanges(editor);
    await f();
    actual = doc.getText();
  }

  let expected: string;
  {
    const filepath = path.join(workspacePath, suiteName, `${basename}.expected${extname}`);
    const doc = await vscode.workspace.openTextDocument(filepath);
    expected = doc.getText();
  }

  assert.strictEqual(actual, expected);
}

/**
 * Select ranges designated with [...]
 */
function selectDesignatedRanges(editor: vscode.TextEditor): void {
  const selections: vscode.Selection[] = [];

  const it = documentLines(editor.document)[Symbol.iterator]();
  let line: vscode.TextLine | undefined;
  let lastPosition: number = 0;
  function next(): void {
    const { value, done } = it.next();
    line = (!done && value) || undefined;
    lastPosition = 0;
  }

  next();

  while (true) {
    while (line && (lastPosition = line.text.indexOf('[', lastPosition)) < 0) next();
    if (!line) break;

    lastPosition += 1;
    const startPosition = new vscode.Position(line.lineNumber, lastPosition);

    while (line && (lastPosition = line.text.indexOf(']', lastPosition)) < 0) next();
    if (!line) break;

    const endPosition = new vscode.Position(line.lineNumber, lastPosition);
    lastPosition += 1;

    selections.push(new vscode.Selection(startPosition, endPosition));
  }

  editor.selections = selections;
}

function* documentLines(doc: vscode.TextDocument) {
  for (let lineno = 0; lineno < doc.lineCount; ++lineno) yield doc.lineAt(lineno);
}
