import { TreeDataProvider, TreeItem, Event, EventEmitter, TreeItemCollapsibleState, Command, Disposable } from 'vscode';
import { IEvent as SocketIOEvent, SocketIOEventsCollector } from './SocketIOEventsCollector';
import * as path from 'path';

export class SocketIOEventsTreeProvider
    implements TreeDataProvider<SocketIOConnectionItem | SocketIOEventsItem | SocketIOEventsCollectionItem>,
    Disposable {

    private _onDidChangeTreeData: EventEmitter<SocketIOEventsItem | undefined> =
        new EventEmitter<SocketIOEventsItem | undefined>();
    public readonly onDidChangeTreeData?: Event<SocketIOEventsItem> = this._onDidChangeTreeData.event;
    private collector: SocketIOEventsCollector;

    constructor(collector: SocketIOEventsCollector) {
        this.collector = collector;
        collector.subscribeToAll(() => {
            this.refresh();
        });
    }

    public dispose() {
        this.collector.dispose();
        this.collector = null;
        this._onDidChangeTreeData.dispose();
        this._onDidChangeTreeData = null;
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: SocketIOEventsItem | SocketIOEventsCollectionItem | SocketIOConnectionItem):
        TreeItem | Thenable<TreeItem> {
        return element;
    }

    public getChildren(element?: SocketIOEventsItem | SocketIOEventsCollectionItem | SocketIOConnectionItem):
        Array<SocketIOEventsItem | SocketIOEventsCollectionItem | SocketIOConnectionItem> {
        if (!element) {
            const elements: SocketIOConnectionItem[] = [];
            for (const connection of this.collector.connections()) {
                elements.push(new SocketIOConnectionItem(connection));
            }
            return elements;
        } else if (element instanceof SocketIOConnectionItem) {
            const elements: SocketIOEventsCollectionItem[] = [];
            for (const eventName of this.collector.eventsCollections(element.connection)) {
                elements.push(new SocketIOEventsCollectionItem(element.connection, eventName));
            }
            return elements;
        } else if (element instanceof SocketIOEventsCollectionItem) {
            const elements: SocketIOEventsItem[] = [];
            let counter = 0;
            for (const event of this.collector.events(element.connection, element.event)) {
                elements.push(new SocketIOEventsItem(element.connection, element.event, counter++, event));
            }
            return elements;
        }

    }
}

export default SocketIOEventsTreeProvider;

interface IIconPath {
    light: string;
    dark: string;
}

function getIconPaths(icon: string): IIconPath {
    return {
        light: path.join(__filename, '..', '..', 'resources', 'light', `${icon}.png`),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', `${icon}.png`)
    };
}

export class SocketIOEventsItem extends TreeItem {
    public iconPath;
    public command;

    constructor(
        public readonly connection: string,
        public readonly event: string,
        public readonly index: number,
        public readonly value: SocketIOEvent
    ) {
        super(value.datetime.toLocaleTimeString(), TreeItemCollapsibleState.None);
        this.command = {
            command: 'openEmittedEvent',
            title: 'test',
            arguments: [this.value, this.index],
        };
        this.iconPath = getIconPaths('Event');
    }
}

export class SocketIOEventsCollectionItem extends TreeItem {
    public iconPath;

    constructor(
        public readonly connection: string,
        public readonly event: string,
    ) {
        super(event, TreeItemCollapsibleState.Collapsed);
        this.iconPath = this.iconPath = getIconPaths('Events');
    }
}

export class SocketIOConnectionItem extends TreeItem {
    public iconPath;

    constructor(
        public readonly connection: string,
    ) {
        super(connection, TreeItemCollapsibleState.Collapsed);
        this.iconPath = this.iconPath = getIconPaths('Events');
    }
}
