import {
    SocketIOConnectionFactory, SocketIOConnection,
    EventCallback, ISocket, Connect, Errors as FactoryErrors
} from '../src/SocketIOConnectionFactory';
import { assert, expect } from 'chai';
import { mock, SinonMock, spy } from 'sinon';
import { SocketIOEventsCollector, IEvent } from '../src/SocketIOEventsCollector';
import * as io from 'socket.io-client';

export class TestSocket implements ISocket {
    private callback;
    private connectCallback;
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

    public connect() {
        this.connectCallback();
    }

    public emit(event: string, data?: any): ISocket {
        this.callback(data);
        return this;
    }

    public on(event: string, callback?: (data?: any) => void): ISocket {
        if (event === 'connect') {
            this.connectCallback = callback;
            return this;
        }
        this.eventName = event;
        this.callback = callback;
        return this;
    }

    public disconnect(): ISocket {
        this.disconnectCalled = true;
        return this;
    }

    public close(): ISocket {
        this.disconnectCalled = true;
        return this;
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
    const initFactory = (): {
        collector: SocketIOEventsCollector,
        testSocket: TestSocket,
        collectorMock: SinonMock,
        factory: SocketIOConnectionFactory
    } => {
        const testSocket = new TestSocket();
        const connect: Connect = (url: string, options?: object): ISocket => {
            setTimeout(() => { testSocket.connect(); }, 50);
            return testSocket;
        };
        const collector = new SocketIOEventsCollector();
        const collectorMock = mock(collector);
        const factory = new SocketIOConnectionFactory(connect, collector);
        return { collector, testSocket, collectorMock, factory };
    };

    test('Initialization', async () => {
        const { collector, factory } = initFactory();
    });

    test('Getting Connection', async () => {
        const { collector, factory } = initFactory();
        const connection = await factory.getConnection('http://localhost');
        let error: Error = null;
        await factory.getConnection('test').catch((caughtError: Error) => {
            error = caughtError;
        });
        assert.strictEqual(error, FactoryErrors.URLError);
    });

    test('Test On', async () => {
        const { collector, factory} = initFactory();
        const connection = await factory.getConnection('http://localhost');
        const data = {hello: 'world'};
        connection.on('hello');
        connection.emit('hello', data);
        const event = collector.getEvent('http://localhost', 'hello', 0);
        assert.strictEqual(event.data, data);
    });

    test('Connection error', async () => {
        const { testSocket, collector } = initFactory();
        const error = new Error();
        const factory = new SocketIOConnectionFactory((url: string, options?: object): ISocket => {
            setTimeout(() => {testSocket.emit('connect_error', error); }, 10);
            return testSocket;
        }, collector);
        let caughtError: Error;
        await factory.getConnection('http://localhost').catch((sentError: Error) => {
            caughtError = sentError;
        });
        assert.strictEqual(caughtError, error);
    });

    test('Timeout reject', async () => {
        const { testSocket, collector } = initFactory();
        const factory = new SocketIOConnectionFactory((url: string, options?: object): ISocket => {
            setTimeout(() => {testSocket.emit('connect_timeout', 20); }, 10);
            return testSocket;
        }, collector);
        const errorSpy = spy();
        await factory.getConnection('http://localhost').catch(errorSpy);
        errorSpy.calledOnceWithExactly(FactoryErrors.ConnectTimeout);
        // assert.strictEqual(error, FactoryErrors.ConnectTimeout);
    });

    test('URL validity check', async () => {
        assert.isFalse(SocketIOConnectionFactory.checkURLValid('/this'));
        assert.isFalse(SocketIOConnectionFactory.checkURLValid('localhost/this'));
        assert.isTrue(SocketIOConnectionFactory.checkURLValid('http://localhost/this'));
        assert.isTrue(SocketIOConnectionFactory.checkURLValid('https://localhost/this'));
        assert.isTrue(SocketIOConnectionFactory.checkURLValid('https://localhost:3000/this'));
    });

    test('Dispose', async () => {
        const { factory, collectorMock } = initFactory();
        const connection = await factory.getConnection('http://localhost');
        collectorMock.expects('dispose').once();
        factory.dispose();
        collectorMock.verify();
    });
});
