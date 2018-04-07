import { SocketIOEventContentProvider, Errors } from '../src/SocketIOEventContentProvider';
import { SocketIOEventsCollector, IEvent } from '../src/SocketIOEventsCollector';
import { assert, expect } from 'chai';
import { mock } from 'sinon';
import { Uri } from 'vscode';

suite('SocketIOEventContentProvider', () => {
    function initialize(): {
        collector: SocketIOEventsCollector
    } {
        return { collector: new SocketIOEventsCollector() };
    }

    test('Initialization', () => {
        const { collector } = initialize();
        const provider = new SocketIOEventContentProvider(collector);
        const providerMock = mock(provider);
        providerMock.expects('dispose').once();
        const newProvider = new SocketIOEventContentProvider(collector);
        providerMock.verify();
        assert.strictEqual(SocketIOEventContentProvider.instance, newProvider);
    });

    test('Create URI', () => {
        const uri = SocketIOEventContentProvider.createURI(
            'localhost', 'test event', 0);
        assert.strictEqual(uri.query, 'connection=localhost&event=test%20event&index=0');
    });

    test('Parse URI', () => {
        const uri = SocketIOEventContentProvider.createURI(
            'localhost', 'test event', 1);
        const parsed = SocketIOEventContentProvider.parseURI(uri);
        assert.strictEqual(parsed.connection, 'localhost');
        assert.strictEqual(parsed.event, 'test event');
        assert.strictEqual(parsed.index, 1);
    });

    test('Parse invalid URI', () => {
        const uri1 = Uri.file('./test.js').with({ query: 'connection=localhost&event=test%20event&index=hello' });
        expect(() => { SocketIOEventContentProvider.parseURI(uri1); }).throw(Errors.InvalidURI);
        const uri2 = Uri.file('./test.js').with({ query: 'connection=localhost&index=0' });
        expect(() => { SocketIOEventContentProvider.parseURI(uri2); }).throw(Errors.InvalidURI);
        const uri3 = Uri.file('./test.js').with({ query: 'event=test%20event&index=hello' });
        expect(() => { SocketIOEventContentProvider.parseURI(uri3); }).throw(Errors.InvalidURI);
    });

    test('Dispose', () => {
        const { collector } = initialize();
        const provider = new SocketIOEventContentProvider(collector);
        provider.dispose();
        assert.isNull(SocketIOEventContentProvider.instance);
    });

    test('provide Content', () => {
        const { collector } = initialize();
        const provider = new SocketIOEventContentProvider(collector);
        const event: IEvent = {
            name: 'Test',
            datetime: new Date(),
            data: { test: 'test' },
            connection: 'test'
        };
        collector.addEvent('test', event);
        const uri = SocketIOEventContentProvider.createURI(event.connection, event.name, 0);
        assert.strictEqual(provider.provideTextDocumentContent(uri), JSON.stringify(event.data));
    });
});
