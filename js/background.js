const storage = chrome.storage.local;

chrome.runtime.onMessage.addListener(async (receive, _, send) => {
	const { id, minutes, description, editing, message } = receive;
	if (message === "startTimer") {
		if (minutes > 0.5) {
			// If minute is less than 30 seconds, use setInterval
		} else {
			// If minute is greater than 30 seconds, use alarms API
			const data = JSON.stringify({ id, minutes, description });
			await chrome.alarms.create(data, { delayInMinutes: minutes });
		}
	}
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
	const { timers } = await storage.get("timers");
	const { id, minutes, description } = JSON.parse(alarm.name);
	const index = timers.findIndex((timer) => timer.id === id);
	timers[index].playing = false;
	await storage.set({ timers });

	chrome.notifications.create({
		type: "basic",
		iconUrl: "./../assets/icon.png",
		title: `Simple Timer`,
		message: `Time's up!\nDuration: ${minutes}\n${description !== "" ? "Description: " + description : ""}`,
		priority: 2,
	});
});
