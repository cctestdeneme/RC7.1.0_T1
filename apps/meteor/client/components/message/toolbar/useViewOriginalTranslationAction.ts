import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useMethod, usePermission, useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { AutoTranslate } from '../../../../app/autotranslate/client';
import { Messages } from '../../../../app/models/client';
import { MessageAction } from '../../../../app/ui-utils/client';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { hasTranslationLanguageInAttachments, hasTranslationLanguageInMessage } from '../../../views/room/MessageList/lib/autoTranslate';

export const useViewOriginalTranslationAction = (
	message: IMessage & { autoTranslateShowInverse?: boolean },
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
) => {
	const user = useUser();
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled', false);
	const canAutoTranslate = usePermission('auto-translate');
	const translateMessage = useMethod('autoTranslate.translateMessage');

	const language = useMemo(
		() => subscription?.autoTranslateLanguage || AutoTranslate.getLanguage(message.rid),
		[message.rid, subscription?.autoTranslateLanguage],
	);
	const hasTranslations = useMemo(
		() => hasTranslationLanguageInMessage(message, language) || hasTranslationLanguageInAttachments(message.attachments, language),
		[message, language],
	);

	useEffect(() => {
		if (!autoTranslateEnabled || !canAutoTranslate || !user) {
			return;
		}

		const isLivechatRoom = roomCoordinator.isLivechatRoom(room?.t);
		const isDifferentUser = message?.u && message.u._id !== user._id;
		const autoTranslationActive = subscription?.autoTranslate || isLivechatRoom;

		if (message.autoTranslateShowInverse || !isDifferentUser || !autoTranslationActive || !hasTranslations) {
			return;
		}

		MessageAction.addButton({
			id: 'view-original',
			icon: 'language',
			label: 'View_original',
			context: ['message', 'message-mobile', 'threads'],
			type: 'interaction',
			group: 'menu',
			action() {
				if (!hasTranslations) {
					AutoTranslate.messageIdsToWait[message._id] = true;
					Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
					void translateMessage(message, language);
				}
				const action = 'autoTranslateShowInverse' in message ? '$unset' : '$set';
				Messages.update({ _id: message._id }, { [action]: { autoTranslateShowInverse: true } });
			},
			order: 90,
		});

		return () => {
			MessageAction.removeButton('view-original');
		};
	}, [
		autoTranslateEnabled,
		canAutoTranslate,
		hasTranslations,
		language,
		message,
		room?.t,
		subscription?.autoTranslate,
		translateMessage,
		user,
	]);
};
