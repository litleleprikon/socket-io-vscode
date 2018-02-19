'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import VSIntegrationLayer from './VSIntegrationLayer'
import SocketIOEventsTreeProvider from './SocketIOEventsTreeProvider';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "socket-io-vscode" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    let treeProvider = new SocketIOEventsTreeProvider();
    let integration: VSIntegrationLayer = new VSIntegrationLayer(treeProvider);
    vscode.window.registerTreeDataProvider('socket-io-events', treeProvider);
    vscode.commands.registerCommand('extension.openEmitedEventsByName', async (name) => {await integration.openEmitedEventsByName(name)});
    vscode.commands.registerCommand('extension.connect', async () => {await integration.connectCalled()});
    vscode.commands.registerCommand('extension.emit', async () => {await integration.emitCalled()});
    vscode.commands.registerCommand('extension.on', async () => {await integration.onCalled()});
    vscode.commands.registerCommand('extension.disconnect', async () => {await integration.disconnectCalled()});
}

// this method is called when your extension is deactivated
export function deactivate() {
}