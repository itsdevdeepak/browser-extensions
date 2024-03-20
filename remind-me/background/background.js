browser.storage.session.set({ reminders: [], reminderIdCounter: 0 });

let reminderPort;

browser.runtime.onConnect.addListener(function connectionHandler(port) {
	reminderPort = port;
	reminderPort.onMessage.addListener(messageHandler);
});

browser.alarms.onAlarm.addListener(async function alarmHandler(alarm) {
	// Yep its complex
	const [reminderName, reminderId] = alarm.name.split('-');
	createNotification({
		type: 'basic',
		title: 'Remind Me',
		message: reminderName,
	});

	const storage = await browser.storage.session.get('reminders');

	const updatedReminders = storage.reminders.filter(
		(reminder) => reminder.id !== +reminderId
	);

	browser.storage.session.set({ reminders: updatedReminders });

	sendUpdateReminder(reminderPort, reminders);
});

async function messageHandler(message) {
	if (message.action === 'getReminders') {
		const reminders = await getReminders();
		sendUpdateReminder(reminderPort, reminders);
	}

	if (message.action === 'createReminder') {
		const reminders = await createReminderWithNotification(message.reminder);
		sendUpdateReminder(reminderPort, reminders);
	}

	if (message.action === 'deleteReminder') {
		const reminders = await deleteReminder(message.reminderId);
		sendUpdateReminder(reminderPort, reminders);
	}
}

async function createReminderWithNotification(reminder) {
	if (!reminder.hasOwnProperty('title')) return;

	const reminderIdCounter = await browser.storage.session.get(
		'reminderIdCounter'
	);

	const reminderId = reminderIdCounter.reminderIdCounter + 1;

	browser.alarms.create(`${reminder.title}-${reminderId}`, {
		delayInMinutes: reminder.delayInMinutes,
	});

	const storage = await browser.storage.session.get('reminders');

	const reminders = [{ ...reminder, id: reminderId }, ...storage.reminders];
	browser.storage.session.set({
		reminders: reminders,
		reminderIdCounter: reminderId,
	});

	return reminders;
}

async function deleteReminder(reminderId) {
	const reminders = await getReminders();
	const reminder = reminders.find((reminder) => reminder.id === reminderId);

	const clearAlarm = await browser.alarms.clear(
		`${reminder.title}-${reminder.id}`
	);

	if (!clearAlarm) return false;
	const storage = await browser.storage.session.get('reminders');
	const updatedReminders = storage.reminders.filter(
		(reminder) => reminder.id !== +reminderId
	);

	browser.storage.session.set({ reminders: updatedReminders });

	return updatedReminders;
}

function sendUpdateReminder(port, reminders) {
	reminders = reminders ? reminders : [];
	port.postMessage({ action: 'updateReminders', reminders });
}

async function getReminders() {
	const storage = await browser.storage.session.get('reminders');
	return storage.reminders;
}

function createNotification(notificationObject) {
	browser.notifications.create('', notificationObject);
}
