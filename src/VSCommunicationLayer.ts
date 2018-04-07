import SocketIOEventContentProvider from './SocketIOEventContentProvider';
import { SocketIOConnection, SocketIOConnectionFactory } from './SocketIOConnectionFactory';
import { SocketIOEventsCollector } from './SocketIOEventsCollector';
import { Disposable, window } from 'vscode';

/**
 * Class to handle all UI tasks: input, messages, etc.
 */
export default class VSCommunicationLayer implements Disposable {

    public dispose() {
        this.connection.dispose();
        this.connection = null;
    }

    private connection: SocketIOConnection;
    private connectionFactory: SocketIOConnectionFactory;

    constructor(connectionFactory: SocketIOConnectionFactory) {
        this.connectionFactory = connectionFactory;
    }

    public async connectCalled() {
        const url: string = await window.showInputBox({ prompt: 'Please input URL to connect' });
        try {
            const connection: SocketIOConnection = await this.connectionFactory.getConnection(url);
            this.connection = connection;
            await window.showInformationMessage('Connected');
        } catch (ex) {
            await window.showErrorMessage(ex.toString());
        }
    }

    public async onError(url: string, error: Error) {
        await window.showErrorMessage(`on url ${url}. [${error.toString()}]`);
    }

    public async onDisconnect(url: string) {
        await window.showWarningMessage(`Disconnected from ${url}`);
    }

    public async emitCalled() {
        const event: string = await window.showInputBox({ prompt: 'Please type event name' });
        const data: string = await window.showInputBox({ prompt: 'Insert data in json to send' });
        let dataObj: null | string | object;
        if (data.length > 0) {
            try {
                dataObj = JSON.parse(data);
            } catch (ex) {
                dataObj = data;
            }
        } else {
            dataObj = null;
        }
        this.connection.emit(event, dataObj);
    }

    public async onCalled() {
        if (this.connection === undefined) {
            await window.showErrorMessage('Connection is not established');
            return;
        }
        const event: string = await window.showInputBox({ prompt: 'Please type event name' });
        if (event.length === 0) {
            await window.showErrorMessage('You do not specified event name');
            return;
        }
        this.connection.on(event);
    }

    public async disconnectCalled() {
        if (this.connection === undefined) {
            await window.showErrorMessage('Connection is not established');
            return;
        }
    }

    public async checkConnectionExists() {
        this.connection.disconnect();
        this.connection.dispose();
        this.connection = null;
    }
}
