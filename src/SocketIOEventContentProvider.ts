import * as fs from 'fs';
import { SocketIOEventsCollector, IEvent } from './SocketIOEventsCollector';
import { TextDocumentContentProvider, Uri, EventEmitter, Event, workspace } from 'vscode';

interface IErrors {
    InvalidURI: Error;
}

export const Errors: IErrors = {
    InvalidURI: new Error('URI, you passed is invalid')
};

export class SocketIOEventContentProvider implements TextDocumentContentProvider {

    public static readonly scheme = 'socketio-event';
    public static readonly path = `socket-io-event.json`;
    private static sInstance: SocketIOEventContentProvider = null;
    private _onDidChange = new EventEmitter<Uri>();
    private eventsCollector: SocketIOEventsCollector;

    constructor(eventsCollector: SocketIOEventsCollector) {
        this.eventsCollector = eventsCollector;

        if (SocketIOEventContentProvider.sInstance) {
            SocketIOEventContentProvider.sInstance.dispose();
        }
        SocketIOEventContentProvider.sInstance = this;
    }

    static get instance() {
        return SocketIOEventContentProvider.sInstance;
    }

    public static parseURI(uri: Uri): {
        connection: string,
        event: string,
        index: number
    } {
        const queryString: string = uri.query;
        const tmp = {};
        queryString.split('&').map((item) => {
            const [key, value] = item.split('=').map(decodeURIComponent);
            tmp[key] = value;
            if (key === 'index') {
                tmp[key] = parseInt(value, 10);
            }
        });
        if (tmp['connection'] === undefined || !(typeof tmp['connection'] === 'string')
            || tmp['event'] === undefined || !(typeof tmp['event'] === 'string')
            || tmp['index'] === undefined || !(Number.isInteger(tmp['index']))) {
            throw Errors.InvalidURI;
        }
        return { connection: tmp['connection'], event: tmp['event'], index: tmp['index'] };
    }

    public static createURI(connection: string, event: IEvent | string, index: number): Uri {
        const eventName: string = (event as IEvent).name || event as string;
        const params = { connection, event: eventName, index };
        const queryString = Object.keys(params).map((key) => {
            return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
        }).join('&');
        return Uri.file(this.path).with({
            scheme: this.scheme,
            query: queryString
        });
    }

    public dispose() {
        this._onDidChange.dispose();
        if (SocketIOEventContentProvider.sInstance) {
            SocketIOEventContentProvider.sInstance = null;
        }
    }

    public provideTextDocumentContent(uri: Uri): string | string {
        const { connection, event, index } = SocketIOEventContentProvider.parseURI(uri);
        const eventData = this.eventsCollector.getEvent(connection, event, index);
        return JSON.stringify(eventData.data);
    }

    // get onDidChange(): Event<Uri> {
    //     return this._onDidChange.event;
    // }

    // public update(uri: Uri) {
    //     this._onDidChange.fire(uri);
    // }
}

export default SocketIOEventContentProvider;
