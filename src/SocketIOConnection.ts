"use strict";

import {connect} from 'socket.io-client';
import { parse, Url } from 'url';

interface Event {
    name: string;
    datetime: Date;
    data: any;
};

export {Event}

/**
 * Middleware between the Socket.io and logic of an application.
 * Handles connection to certain socket.io endpoint and stores events.
*/
export default class SocketIOConnection {
    private static CONNECTION_TIMEOUT: number = 10000;
    private socket;
    private events: {[eventName: string]: Event[]}


    private constructor(socket) {
        this.socket = socket;
        this.events = {};
    }

    static async connect(
            url: string,
            errorHandler: (url: string, error: Error) => Promise<void>,
            disconnectHandler: (url: string) => Promise<void>): Promise<SocketIOConnection> {
        if (!SocketIOConnection.checkURLvalid(url)) {
            throw new URIError("Connect method allow only valid URL's like http://localhost:3000")
        }
        let makeConnection: Promise<any> = new Promise((resolve, reject) => {
            let connection = connect(url, {'timeout': this.CONNECTION_TIMEOUT});
            connection
                .on('connect', () => {
                    resolve(connection);
                })
                .on('error', (error) => {
                    errorHandler(url, error).then();
                })
                .on('disconnect', () => {
                    disconnectHandler(url).then();
                })
                .on('connect_timeout', (timeout: number) => {
                    connection.close();
                    reject(new Error("Connection timeout"));
                })
                .on('connect_error', (error: Error) => {
                    connection.close();
                    reject(error);
                })
        });
        let socket = await makeConnection;
        return new SocketIOConnection(socket);
    }

    getEvents(): {[eventName: string]: Event[]} {
        return this.events;
    }

    emit(event: string, data: any) {
        return this.socket.emit(event, data);
    }

    on(event: string, callback: (event: string) => void) {
        this.events[event] = []
        this.socket.on(event, (data) => {
            this.events[event].push({
                name: event,
                datetime: new Date(),
                data: data
            });
            callback(event);
        });
    }

    disconnect() {
        this.socket.close();
    }

    private static checkURLvalid(url: string) {
        let parsed = parse(url);
        if(parsed.host && parsed.path && parsed.protocol) { // TODO think about more complex check
            return true;
        }
        return false;
    }
}

