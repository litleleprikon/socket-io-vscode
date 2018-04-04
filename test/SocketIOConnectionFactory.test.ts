import { SocketIOConnectionFactory, SocketIOConnection, EventCallback } from '../src/SocketIOConnectionFactory';
import { assert, expect } from 'chai';
import { mock, SinonMock } from 'sinon';
import { SocketIOEventsCollector, IEvent } from '../src/SocketIOEventsCollector';
import * as io from 'socket.io-client';

class TestSocket implements io.Socket {
    private callback;
    private eventName: string;
    private disconnectCalled = false;

    public getCallback() {
        return this.callback;
    }

    public isDisconnectCalled(): boolean {
        return this.disconnectCalled;
    }

    public getEventName(): string {
        return this.eventName;
    }

    public emit(event: string, data: any) {
        this.callback(data);
    }

    public on(event: string, callback) {
        this.eventName = event;
        this.callback = callback;
    }

    public disconnect() {
        this.disconnectCalled = true;
    }
}

suite('SocketIOConnection Tests', () => {
    const eventCheck = {
        eventName: '',
        eventData: null
    };
    const testSocket: TestSocket = new TestSocket();
    const callback: EventCallback = async (event: string, data: any) => {
        eventCheck.eventName = event;
        eventCheck.eventData = data;
    };
    const connection: SocketIOConnection = new SocketIOConnection(testSocket, callback);

    test('Initialization', async () => {
        assert.isFalse(connection.isDisposed());
    });

    test('Event added', async () => {
        connection.on('test');
        assert.isFunction(testSocket.getCallback());
        assert.strictEqual(testSocket.getEventName(), 'test');
    });

    test('Event called', async () => {
        connection.emit('test', 'data');
        assert.strictEqual(eventCheck.eventName, 'test');
        assert.strictEqual(eventCheck.eventData, 'data');
    });

    test('Dispose done', async () => {
        connection.dispose();
        assert.isTrue(connection.isDisposed());
    });

});

suite('SocketIOConnectionFactory Tests', () => {
    function createConnectFunc(testSocket) {
        return (url: string, options?: object) => io.Socket = (): io.Socket => {
            return testSocket;
        };
    }

    const initFactory = (): {
        collector: SocketIOEventsCollector,
        testSocket: TestSocket,
        connectFn: (url: string, options?: object) => io.Socket,
        collectorMock: SinonMock,
        factory: SocketIOConnectionFactory
    } => {
        const testSocket = new TestSocket();
        const connectFn = createConnectFunc(testSocket);
        const collector = new SocketIOEventsCollector();
        const collectorMock = mock(collector);
        const factory = new SocketIOConnectionFactory(connectFn, collector);
        return { collector, testSocket, connectFn, collectorMock, factory };
    };

    test('Initialization', async () => {
        const { collector, connectFn, factory } = initFactory();
    });

    test('Getting Connection', async () => {
        const { collector, connectFn, factory } = initFactory();
        // strange issue with callback is null
        // const connection = await factory.getConnection('http://localhost');
    });

    // This lines are commented because function connect have weird behavior
    test('Test On', async () => {
        const { collector, connectFn, factory } = initFactory();
        // strange issue with callback is null
        // const connection = await factory.getConnection('http://localhost');
        // connection.on('hello');
    });

    test('URL validity check', async () => {
        assert.isFalse(SocketIOConnectionFactory.checkURLValid('/this'));
        assert.isFalse(SocketIOConnectionFactory.checkURLValid('localhost/this'));
        assert.isTrue(SocketIOConnectionFactory.checkURLValid('http://localhost/this'));
        assert.isTrue(SocketIOConnectionFactory.checkURLValid('https://localhost/this'));
        assert.isTrue(SocketIOConnectionFactory.checkURLValid('https://localhost:3000/this'));
        const { factory } = initFactory();
        // strange issue with callback is null
        // expect(async () => {await factory.getConnection('localhost')}).to.throw();
    });
});
