import { SocketIOEventsCollector, IEvent } from '../src/SocketIOEventsCollector';
import { mock } from 'sinon';
import { assert } from 'chai';
import { SocketIOEventsTreeProvider, SocketIOConnectionItem,
    SocketIOEventsCollectionItem,
    SocketIOEventsItem} from '../src/SocketIOEventsTreeProvider';

suite('SocketIOEventsTreeProvider tests', () => {
    function initialize(): {
        collector: SocketIOEventsCollector
    } {
        return {
            collector: new SocketIOEventsCollector()
        };
    }
    test('Initialization', () => {
        const { collector } = initialize();
        const treeProvider = new SocketIOEventsTreeProvider(collector);
    });

    test('Test events', () => {
        const { collector } = initialize();
        const treeProvider = new SocketIOEventsTreeProvider(collector);
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        collector.addEvent(connectionName, event);

    });

    test('Test dispose', () => {
        const { collector } = initialize();
        const treeProvider = new SocketIOEventsTreeProvider(collector);
        const collectorMock = mock(collector);
        collectorMock.expects('dispose').once();
        treeProvider.dispose();
        collectorMock.verify();
    });

    test('Test refresh', () => {
        const { collector } = initialize();
        const treeProvider = new SocketIOEventsTreeProvider(collector);
        const treeProviderMock = mock(treeProvider);
        treeProviderMock.expects('refresh').once();
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        collector.addEvent(connectionName, event);
        treeProviderMock.verify();
    });

    test('Test get connection item', () => {
        const { collector } = initialize();
        const treeProvider = new SocketIOEventsTreeProvider(collector);
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        collector.addEvent(connectionName, event);
        const connections = treeProvider.getChildren() as SocketIOConnectionItem[];
        assert.lengthOf(connections, 1);
        assert.instanceOf(connections[0], SocketIOConnectionItem);
        assert.strictEqual(connections[0].connection, 'Test connection');
        assert.strictEqual(treeProvider.getTreeItem(connections[0]), connections[0]);
    });

    test('Test get event collection item', () => {
        const { collector } = initialize();
        const treeProvider = new SocketIOEventsTreeProvider(collector);
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        collector.addEvent(connectionName, event);
        const connections = treeProvider.getChildren() as SocketIOConnectionItem[];
        const eventsCollections = treeProvider.getChildren(connections[0]) as SocketIOEventsCollectionItem[];
        assert.lengthOf(eventsCollections, 1);
        assert.instanceOf(eventsCollections[0], SocketIOEventsCollectionItem);
        assert.strictEqual(connections[0].connection, 'Test connection');
        assert.strictEqual(eventsCollections[0].event, 'Test');
        assert.strictEqual(treeProvider.getTreeItem(eventsCollections[0]), eventsCollections[0]);
    });

    test('Test get event item', () => {
        const { collector } = initialize();
        const treeProvider = new SocketIOEventsTreeProvider(collector);
        const connectionName: string = 'Test connection';
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: connectionName
        };

        collector.addEvent(connectionName, event);
        const connections = treeProvider.getChildren() as SocketIOConnectionItem[];
        const eventsCollections = treeProvider.getChildren(connections[0]) as SocketIOEventsCollectionItem[];
        const events = treeProvider.getChildren(eventsCollections[0]) as SocketIOEventsItem[];
        assert.lengthOf(eventsCollections, 1);
        assert.instanceOf(eventsCollections[0], SocketIOEventsCollectionItem);
        assert.strictEqual(connections[0].connection, 'Test connection');
        assert.strictEqual(eventsCollections[0].event, 'Test');
        assert.strictEqual(treeProvider.getTreeItem(eventsCollections[0]), eventsCollections[0]);
        assert.lengthOf(events, 1);
        assert.instanceOf(events[0], SocketIOEventsItem);
        assert.strictEqual(events[0].value, event);
    });
});
