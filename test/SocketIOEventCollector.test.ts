import {
    SocketIOEventsCollector as Collector, IEvent, SubscriptionHandler,
    ErrorHandler, DisconnectHandler, Errors as CollectorErrors
} from '../src/SocketIOEventsCollector';
import { assert, expect } from 'chai';

suite('SocketIOEventsCollector Tests', () => {
    test('Add connection', async () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        collector.addConnection(connectionName);
        collector.addConnection(connectionName);
        assert.isTrue(collector.containConnection(connectionName), 'Connection did not added');
    });

    test('Iterate connections', async () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const anotherConnectionName: string = 'Another Test connection';
        collector.addConnection(connectionName);
        collector.addConnection(anotherConnectionName);
        let counter = 0;
        for (const connection of collector.connections()) {
            counter++;
        }
        assert.strictEqual(counter, 2);
    });

    test('Add event', async () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        collector.addEvent(connectionName, event);
        assert.isTrue(collector.containEvent(connectionName, event), 'Event did not added');
    });

    test('Iterate event collections', async () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        let counter = 0;
        collector.addEvent(connectionName, event);
        for (const colleciton of collector.eventsCollections(connectionName)) {
            counter++;
        }
        assert.strictEqual(counter, 1);
        expect(() => {
            for (const tmp of collector.eventsCollections('nonexistent collection')) {
                counter++;
            }
        }).throw(CollectorErrors.NoConnection);
    });

    test('Iterate events', async () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        let counter = 0;
        collector.addEvent(connectionName, event);
        for (const colleciton of collector.events(connectionName, event.name)) {
            counter++;
        }
        assert.strictEqual(counter, 1);
        expect(() => {
            for (const tmp of collector.events('nonexistent collection', 'nonexistent event')) {
                counter++;
            }
        }).throw(CollectorErrors.NoEvent);
    });

    test('Add subscription', async () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };
        let handlerCalled: boolean = false;
        const handler: SubscriptionHandler = (connection: string, event: IEvent) => {
            handlerCalled = true;
        };

        collector.subscribe(connectionName, event, handler);
        assert.isTrue(collector.checkSubscriptionExists(connectionName, event), 'Subscription did not added');

        collector.addEvent(connectionName, event);
        assert.isTrue(handlerCalled, 'Subscription did not called');
    });

    test('Add subscription to all', async () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };
        let handlerCalled: boolean = false;
        const handler: SubscriptionHandler = (connection: string, event: IEvent) => {
            handlerCalled = true;
        };

        collector.subscribeToAll(handler);
        collector.addEvent(connectionName, event);
        assert.isTrue(handlerCalled, 'Subscription did not called');
    });

    test('Add error subscription', async () => {
        const collector: Collector = new Collector();
        let handlerCalled: boolean = false;
        const handler: ErrorHandler = (connection: string, error: Error) => {
            handlerCalled = true;
        };
        collector.onError(handler);

        collector.errored('Hello', new Error());
        assert.isTrue(handlerCalled, 'Subscription did not called');
    });

    test('Add disconnect subscription', async () => {
        const collector: Collector = new Collector();
        let handlerCalled: boolean = false;
        const handler: DisconnectHandler = (connection: string) => {
            handlerCalled = true;
        };
        collector.onDisconnect(handler);

        collector.disconnected('Hello');
        assert.isTrue(handlerCalled, 'Subscription did not called');
    });

    test('Getting event', () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };
        let handlerCalled: boolean = false;
        const handler: SubscriptionHandler = (connection: string, event: IEvent) => {
            handlerCalled = true;
        };

        collector.addEvent(connectionName, event);
        assert.strictEqual(collector.getEvent(connectionName, event, 0), event);
    });

    test('Getting nonexistent event', () => {
        const collector: Collector = new Collector();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };
        let handlerCalled: boolean = false;
        const handler: SubscriptionHandler = (connection: string, event: IEvent) => {
            handlerCalled = true;
        };

        collector.addEvent(connectionName, event);
        expect(() => { collector.getEvent(connectionName, 'event', 1); }).throw(CollectorErrors.NoEvent);
    });
});
