import * as vscode from 'vscode';

import { createFileBasedTestSuite } from '../file-based';

createFileBasedTestSuite('basic', () => vscode.commands.executeCommand('sort-lines-by-selection.sortLinesBySelection'));
