import { Emitter } from '@rocket.chat/emitter';
import type { ReactNode } from 'react';
import React, { useEffect, useMemo } from 'react';

import { SelectedMessageContext } from '../MessageList/contexts/SelectedMessagesContext';
import { useMessages } from '../MessageList/hooks/useMessages';
import { useRoom } from '../contexts/RoomContext';

// data-qa-select

export const selectedMessageStore = new (class SelectMessageStore extends Emitter<
	{
		change: undefined;
		toggleIsSelecting: boolean;
	} & { [mid: string]: boolean }
> {
	store = new Set<string>();

	private storeArray = Array.from(this.store);

	availableMessages = new Set<string>();

	isSelecting = false;

	constructor() {
		super();
		this.on('change', () => {
			this.storeArray = Array.from(this.store);
		});
	}

	setIsSelecting(isSelecting: boolean): void {
		this.isSelecting = isSelecting;
		this.emit('toggleIsSelecting', isSelecting);
	}

	getIsSelecting(): boolean {
		return this.isSelecting;
	}

	isSelected(mid: string): boolean {
		return Boolean(this.store.has(mid));
	}

	getSelectedMessages(): string[] {
		return this.storeArray;
	}

	toggle(mid: string): void {
		if (this.store.has(mid)) {
			this.store.delete(mid);
			this.emit(mid, false);
			this.emit('change');
			return;
		}
		this.store.add(mid);
		this.emit(mid, true);
		this.emit('change');
	}

	select(mid: string): void {
		if (this.store.has(mid)) {
			return;
		}

		this.store.add(mid);
		this.emit(mid, true);
		this.emit('change');
	}

	count(): number {
		return this.store.size;
	}

	clearStore(): void {
		const selectedMessages = this.getSelectedMessages();
		this.store.clear();
		selectedMessages.forEach((mid) => this.emit(mid, false));
		this.emit('change');
	}

	reset(): void {
		this.clearStore();
		this.isSelecting = false;
		this.emit('toggleIsSelecting', false);
	}

	toggleAll(mids: string[]): void {
		mids.forEach((mid) => this.select(mid));
	}
})();

type SelectedMessagesProviderProps = {
	children?: ReactNode;
};

export const SelectedMessagesProvider = ({ children }: SelectedMessagesProviderProps) => {
	const room = useRoom();
	const messages = useMessages({ rid: room._id });

	useEffect(() => {
		selectedMessageStore.availableMessages = new Set(messages.map((message) => message._id));
	}, [messages]);

	const value = useMemo(
		() => ({
			selectedMessageStore,
		}),
		[],
	);

	return <SelectedMessageContext.Provider value={value}>{children}</SelectedMessageContext.Provider>;
};
