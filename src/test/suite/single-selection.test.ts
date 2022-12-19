import * as vscode from 'vscode';

import { createFileBasedTestSuite } from '../file-based';

createFileBasedTestSuite('single-selection', () =>
  vscode.commands.executeCommand('sort-lines-by-selection.sortLinesBySelection')
);
