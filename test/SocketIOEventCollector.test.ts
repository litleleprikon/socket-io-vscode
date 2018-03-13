import { SocketIOEventsCollector as Collector, IEvent, SubscriptionHandler } from '../src/SocketIOEventCollector';
import { assert, expect } from 'chai';

suite("SocketIOEventsCollector Tests", () => {
    test("Add connection", async () => {
        let collector: Collector = new Collector();
        let connectionName: string = "Test connection";
        collector.addConnection(connectionName);
        collector.addConnection(connectionName);
        assert.isTrue(collector.containConnection(connectionName), "Connection did not added")
    });

    test("Add event", async () => {
        let collector: Collector = new Collector();
        let connectionName: string = "Test connection";
        let event: IEvent = <IEvent>{
            name: "Test",
            datetime: new Date(),
            data: { test: "test" },
            connection: connectionName
        }

        collector.addEvent(connectionName, event);
        assert.isTrue(collector.containEvent(connectionName, event), "Event did not added")
    });

    test("Add subscription", async () => {
        let collector: Collector = new Collector();
        let connectionName: string = "Test connection";
        let event: IEvent = <IEvent>{
            name: "Test",
            datetime: new Date(),
            data: { test: "test" },
            connection: connectionName
        }
        let handlerCalled: boolean = false;
        let handler: SubscriptionHandler = (connection: string, event: IEvent) => {
            handlerCalled = true;
        }

        collector.subscribe(connectionName, event, handler);
        assert.isTrue(collector.checkSubscriptionExists(connectionName, event), "Subscription did not added")

        collector.addEvent(connectionName, event);
        assert.isTrue(handlerCalled, "Subscription did not called")
    });
});
