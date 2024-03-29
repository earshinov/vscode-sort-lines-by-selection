/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

import { getMorph, run } from './logic';

interface Args {
  morph?: string;
  case_sensitive?: boolean;
  natural_sort?: boolean;
}

export function activate(this: void, context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'sort-lines-by-selection.sortLinesBySelection',
      (editor, edit, args: Args) => {
        trapExceptions(() => {
          const { morph = null, case_sensitive = false, natural_sort = false } = args || {};
          return run(editor, edit, getMorph(morph, case_sensitive), natural_sort);
        });
      }
    ),
    vscode.commands.registerTextEditorCommand(
      'sort-lines-by-selection.sortLinesBySelectionNatural',
      (editor, edit, args) => {
        trapExceptions(() =>
          vscode.commands.executeCommand('sort-lines-by-selection.sortLinesBySelection', {
            natural_sort: true
          })
        );
      }
    )
  );
}

function trapExceptions(fn: () => void | Thenable<void>): void {
  try {
    const ret = fn();
    if (typeof ret === 'object' && 'then' in ret)
      ret.then(undefined, (err) => {
        console.error(err);
      });
  } catch (e) {
    console.error(e);
  }
}
