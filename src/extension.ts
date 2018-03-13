'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import VSIntegrationLayer from './VSIntegrationLayer'
import SocketIOEventsTreeProvider from './SocketIOEventsTreeProvider';
import SocketIOEventDataContentProvider from './SocketIOEventDataContentProvider';
import { commands, Disposable, window, workspace } from 'vscode';


// this method is called when your extension is activated
// your extension is activated the very first time the commands.registerCommand( is executed
export function activate(context: vscode.ExtensionContext) {

    function registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        let registeredCommand: Disposable = commands.registerCommand(command, callback);
        context.subscriptions.push(registeredCommand);
        return registeredCommand;
    }

    let treeProvider = new SocketIOEventsTreeProvider();
    let dataContentProvider = new SocketIOEventDataContentProvider();
    let integration: VSIntegrationLayer = new VSIntegrationLayer(treeProvider);

    const providerRegistrations = Disposable.from(
        window.registerTreeDataProvider('socket-io-events', treeProvider),
        workspace.registerTextDocumentContentProvider(SocketIOEventDataContentProvider.scheme, dataContentProvider)
    );
    registerCommand('extension.openEmitedEventsByName', async (name) => { await integration.openEmitedEventsByName(name) });
    registerCommand('extension.connect', async () => { await integration.connectCalled() });
    registerCommand('extension.emit', async () => { await integration.emitCalled() });
    registerCommand('extension.on', async () => { await integration.onCalled() });
    registerCommand('extension.disconnect', async () => { await integration.disconnectCalled() });
}

// this method is called when your extension is deactivated
export function deactivate() {
}
