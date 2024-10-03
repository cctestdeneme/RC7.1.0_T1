import type { IRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import { usePresence } from '../../../hooks/usePresence';
import RoomHeader from './RoomHeader';

type DirectRoomHeaderProps = {
	room: IRoom;
	slots: {
		start?: ReactNode;
		preContent?: ReactNode;
		insideContent?: ReactNode;
		posContent?: ReactNode;
		end?: ReactNode;
		toolbox?: {
			pre?: ReactNode;
			content?: ReactNode;
			pos?: ReactNode;
		};
	};
};

const DirectRoomHeader = ({ room, slots }: DirectRoomHeaderProps): ReactElement => {
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const directUserData = usePresence(directUserId);

	return <RoomHeader slots={slots} room={room} topic={directUserData?.statusText} />;
};

export default DirectRoomHeader;
