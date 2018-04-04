'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import VSCommunicationLayer from './VSCommunicationLayer';
import SocketIOEventsTreeProvider from './SocketIOEventsTreeProvider';
import SocketIOEventContentProvider from './SocketIOEventContentProvider';
import { commands, Disposable, window, workspace, ExtensionContext } from 'vscode';
import { SocketIOEventsCollector } from './SocketIOEventsCollector';
import { SocketIOConnectionFactory } from './SocketIOConnectionFactory';
import {connect} from 'socket.io-client';

// this method is called when your extension is activated
// your extension is activated the very first time the commands.registerCommand( is executed
export function activate(context: ExtensionContext) {

    function registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        const registeredCommand: Disposable = commands.registerCommand(command, callback);
        context.subscriptions.push(registeredCommand);
        return registeredCommand;
    }

    const collector: SocketIOEventsCollector = new SocketIOEventsCollector();
    const treeProvider = new SocketIOEventsTreeProvider();
    const dataContentProvider = new SocketIOEventContentProvider(collector);
    const connectionFactory = new SocketIOConnectionFactory(connect, collector);
    const ui = new VSCommunicationLayer(connectionFactory);

    collector.onDisconnect((connection: string) => {
        ui.onDisconnect(connection);
    });

    collector.onError((connection: string, error: Error) => {
        ui.onError(connection, error);
    });

    const providerRegistrations = Disposable.from(
        window.registerTreeDataProvider('socket-io-events', treeProvider),
        workspace.registerTextDocumentContentProvider(SocketIOEventContentProvider.scheme, dataContentProvider)
    );

        // async openEmitedEventsByName (event: SocketIOEvent) {
    //     var doc = vscode.window.activeTextEditor.document;
    //     let uri = vscode.Uri.parse(`${SocketIOEventDataContentProvider.scheme}://./socket-io-event.json`)
    //     // var untitledFile = doc.uri.with({
    //     //     scheme: SocketIOEventDataContentProvider.scheme,
    //     //     path: './socket-io-event.json'
    //     // });
    //     vscode.workspace.openTextDocument(uri);
    //     // await vscode.window.showInformationMessage(`Opened events: ${event.name}`)
    // }
    // registerCommand('extension.openEmitedEventsByName', async (name) => {
    //      await integration.openEmitedEventsByName(name) });
    registerCommand('extension.connect', async () => { await ui.connectCalled(); });
    registerCommand('extension.emit', async () => { await ui.emitCalled(); });
    registerCommand('extension.on', async () => { await ui.onCalled(); });
    registerCommand('extension.disconnect', async () => { await ui.disconnectCalled(); });
}

async function disconnect() {

}

// this method is called when your extension is deactivated
export function deactivate() {
}
