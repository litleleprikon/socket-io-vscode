import { TreeDataProvider, TreeItem, Event, EventEmitter, TreeItemCollapsibleState, Command } from 'vscode';
import {Event as SocketIOEvent} from './SocketIOConnection'
import * as path from 'path';

export default class SocketIOEventsTreeProvider implements TreeDataProvider<SocketIOEventsItem> {

    private _onDidChangeTreeData: EventEmitter<SocketIOEventsItem | undefined> = new EventEmitter<SocketIOEventsItem | undefined>();
    readonly onDidChangeTreeData?: Event<SocketIOEventsItem> = this._onDidChangeTreeData.event;
    private socketIOEvents: { [eventName: string]: SocketIOEvent[] };

    constructor() {
        this.socketIOEvents = {};
    }

    setData(data: {[eventName: string]: SocketIOEvent[]}) {
        this.socketIOEvents = data;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SocketIOEventsItem): TreeItem | Thenable<TreeItem> {
        return element;
    }

    getChildren(element?: SocketIOEventsItem | SocketIOEventsNameItem): (SocketIOEventsItem | SocketIOEventsNameItem)[] {
        if (!element) {
            return Object.keys(this.socketIOEvents).map((value: string): SocketIOEventsNameItem => {
                return new SocketIOEventsNameItem(value);
            });
        } else if (element instanceof SocketIOEventsNameItem) {
            return this.socketIOEvents[element.name].map((value: SocketIOEvent): SocketIOEventsItem => {
                let name: string = value.datetime.toLocaleTimeString();
                return new SocketIOEventsItem(name, value);
            })
        }
    }
}

class SocketIOEventsItem extends TreeItem {
    constructor(
        public readonly name: string,
        // public readonly collapsibleState: TreeItemCollapsibleState,
        // public readonly command?: Command,
        public readonly value?: SocketIOEvent
    ) {
        super(name, TreeItemCollapsibleState.None);
        this.command = {
            command: 'extension.openEmitedEventsByName',
            title: 'test',
            arguments: [this.value],
        };
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'Event.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'Event.svg')
        };
    }
}

class SocketIOEventsNameItem extends TreeItem {
    constructor(
        public readonly name: string,
    ) {
        super(name, TreeItemCollapsibleState.Collapsed);
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'Events.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'Events.svg')
        };
    }
}