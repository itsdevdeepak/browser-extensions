document.addEventListener('DOMContentLoaded', async function loadContent() {
	const reminderFormEle = document.getElementById('reminder_form');
	const addReminderBtn = document.getElementById('add_reminder');
	const cancelReminderBtn = document.getElementById('cancel_reminder');
	const remindersEle = document.getElementById('reminders');

	const reminderPort = browser.runtime.connect({ name: 'reminder_port' });

	reminderPort.onMessage.addListener(function messageHandler(message) {
		if (message.action === 'updateReminders') {
			updateRemindersEle(message.reminders);
		}
	});

	reminderFormEle.addEventListener(
		'submit',
		async function handleFormSubmit(event) {
			event.preventDefault();

			const formData = new FormData(reminderFormEle);
			const reminderName = formData.get('reminder_name');
			const reminderDate = formData.get('reminder_date');

			if (!reminderName || !reminderDate) {
				return; // handel error here
			}

			reminderPort.postMessage({
				action: 'createReminder',
				reminder: {
					title: reminderName,
					delayInMinutes: minutesBetweenDates(
						new Date(Date.now()),
						new Date(reminderDate)
					),
				},
			});

			reminderFormEle.querySelector('.reminder_name').value = '';
			reminderFormEle.querySelector('.reminder_date').value = '';
			reminderFormEle.classList.add('remove');
		}
	);

	remindersEle.addEventListener('click', async function removeReminder(event) {
		if (event.target.classList.contains('delete_reminder')) {
			reminderPort.postMessage({
				action: 'deleteReminder',
				reminderId: +event.target.getAttribute('data-id'),
			});
		}
	});

	addReminderBtn.addEventListener('click', function hideReminderForm() {
		reminderFormEle.classList.remove('remove');
	});

	cancelReminderBtn.addEventListener('click', function showReminderForm() {
		reminderFormEle.classList.add('remove');
	});

	reminderPort.postMessage({
		action: 'getReminders',
	});

	updateRemindersEle(reminders);
});

function updateRemindersEle(reminders = []) {
	if (!Array.isArray(reminders)) return false;

	const remindersEle = document.getElementById('reminders');
	if (remindersEle.children.length < 1 && reminders.length < 1) {
		const noReminderEle = document.createElement('p');
		noReminderEle.innerText = 'Your reminders will show here';
		noReminderEle.classList.add('text-small');
		remindersEle.replaceChildren(noReminderEle);
		return true;
	}

	const remindersFrag = new DocumentFragment();
	reminders.forEach((reminder) => {
		const reminderTemplate = reminder_template.content.cloneNode(true);
		reminderTemplate.querySelector('.title').innerText = `${
			reminder.title
		} on ${exactTime(reminder.delayInMinutes)}`;
		reminderTemplate
			.querySelector('.delete_reminder')
			.setAttribute('data-id', reminder.id);
		remindersFrag.append(reminderTemplate);
	});

	remindersEle.replaceChildren(remindersFrag);
	return true;
}

function minutesBetweenDates(date1, date2) {
	const differenceInMilliseconds = Math.abs(date1 - date2);
	const differenceInMinutes = differenceInMilliseconds / 1000 / 60;
	return differenceInMinutes;
}

function exactTime(minutes) {
	const currentDate = new Date(Date.now());
	currentDate.setTime(currentDate.getTime() + minutes * 60 * 1000);
	return currentDate.toLocaleDateString('en-US', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	});
}
