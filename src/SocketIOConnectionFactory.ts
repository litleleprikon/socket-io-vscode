import { connect } from 'socket.io-client';
import { parse, Url } from 'url';
import { SocketIOEventsCollector, IEvent, ErrorHandler, DisconnectHandler } from './SocketIOEventsCollector';
import { Disposable } from 'vscode';

import io = require('socket.io-client');

/**
 * Type of connect function
 */
// type Connect = (uri: string, opts?: SocketIOClient.ConnectOpts) => SocketIOClient.Socket;
type Connect = io.connect;

export type EventCallback = (connection: string, data: any) => Promise<void>;
/**
 * Safe binding around socket.io socket
 */
export class SocketIOConnection implements Disposable {
    private socket: io.Socket;
    private eventCallback: EventCallback;

    constructor(socket: io.Socket, eventCallback: EventCallback) {
        this.socket = socket;
        this.eventCallback = eventCallback;
    }

    public isDisposed() {
        return this.socket === null;
    }

    public emit(event: string, data: any) {
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
        if (this.socket !== null) {
            this.disconnect();
            this.socket = null;
        }
    }
}

/**
 * Class to create connections
 */
export class SocketIOConnectionFactory {

    public static checkURLValid(url: string) {
        const parsed = parse(url);
        if (parsed.host && parsed.path && parsed.protocol) { // TODO think about more complex check
            return true;
        }
        return false;
    }

    private connections: { [uri: string]: SocketIOConnection };
    private readonly connectFn: io.connect;
    private eventsCollector: SocketIOEventsCollector;
    private CONNECTION_TIMEOUT: number = 10;

    constructor(connectFn: io.connect, eventsCollector: SocketIOEventsCollector) {
        this.connections = {};
        this.connectFn = connectFn;
        this.eventsCollector = eventsCollector;
    }

    public async getConnection(url: string, timeout: number = this.CONNECTION_TIMEOUT): Promise<SocketIOConnection> {
        if (!SocketIOConnectionFactory.checkURLValid(url)) {
            throw new URIError('Invalid URL. URL\'s must be like http://localhost:3000');
        }
        if (this.connections[url] === undefined) {
            this.connections[url] = await this.createConnection(url, timeout);
        }
        return this.connections[url];
    }

    public createConnection(url: string, timeout: number): Promise<any> {
        const _self = this;

        const makeConnection: Promise<any> = new Promise((resolve, reject) => {
            const socket = _self.connectFn(url, { timeout });
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
                    _self.eventsCollector.errored(url, error);
                })
                .on('disconnect', () => {
                    _self.eventsCollector.disconnected(url);
                    delete _self.connections[url];
                })
                .on('connect_timeout', (timeout: number) => {
                    socket.close();
                    reject(new Error('Connection timeout'));
                })
                .on('connect_error', (error: Error) => {
                    socket.close();
                    reject(error);
                });
        });
        return makeConnection;
    }
}
