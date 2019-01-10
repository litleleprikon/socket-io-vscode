import { Disposable } from 'vscode';
export interface IEvent {
    name: string;
    datetime: Date;
    data: any;
    connection: string;
}

interface IErrors {
    NoEvent: Error;
    NoConnection: Error;
}

export const Errors: IErrors = {
    NoEvent: new Error('Such event not found'),
    NoConnection: new Error('Connection found')
};

export type SubscriptionHandler = (connection: string, event: IEvent) => Promise<void> | void;
export type ErrorHandler = (connection: string, error: Error) => Promise<void> | void;
export type DisconnectHandler = (connection: string) => Promise<void> | void;

export class SocketIOEventsCollector implements Disposable {
    private eventsStorage: { [connection: string]: { [name: string]: IEvent[] } };
    private subscriptions: { [connection: string]: { [name: string]: SubscriptionHandler[] } };
    private errorsSubscriptions: ErrorHandler[];
    private disconnectSubscriptions: DisconnectHandler[];
    private broadcastSubscriptions: SubscriptionHandler[];

    constructor() {
        this.eventsStorage = {};
        this.subscriptions = {};
        this.errorsSubscriptions = [];
        this.disconnectSubscriptions = [];
        this.broadcastSubscriptions = [];
    }

    public dispose() {
        this.eventsStorage = null;
        this.subscriptions = null;
        this.errorsSubscriptions = null;
        this.disconnectSubscriptions = null;
        this.broadcastSubscriptions = null;
    }

    public errored(connection: string, error: Error) {
        for (const handler of this.errorsSubscriptions) {
            handler(connection, error);
        }
    }

    public disconnected(connection: string) {
        for (const handler of this.disconnectSubscriptions) {
            handler(connection);
        }
    }

    public onError(handler: ErrorHandler) {
        this.errorsSubscriptions.push(handler);
    }

    public onDisconnect(handler: DisconnectHandler) {
        this.disconnectSubscriptions.push(handler);
    }

    public containConnection(connection: string) {
        return this.eventsStorage[connection] !== undefined;
    }

    public addConnection(connection: string) {
        if (this.containConnection(connection)) {
            return;
        }
        this.eventsStorage[connection] = {};
    }

    public *connections(): IterableIterator<string> {
        for (const connection in this.eventsStorage) {
            if (this.eventsStorage.hasOwnProperty(connection)) {
                yield connection;
            }
        }
    }

    public *eventsCollections(connection: string): IterableIterator<string> {
        if (!this.containConnection(connection)) {
            throw Errors.NoConnection;
        }
        for (const eventCollection in this.eventsStorage[connection]) {
            if (this.eventsStorage[connection].hasOwnProperty(eventCollection)) {
                yield eventCollection;
            }
        }
    }

    public *events(connection: string, eventName: string): IterableIterator<IEvent> {
        if (!this.containEvent(connection, eventName)) {
            throw Errors.NoEvent;
        }
        for (const event of this.eventsStorage[connection][eventName]) {
            yield event;
        }

    }

    public containEvent(connection: string, event: string | IEvent) {
        event = this.eventName(event);
        return this.eventsStorage[connection] !== undefined
            && this.eventsStorage[connection][event as string] !== undefined;
    }

    private eventName(event: IEvent | string) {
        if ((event as IEvent).name) {
            event = (event as IEvent).name;
        }
        return event;
    }

    public getEvent(connection: string, event: string | IEvent, index: number): IEvent {
        event = this.eventName(event);
        if (!this.containEvent(connection, event)) {
            throw Errors.NoEvent;
        }
        return this.eventsStorage[connection][event as string][index];

    }

    public checkSubscriptionExists(connection: string, event: string | IEvent) {
        if ((event as IEvent).name) {
            event = (event as IEvent).name;
        }
        return this.subscriptions[connection] !== undefined
            && this.subscriptions[connection][event as string] !== undefined;
    }

    public addEvent(connection: string, event: IEvent) {
        this.addConnection(connection);
        if (this.eventsStorage[connection][event.name] === undefined) {
            this.eventsStorage[connection][event.name] = [];
        }
        this.eventsStorage[connection][event.name].push(event);
        this.callSubscriptions(connection, event);
    }

    public subscribeToAll(handler: SubscriptionHandler) {
        this.broadcastSubscriptions.push(handler);
    }

    public subscribe(connection: string, event: IEvent | string, handler: SubscriptionHandler) {
        const eventName: string = (event as IEvent).name || event as string;
        if (!this.checkSubscriptionExists(connection, event)) {
            this.initSubscriptions(connection, eventName);
        }
        this.subscriptions[connection][eventName].push(handler);
    }

    private callSubscriptions(connection: string, event: IEvent) {
        for (const handler of this.broadcastSubscriptions) {
            handler(connection, event);
        }
        if (!this.checkSubscriptionExists(connection, event)) {
            return;
        }
        for (const handler of this.subscriptions[connection][event.name]) {
            handler(connection, event);
        }
    }

    private initSubscriptions(connection: string, event: string) {
        if (this.subscriptions[connection] === undefined) {
            this.subscriptions[connection] = {};
        }
        if (this.subscriptions[connection][event] === undefined) {
            this.subscriptions[connection][event] = [];
        }
    }
}
