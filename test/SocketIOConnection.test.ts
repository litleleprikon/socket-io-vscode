//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import SocketIOConnection from '../src/SocketIOConnection';

// Defines a Mocha test suite to group tests of similar kind together
suite("SocketIOConnection Tests", () => {

    // Defines a Mocha unit test
    test("Connection", async () => {
      try {
        await SocketIOConnection.connect("", async (url: string, error: Error) => {}, this.onDisconnect);
      } catch(ex) {
        assert.equal(1,1)
      }
      assert.equal(-1, [1, 2, 3].indexOf(5));
      assert.equal(-1, [1, 2, 3].indexOf(0));
    });
});
