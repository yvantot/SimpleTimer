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
				this.callback({ formattedTime: this.getHHMMSS(), elapsedInSec: this.elapsedInSec });
				this.setBadge();
				if (this.elapsedInSec >= this.minToSec(this.durationInMin)) {
					this.setNotif();
					this.discontinue();
				}
			}
		}, 1000);
	}
	async discontinue() {
		if (this.interval) {
			clearInterval(this.interval);

			const { timers } = await storage.get("timers");
			const index = timers.findIndex((timer) => timer.playing === true);
			timers[index].playing = false;
			await storage.set({ timers });
		}
	}
	toggle() {
		this.isPaused = !this.isPaused;
	}
	restart() {
		this.elapsedInSec = 0.0001;
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
		const s = remaining % 60;

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
		if (this.remainingSec() === 0) {
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

let timer = undefined;
chrome.runtime.onMessage.addListener((receive, _, send) => {
	const { message } = receive;
	if (message === "newTimer") {
		const { minutes, description } = receive;
		timer = new setTimer(minutes, 0, description, ({ timeFormatted, elapsedInSec }) => chrome.runtime.sendMessage({ message: "updateBar", timeFormatted, elapsedInSec }));
		timer.start();
	} else if (message === "toggleTimer") {
		timer.toggle();
	} else if (message === "stopTimer") {
		timer.discontinue();
	} else if (message === "restartTimer") {
		timer.restart();
	}
});

chrome.runtime.onSuspend.addListener(() => {
	// TODO
});
