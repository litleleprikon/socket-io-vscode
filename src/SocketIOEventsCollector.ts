import { connect } from 'socket.io-client';
export interface IEvent {
    name: string;
    datetime: Date;
    data: any;
    connection: string;
}

interface IErrors {
    NoEvent: Error;
}

export const Errors: IErrors = {
    NoEvent: new Error('Such event not found')
};

export type SubscriptionHandler = (connection: string, event: IEvent) => Promise<void> | void;
export type ErrorHandler = (connection: string, error: Error) => Promise<void> | void;
export type DisconnectHandler = (connection: string) => Promise<void> | void;

export class SocketIOEventsCollector {
    private events: { [connection: string]: { [name: string]: IEvent[] } };
    private subscriptions: { [connection: string]: { [name: string]: SubscriptionHandler[] } };
    private errorsSubscriptions: ErrorHandler[];
    private disconnectSubscriptions: DisconnectHandler[];
    private subscriptionsToAll: SubscriptionHandler[];

    constructor() {
        this.events = {};
        this.subscriptions = {};
        this.errorsSubscriptions = [];
        this.disconnectSubscriptions = [];
        this.subscriptionsToAll = [];
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
        return this.events[connection] !== undefined;
    }

    public addConnection(connection: string) {
        if (this.containConnection(connection)) {
            return;
        }
        this.events[connection] = {};
    }

    public containEvent(connection: string, event: string | IEvent) {
        event = this.eventName(event);
        return this.events[connection] !== undefined && this.events[connection][event as string] !== undefined;
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
        return this.events[connection][event as string][index];

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
        if (this.events[connection][event.name] === undefined) {
            this.events[connection][event.name] = [];
        }
        this.events[connection][event.name].push(event);
        this.callSubscriptions(connection, event);
    }

    public subscribeToAll(handler: SubscriptionHandler) {
        this.subscriptionsToAll.push(handler);
    }

    public subscribe(connection: string, event: IEvent | string, handler: SubscriptionHandler) {
        const eventName: string = (event as IEvent).name || event as string;
        if (!this.checkSubscriptionExists(connection, event)) {
            this.initSubscriptions(connection, eventName);
        }
        this.subscriptions[connection][eventName].push(handler);
    }

    private callSubscriptions(connection: string, event: IEvent) {
        for (const handler of this.subscriptionsToAll) {
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
