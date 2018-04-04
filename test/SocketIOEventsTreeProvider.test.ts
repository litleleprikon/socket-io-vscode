import SocketIOEventsTreeProvider from '../src/SocketIOEventsTreeProvider';
import { SocketIOEventsCollector, IEvent } from '../src/SocketIOEventsCollector';
import { mock } from 'sinon';

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
});
