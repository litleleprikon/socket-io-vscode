//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as myExtension from '../src/extension';
import { ExtensionContext, Memento } from 'vscode';
import { relative } from 'path';
import { TestSocket } from './SocketIOConnectionFactory.test';
import { ISocket } from '../src/SocketIOConnectionFactory';

class ContextMock implements ExtensionContext {
    public subscriptions: Array<{ dispose(): any }> = [];
    public workspaceState: Memento;
    public globalState: Memento;
    public extensionPath: string = '';
    public storagePath: string = '';
    public asAbsolutePath(path: string): string {
      return relative(global['rootPath'], path);
    }
  }

// Defines a Mocha test suite to group tests of similar kind together
suite('Extension Tests', () => {

    test('Extension works', () => {
        const context = new ContextMock();
        myExtension.start(context, (url: string, opts?: object): ISocket => {
            return new TestSocket();
        });
    });
});
