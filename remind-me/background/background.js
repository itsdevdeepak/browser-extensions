browser.storage.session.set({ reminders: [] });

browser.runtime.onMessage.addListener(messageHandler);

async function messageHandler(message) {
	browser.alarms.create(message.title, {
		delayInMinutes: message.delayInMinutes,
	});

	browser.alarms.onAlarm.addListener((alarm) => {
		if (alarm.name != message.title) return;

		createNotification({
			type: 'basic',
			title: 'Remind Me',
			message: message.title,
		});
	});

	let reminders = await browser.storage.session.get('reminders');

	reminders = [message, ...reminders.reminders];
	browser.storage.session.set({ reminders: reminders });

	return reminders;
}

function createNotification(notificationObject) {
	browser.notifications.create(notificationObject.title, notificationObject);
}
