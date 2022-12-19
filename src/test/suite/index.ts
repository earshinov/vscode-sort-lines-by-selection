import * as path from 'path';
import * as glob from 'glob';

import * as Mocha from 'mocha';

function runTests(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true
    //timeout: 30000,  // default: 2000 (ms)
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    });
  });
}

/**
 * Setup coverage
 *
 * Some pointers:
 * - https://github.com/microsoft/vscode-docs/issues/1096
 * - https://github.com/microsoft/vscode-js-debug/blob/main/src/test/testRunner.ts
 * - https://frenya.net/blog/vscode-extension-code-coverage-nyc and
 *   https://github.com/frenya/vscode-recall/blob/master/src/test/suite/index.ts
 * - https://gitlab.com/gitlab-org/gitlab-vscode-extension/-/issues/224
 */
async function withCoverage(f: () => Thenable<void>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NYC = require('nyc');
  const nyc = new NYC({
    cwd: path.resolve(__dirname, '../../../'),
    exclude: ['**/test/**', '.vscode-test/**'],
    reporter: ['text-summary', 'html'],
    all: true,
    instrument: true,
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true
  });

  console.log('nyc: Preparing for test run');
  await nyc.reset();

  console.log('nyc: Patching require() to instrument files on the fly');
  await nyc.wrap();

  try {
    return await f();
  } finally {
    console.log('nyc: Writing coverage file');
    await nyc.writeCoverageFile();

    console.log('nyc: Writing report files');
    await nyc.report();
  }
}

export function run(): Promise<void> {
  return withCoverage(runTests);
}
