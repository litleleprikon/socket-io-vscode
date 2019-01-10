import { parse } from 'url';
import { SocketIOEventsCollector } from './SocketIOEventsCollector';
import { Disposable } from 'vscode';


interface IErrors {
    URLError: Error;
    ConnectTimeout: Error;
}

export const Errors: IErrors = {
    URLError: new Error('Invalid URL. URL must have protocol, host, optionally port and path'),
    ConnectTimeout: new Error('Connection timeout')
};

export interface ISocket {
    on: (event: string, callback: (data?: any) => void) => ISocket;
    emit: (event: string, data?: any) => ISocket;
    disconnect: () => ISocket;
    close: () => ISocket;
}
export type Connect = (url: string, opts?: object) => ISocket;
export type EventCallback = (connection: string, data: any) => Promise<void>;

/**
 * Safe binding around socket.io socket
 */
export class SocketIOConnection implements Disposable {
    private socket: ISocket;
    private eventCallback: EventCallback;

    constructor(socket: ISocket, eventCallback: EventCallback) {
        this.socket = socket;
        this.eventCallback = eventCallback;
    }

    public isDisposed() {
        return this.socket === null;
    }

    public emit(event: string, data: null | string | object) {
        this.socket.emit(event, data);
    }

    public on(event: string) {
        this.socket.on(event, (data) => {
            this.eventCallback(event, data).then().catch(console.error);
        });
    }

    public disconnect() {
        this.socket.disconnect();
    }

    public dispose() {
        if (!this.isDisposed()) {
            this.disconnect();
            this.socket = null;
        }
    }
}

/**
 * Class to create connections
 */
export class SocketIOConnectionFactory implements Disposable {

    public static checkURLValid(url: string) {
        const parsed = parse(url);
        if (parsed.host && parsed.path && parsed.protocol) { // TODO think about more complex check
            return true;
        }
        return false;
    }

    private connections: { [uri: string]: SocketIOConnection };
    private readonly connectFn: Connect;
    private eventsCollector: SocketIOEventsCollector;
    private CONNECTION_TIMEOUT: number = 10000;

    constructor(connectFn: Connect, eventsCollector: SocketIOEventsCollector) {
        this.connections = {};
        this.connectFn = connectFn;
        this.eventsCollector = eventsCollector;
    }

    public async getConnection(url: string, timeout: number = this.CONNECTION_TIMEOUT): Promise<SocketIOConnection> {
        if (!SocketIOConnectionFactory.checkURLValid(url)) {
            throw Errors.URLError;
        }
        if (this.connections[url] === undefined) {
            this.connections[url] = await this.createConnection(url, timeout);
        }
        return this.connections[url];
    }

    private createConnection(url: string, timeout: number): Promise<any> {
        const _self = this;

        const makeConnection: Promise<any> = new Promise((resolve, reject) => {
            const socket: ISocket = _self.connectFn(url, { timeout });
            socket
                .on('connect', () => {
                    resolve(new SocketIOConnection(socket, async (event: string, data: any) => {
                        _self.eventsCollector.addEvent(url, {
                            name: event,
                            data,
                            datetime: new Date(),
                            connection: url
                        });
                    }));
                })
                .on('error', (error) => {
                    _self.eventsCollector.errored(url, error as Error);
                })
                .on('disconnect', () => {
                    _self.eventsCollector.disconnected(url);
                    delete _self.connections[url];
                })
                .on('connect_timeout', () => {
                    socket.close();
                    reject(Errors.ConnectTimeout);
                })
                .on('connect_error', (error: Error) => {
                    socket.close();
                    reject(error);
                });
        });
        return makeConnection;
    }

    public dispose() {
        for (const connection in this.connections) {
            if (this.connections.hasOwnProperty(connection)) {
                this.connections[connection].dispose();
            }
        }
        this.eventsCollector.dispose();
        this.connections = null;
        this.eventsCollector = null;
    }
}
