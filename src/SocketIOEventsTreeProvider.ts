import { TreeDataProvider, TreeItem, Event, EventEmitter, TreeItemCollapsibleState, Command } from 'vscode';
import { IEvent as SocketIOEvent } from './SocketIOEventsCollector';
import * as path from 'path';

export default class SocketIOEventsTreeProvider
    implements TreeDataProvider<SocketIOEventsItem | SocketIOEventsNameItem> {

    private _onDidChangeTreeData: EventEmitter<SocketIOEventsItem | undefined> =
        new EventEmitter<SocketIOEventsItem | undefined>();
    public readonly onDidChangeTreeData?: Event<SocketIOEventsItem> = this._onDidChangeTreeData.event;
    private socketIOEvents: { [eventName: string]: SocketIOEvent[] };

    constructor() {
        this.socketIOEvents = {};
    }

    public setData(data: { [eventName: string]: SocketIOEvent[] }) {
        this.socketIOEvents = data;
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: SocketIOEventsItem): TreeItem | Thenable<TreeItem> {
        return element;
    }

    public getChildren(element?: SocketIOEventsItem | SocketIOEventsNameItem):
        Thenable<Array<SocketIOEventsItem | SocketIOEventsNameItem>> {
        return new Promise((resolve) => {
            if (!element) {
                const elements = Object.keys(this.socketIOEvents).map((value: string): SocketIOEventsNameItem => {
                    return new SocketIOEventsNameItem(value);
                });
                resolve(elements);
            } else if (element instanceof SocketIOEventsNameItem) {
                const elements = this.socketIOEvents[element.name].map((value: SocketIOEvent): SocketIOEventsItem => {
                    const name: string = value.datetime.toLocaleTimeString();
                    return new SocketIOEventsItem(name, value);
                });
                resolve(elements);
            }
        });
    }
}

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

class SocketIOEventsItem extends TreeItem {
    public iconPath;
    public command;

    constructor(
        public readonly name: string,
        public readonly value?: SocketIOEvent
    ) {
        super(name, TreeItemCollapsibleState.None);
        this.command = {
            command: 'extension.openEmitedEventsByName',
            title: 'test',
            arguments: [this.value],
        };
        // this.iconPath = getIconPaths('Event');
    }
}

class SocketIOEventsNameItem extends TreeItem {
    public iconPath;

    constructor(
        public readonly name: string,
    ) {
        super(name, TreeItemCollapsibleState.Collapsed);
        // this.iconPath = this.iconPath = getIconPaths('Events');
    }
}
