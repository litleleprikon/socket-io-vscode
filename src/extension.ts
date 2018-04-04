'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import VSCommunicationLayer from './VSCommunicationLayer';
import SocketIOEventsTreeProvider from './SocketIOEventsTreeProvider';
import SocketIOEventContentProvider from './SocketIOEventContentProvider';
import { commands, Disposable, window, workspace, ExtensionContext, Uri } from 'vscode';
import { SocketIOEventsCollector, IEvent } from './SocketIOEventsCollector';
import { SocketIOConnectionFactory } from './SocketIOConnectionFactory';
import { connect } from 'socket.io-client';

// this method is called when your extension is activated
// your extension is activated the very first time the commands.registerCommand( is executed
export function activate(context: ExtensionContext) {

    function registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        const registeredCommand: Disposable = commands.registerCommand(command, callback);
        context.subscriptions.push(registeredCommand);
        return registeredCommand;
    }

    const collector: SocketIOEventsCollector = new SocketIOEventsCollector();
    const treeProvider = new SocketIOEventsTreeProvider(collector);
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

    registerCommand('openEmittedEvent', async (event: IEvent, index: number) => {
        // const doc = window.activeTextEditor.document;
        const uri = SocketIOEventContentProvider.createURI(event.connection, event.name, index);
        const doc = await workspace.openTextDocument(uri);
        window.showTextDocument(doc);
    });
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
