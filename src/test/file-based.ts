import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

export function createFileBasedTestSuite(suiteName: string, f: () => Thenable<void>) {
  suite(suiteName, () => {
    createFileBasedTests(suiteName, f);
  });
}

export function createFileBasedTests(suiteName: string, f: () => Thenable<void>) {
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
  f: () => Thenable<void>,
): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');

  let actual: string;
  {
    const filepath = path.join(workspacePath, suiteName, `${basename}${extname}`);
    const doc = await vscode.workspace.openTextDocument(filepath);
    const editor = await vscode.window.showTextDocument(doc);
    await selectDesignatedRanges(editor);
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

const RE_BRACKETS = /\[.*?\]/g;

/**
 * Select ranges designated with [...]
 */
async function selectDesignatedRanges(editor: vscode.TextEditor): Promise<void> {
  const doc = editor.document;
  let m: RegExpExecArray | null;
  const selections: vscode.Selection[] = [];

  for (let lineno = 0; lineno < doc.lineCount; ++lineno) {
    const line = doc.lineAt(lineno);
    while ((m = RE_BRACKETS.exec(line.text))) {
      const start = m.index + 1;
      const end = m.index + m[0].length - 1;
      selections.push(new vscode.Selection(lineno, start, lineno, end));
    }
  }

  editor.selections = selections;
}
