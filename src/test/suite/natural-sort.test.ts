import * as vscode from 'vscode';

import { createFileBasedTestSuite } from '../file-based';

createFileBasedTestSuite('natural-sort', () =>
  vscode.commands.executeCommand('sort-lines-by-selection.sortLinesBySelection', { natural_sort: true }),
);
