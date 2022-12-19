import * as vscode from 'vscode';

import { createFileBasedTestSuite } from '../file-based';

createFileBasedTestSuite('natural-sort', () =>
  vscode.commands.executeCommand('sort-lines-by-selection.sortLinesBySelection', {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    natural_sort: true
  })
);
