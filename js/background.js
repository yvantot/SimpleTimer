const storage = chrome.storage.local;

class setTimer {
	constructor(durationInMin, elapsedInSec, description, callback) {
		this.durationInMin = durationInMin;
		this.elapsedInSec = elapsedInSec;
		this.description = description;
		this.interval = null;
		this.isPaused = false;
		this.callback = callback;
	}
	start() {
		this.interval = setInterval(async () => {
			if (!this.isPaused) {
				this.elapsedInSec += 1;
				this.callback({ durationInMin: this.durationInMin, timeFormatted: this.getHHMMSS(), elapsedInSec: this.elapsedInSec });
				if (this.elapsedInSec >= this.minToSec(this.durationInMin)) {
					this.setNotif();
					this.discontinue();
				}
				this.setBadge();
			}
		}, 1000);
	}
	discontinue() {
		if (!this.interval) return;
		clearInterval(this.interval);
		chrome.action.setBadgeText({ text: "STOP" });
		chrome.action.setBadgeBackgroundColor({ color: "red" });
		pausePlay();
	}
	toggle() {
		this.isPaused = !this.isPaused;
		if (this.isPaused === true) {
			chrome.action.setBadgeBackgroundColor({ color: "orange" });
		} else {
			this.setBadge();
		}
	}
	restart() {
		this.elapsedInSec = 0.0001;
		this.callback({ durationInMin: this.durationInMin, timeFormatted: this.getHHMMSS(), elapsedInSec: this.elapsedInSec });
		this.setBadge();
		if (this.isPaused === true) chrome.action.setBadgeBackgroundColor({ color: "orange" });
	}
	minToSec(min) {
		return min * 60;
	}
	secToMin(sec) {
		return sec / 60;
	}
	remainingSec() {
		return this.minToSec(this.durationInMin) - this.elapsedInSec;
	}
	getHHMMSS() {
		const remaining = this.remainingSec();
		const hr = Math.floor(remaining / 3600);
		const m = Math.floor((remaining % 3600) / 60);
		const s = (remaining % 60).toFixed(0);

		const formattedH = String(hr).padStart(2, "0");
		const formattedM = String(m).padStart(2, "0");
		const formattedS = String(s).padStart(2, "0");

		return `${formattedH}:${formattedM}:${formattedS}`;
	}
	getFormat() {
		if (this.remainingSec() < 60) {
			return "s";
		} else if (this.secToMin(this.remainingSec()) < 60) {
			return "m";
		} else {
			return "h";
		}
	}
	setNotif() {
		chrome.notifications.create({
			type: "basic",
			iconUrl: "./../assets/icon.png",
			title: `Simple Timer — ${this.durationInMin}m`,
			message: `Time's up\n${this.description !== "" ? "Description: " + this.description : ""}`,
			priority: 2,
		});
	}
	setBadge() {
		if (this.remainingSec() <= 0) {
			chrome.action.setBadgeText({ text: "OK" });
			chrome.action.setBadgeBackgroundColor({ color: "#43d630" });
			return;
		}

		const format = this.getFormat();
		if (format === "s") {
			chrome.action.setBadgeText({ text: this.remainingSec().toFixed(0) + "s" });
			chrome.action.setBadgeBackgroundColor({ color: "#bf1a34" });
		} else if (format === "m") {
			chrome.action.setBadgeText({ text: Math.floor(this.secToMin(this.remainingSec())) + "m" });
			chrome.action.setBadgeBackgroundColor({ color: "#035AA6" });
		} else if (format === "h") {
			chrome.action.setBadgeText({ text: Math.floor(this.secToMin(this.remainingSec()) / 60) + "h" });
			chrome.action.setBadgeBackgroundColor({ color: "#674ea7" });
		}
	}
}

let timer = null;
chrome.runtime.onMessage.addListener(async (receive, _, send) => {
	const { message } = receive;
	if (message === "newTimer") {
		const { minutes, description } = receive;
		timer = new setTimer(minutes, 0, description, ({ timeFormatted, elapsedInSec, durationInMin }) => chrome.runtime.sendMessage({ message: "updateBar", timeFormatted, elapsedInMin: timer.secToMin(elapsedInSec), durationInMin }));
		timer.start();
	} else if (message === "toggleTimer") {
		if (timer) {
			timer.toggle();
			send({ isPaused: timer.isPaused });
		}
	} else if (message === "stopTimer") {
		if (timer) {
			timer.discontinue();
		} else {
			pausePlay();
		}
	} else if (message === "restartTimer") {
		if (timer) timer.restart();
	}
});

async function pausePlay() {
	const { timers } = await storage.get("timers");
	const index = timers.findIndex((timer) => timer.playing === true);
	timers[index].playing = false;
	await storage.set({ timers });
}

// When browser unloads the extension which I have no way of testing
// I'm just hoping that this fucking works
chrome.runtime.onSuspend.addListener(async () => {
	const { timers } = await storage.get("timers");
	timers.forEach((timer) => {
		timer.playing = false;
	});
	await storage.set({ timers });
});
