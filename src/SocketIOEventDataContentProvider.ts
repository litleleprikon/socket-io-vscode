'use strict';

import * as fs from 'fs';

import { TextDocumentContentProvider, Uri, EventEmitter, Event } from 'vscode';

export default class SocketIOEventDataContentProvider implements TextDocumentContentProvider {

    static scheme = 'socketio-event';
    private static s_instance: SocketIOEventDataContentProvider = null;
    private _onDidChange = new EventEmitter<Uri>();


    constructor() {
        if (SocketIOEventDataContentProvider.s_instance) {
            SocketIOEventDataContentProvider.s_instance.dispose();
        }
        SocketIOEventDataContentProvider.s_instance = this;
    }

    static get instance() {
        return SocketIOEventDataContentProvider.s_instance;
    }

    public dispose() {
        this._onDidChange.dispose();
        if (SocketIOEventDataContentProvider.s_instance) {
            SocketIOEventDataContentProvider.s_instance.dispose();
            SocketIOEventDataContentProvider.s_instance = null;
        }
    }

    public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
        return "Hello world";
    }

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

    public update(uri: Uri) {
        this._onDidChange.fire(uri);
    }
}
