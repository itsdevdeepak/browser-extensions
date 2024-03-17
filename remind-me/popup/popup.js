document.addEventListener('DOMContentLoaded', () => {
	const reminderFormEle = document.getElementById('reminder_form');
	const addReminderBtn = document.getElementById('add_reminder');
	const cancelReminderBtn = document.getElementById('cancel_reminder');
	const reminders = document.getElementById('reminderss');

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

			const reminders = await browser.runtime.sendMessage({
				title: reminderName,
				delayInMinutes: minutesBetweenDates(
					new Date(Date.now()),
					new Date(reminderDate)
				),
			});

			document
				.getElementById('reminders')
				.replaceChildren(createsReminderListFragment(reminders));
		}
	);

	addReminderBtn.addEventListener('click', function showReminderForm() {
		reminderFormEle.classList.remove('remove');
	});

	cancelReminderBtn.addEventListener('click', function showReminderForm() {
		reminderFormEle.classList.add('remove');
	});
});

function createsReminderListFragment(reminders) {
	const reminderList = new DocumentFragment();
	reminders.forEach((reminder) => {
		const reminderTemplate = reminder_template.content.cloneNode(true);
		reminderTemplate.querySelector('.title').innerText = reminder.title;
		reminderList.append(reminderTemplate);
	});
	return reminderList;
}

function minutesBetweenDates(date1, date2) {
	const differenceInMilliseconds = Math.abs(date1 - date2);
	const differenceInMinutes = differenceInMilliseconds / 1000 / 60;
	return differenceInMinutes;
}
