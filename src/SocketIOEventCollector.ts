import { connect } from 'socket.io-client';
export interface IEvent {
    name: string;
    datetime: Date;
    data: any;
    connection: String
};

export type SubscriptionHandler = (connection: string, event: IEvent) => Promise<void> | void;

export class SocketIOEventsCollector {
    private events: { [connection: string]: { [name: string]: IEvent[] } };
    private subscriptions: { [connection: string]: { [name: string]: SubscriptionHandler[] } }

    constructor() {
        this.events = {};
        this.subscriptions = {};
    }

    containConnection(connection: string) {
        return this.events[connection] !== undefined
    }

    addConnection(connection: string) {
        if (this.containConnection(connection)) {
            return;
        }
        this.events[connection] = {};
    }

    containEvent(connection: string, event: string | IEvent) {
        if ((<IEvent>event).name) {
            event = (<IEvent>event).name;
        }
        return this.events[connection] !== undefined && this.events[connection][<string>event] !== undefined;
    }

    checkSubscriptionExists(connection: string, event: string | IEvent) {
        if ((<IEvent>event).name) {
            event = (<IEvent>event).name;
        }
        return this.subscriptions[connection] !== undefined && this.subscriptions[connection][<string>event] !== undefined;
    }

    addEvent(connection: string, event: IEvent) {
        this.addConnection(connection);
        if (this.events[connection][event.name] === undefined) {
            this.events[connection][event.name] = [];
        }
        this.events[connection][event.name].push(event);
        this.callSubscriptions(connection, event);
    }

    private callSubscriptions(connection: string, event: IEvent) {
        if (!this.checkSubscriptionExists(connection, event)) {
            return;
        }
        for (let handler of this.subscriptions[connection][event.name]) {
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

    subscribe(connection: string, event: IEvent | string, handler: SubscriptionHandler) {
        let eventName: string = (<IEvent>event).name || <string>event
        if (!this.checkSubscriptionExists(connection, event)) {
            this.initSubscriptions(connection, eventName);
        }
        this.subscriptions[connection][eventName].push(handler);
    }
}
