import * as vscode from 'vscode';
import SocketIOConnection from './SocketIOConnection';
import {Event as SocketIOEvent} from './SocketIOConnection';
import SocketIOEventsTreeProvider from './SocketIOEventsTreeProvider';

export default class VSIntegrationLayer {

    private connection: SocketIOConnection;
    private treeProvider: SocketIOEventsTreeProvider;

    constructor(treeProvider: SocketIOEventsTreeProvider) {
        this.treeProvider = treeProvider;
    }

    async connectCalled() {
        let url: string = await vscode.window.showInputBox({prompt: "Please input URL to connect"});
        try {
            let connection: SocketIOConnection = await SocketIOConnection.connect(url, this.onError, this.onDisconnect);
            this.connection = connection;
            await vscode.window.showInformationMessage('Connected');
        }
        catch(ex) {
            await vscode.window.showErrorMessage(ex.toString());
        }
    }

    async openEmitedEventsByName (event: SocketIOEvent) {
        await vscode.window.showInformationMessage(`Opened events: ${event.name}`)
    }

    redrawEventsTree() {
        this.treeProvider.refresh();
    }

    async onError(url: string, error: Error) {
        await vscode.window.showErrorMessage(`on url ${url}. [${error.toString()}]`);
    }

    async onDisconnect(url: string) {
        await vscode.window.showWarningMessage(`Disconnected from ${url}`);
    }

    async onEmit(event) {
        this.treeProvider.setData(this.connection.getEvents())
        this.redrawEventsTree();
    }

    async emitCalled() {
        let event: string = await vscode.window.showInputBox({prompt: "Please type event name"});
        let data: string = await vscode.window.showInputBox({prompt: "Insert data in json to send"});
        let dataObj: any;
        if (data.length > 0) {
            dataObj = JSON.stringify(data);
        } else {
            dataObj = null;
        }
        this.connection.emit(event, data);
    }

    async onCalled() {
        if (this.connection === undefined) {
            await vscode.window.showErrorMessage('Connection is not established');
            return;
        }
        let event: string = await vscode.window.showInputBox({prompt: "Please type event name"});
        if (event.length == 0) {
            await vscode.window.showErrorMessage("You do not specified event name");
            return;
        }
        this.connection.on(event, (event) => {this.onEmit(event)});
    }

    async disconnectCalled() {}
}

