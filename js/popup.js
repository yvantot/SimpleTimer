const storage = chrome.storage.local;

onClick();

function onClick() {
	const resetBadge = async () => {
		const { timers } = await storage.get("timers");
		const hasPlaying = timers.findIndex((timer) => timer.playing === true);
		if (hasPlaying === -1) await chrome.action.setBadgeText({ text: "" });
	};
	const onStorageChanged = () => {
		chrome.storage.onChanged.addListener(({ timers }) => {
			const hasPlaying = timers.newValue.findIndex((timer) => timer.playing === true);

			if (hasPlaying === -1) {
				addTimers(timers.newValue);
				document.body.removeAttribute("style");
				document.querySelector(".timer-add").setAttribute("style", "visibility: visible;");
				document.querySelector(".play-container")?.remove();
			} else {
				addPlaybar(timers.newValue[hasPlaying]);
				document.body.setAttribute("style", "height: 80px;");
				document.querySelector(".timer-add").setAttribute("style", "visibility: hidden;");
				document.querySelector("main").innerHTML = "";
			}
		});
	};
	const initStorage = async () => {
		const { timers } = await storage.get("timers");

		if (Object.keys(timers).length === 0) {
			await storage.set(DEFAULT);
		} else {
			const hasPlaying = timers.findIndex((timer) => timer.playing === true);
			if (hasPlaying === -1) {
				addTimers(timers);
				document.body.removeAttribute("style");
				document.querySelector(".timer-add").setAttribute("style", "visibility: visible;");
				document.querySelector(".play-container")?.remove();
			} else {
				addPlaybar(timers[hasPlaying]);
				document.body.setAttribute("style", "height: 80px;");
				document.querySelector(".timer-add").setAttribute("style", "visibility: hidden;");
				document.querySelector("main").innerHTML = "";
			}
		}
	};
	const onMessage = () => {
		chrome.runtime.onMessage.addListener((receive) => {
			const { message } = receive;
			if (message === "updateBar") {
				const { timeFormatted, elapsedInMin, durationInMin } = receive;
				const percent = 100 - (elapsedInMin / durationInMin) * 100;
				document.querySelector(".play-time").textContent = timeFormatted;
				const playbar = document.querySelector(".play-bar");

				playbar.style.width = `${percent}%`;
				if (percent < 20) {
					playbar.style.backgroundColor = "red";
				} else if (percent < 50) {
					playbar.style.backgroundColor = "orange";
				} else if (percent <= 100) {
					playbar.style.backgroundColor = "#1ccf45";
				}
			}
		});
	};
	const onNewTimerClick = () => {
		document.getElementById("add-timer").addEventListener("click", async () => {
			const { timers } = await storage.get("timers");
			const data = { id: 0, minutes: 5, description: "", playing: false, editing: false };

			if (timers.length === 0) {
				timers.push(data);
			} else {
				const lastTimer = timers[timers.length - 1];
				const id = lastTimer.id + 1;
				const minutes = lastTimer.minutes + 10;
				data.id = id;
				data.minutes = minutes;
				timers.push(data);
			}

			await storage.set({ timers });
		});
	};

	resetBadge();
	onStorageChanged();
	initStorage();
	onMessage();
	onNewTimerClick();
}

function addTimers(timers) {
	const main = document.querySelector("main");
	main.innerHTML = "";
	if (timers.length > 0) {
		timers.forEach((timer) => {
			addTimer(timer, main);
		});
	}
}

function addPlaybar(timer) {
	const { minutes, description } = timer;
	const div = document.createElement("div");
	div.setAttribute("class", "play-container");

	div.innerHTML = `        						
			<div class="play-desc">${description}</div>
			<div class="play-value">
				<div class="play-bar-value">${minutes}</div>
				<span> min</span>
			</div>			
			<div class="play-time">00:00:00</div>
			<div class="play-bar"></div>
			<div class="play-action">
				<div class="play-stop play-feature">
					<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q54 0 104-17.5t92-50.5L228-676q-33 42-50.5 92T160-480q0 134 93 227t227 93Zm252-124q33-42 50.5-92T800-480q0-134-93-227t-227-93q-54 0-104 17.5T284-732l448 448Z" /></svg>
				</div>
				<div class="play-pause play-feature">
					<img src="./../assets/play-pause.svg" alt="" />
				</div>
				<div class="play-restart play-feature">
					<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M440-122q-121-15-200.5-105.5T160-440q0-66 26-126.5T260-672l57 57q-38 34-57.5 79T240-440q0 88 56 155.5T440-202v80Zm80 0v-80q87-16 143.5-83T720-440q0-100-70-170t-170-70h-3l44 44-56 56-140-140 140-140 56 56-44 44h3q134 0 227 93t93 227q0 121-79.5 211.5T520-122Z" /></svg>
				</div>
			</div>
		`;

	document.body.insertBefore(div, document.body.firstChild);

	div.querySelector(".play-stop").addEventListener("click", () => {
		chrome.runtime.sendMessage({ message: "stopTimer" });
	});

	div.querySelector(".play-pause").addEventListener("click", ({ target }) => {
		chrome.runtime.sendMessage({ message: "toggleTimer" }, ({ isPaused }) => {
			if (isPaused) {
				target.style.backgroundColor = "#1ccf45";
				if (target.tagName === "IMG") {
					target.src = "./../assets/play-resume.svg";
				} else {
					target.querySelector("img").src = "./../assets/play-resume.svg";
				}
			} else {
				target.style.backgroundColor = "rgba(247, 213, 25, 0.9)";
				if (target.tagName === "IMG") {
					target.src = "./../assets/play-pause.svg";
				} else {
					target.querySelector("img").src = "./../assets/play-pause.svg";
				}
			}
		});
	});

	div.querySelector(".play-restart").addEventListener("click", () => {
		chrome.runtime.sendMessage({ message: "restartTimer" });
	});
}

function addTimer(data, main) {
	const { id, minutes, description, editing } = data;

	const div = document.createElement("div");
	div.setAttribute("class", "timer-container");
	if (editing) div.classList.add("editing");

	div.setAttribute("data-id", id);
	div.innerHTML = `
        <div class="feature-icon delete-timer">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
        </div>
        <div class="timer-info">
            <div class="timer-time">
                <p class="timer-value" contenteditable="${editing ? "true" : "false"}" title="${minutes} minutes">${minutes}
                </p><span contenteditable="false"> min</span>
            </div>
            <p class="timer-desc" contenteditable="${editing ? "true" : "false"}" title="${description}">${description}</p>
        </div>
        <div class="feature-icon edit-timer">
            <img src="./../assets/${editing ? "accept-edit" : "edit-timer"}.svg" alt="${editing ? "Accept" : "Edit"} timer" />
        </div>
    `;

	main.appendChild(div);

	// Timer
	div.querySelector(".timer-info").addEventListener("click", async () => {
		const { timers } = await storage.get("timers");
		const dataId = parseInt(div.getAttribute("data-id"));
		const index = timers.findIndex((timer) => timer.id === dataId);

		if (timers[index].editing) return;
		timers[index].playing = true;
		await storage.set({ timers });
		chrome.runtime.sendMessage({ message: "newTimer", minutes, description });
	});
	// Delete button
	div.querySelector(".delete-timer").addEventListener("click", async () => {
		const { timers } = await storage.get("timers");
		const id = parseInt(div.getAttribute("data-id"));
		const index = timers.findIndex((timer) => timer.id === id);
		timers.splice(index, 1);
		await storage.set({ timers });
	});
	// Edit
	div.querySelector(".timer-value").addEventListener("keydown", (event) => {
		if (event.code === "Enter" || event.key === "Enter" || event.keyCode === 13) {
			saveEdit(div);
		}
	});
	div.querySelector(".timer-desc").addEventListener("keydown", (event) => {
		if (event.code === "Enter" || event.key === "Enter" || event.keyCode === 13) {
			saveEdit(div);
		}
	});
	div.querySelector(".edit-timer").addEventListener("click", () => {
		saveEdit(div);
	});
}

async function saveEdit(div) {
	const { timers } = await storage.get("timers");
	const id = parseInt(div.getAttribute("data-id"));
	const index = timers.findIndex((timer) => timer.id === id);
	const isEditing = !timers[index].editing;
	timers[index].editing = isEditing;

	if (!isEditing) {
		const value = div.querySelector(".timer-value").textContent.trim();
		const isValidValue = /^[0-9.]+$/.test(value);
		const min = isValidValue ? parseFloat(value) : null;
		if (min !== null) {
			timers[index].minutes = min;
		}

		const desc = div.querySelector(".timer-desc").textContent;
		timers[index].description = desc;
	}

	await storage.set({ timers });
}

const DEFAULT = {
	timers: [
		{
			id: 0,
			minutes: 5,
			description: "",
			playing: false,
			editing: false,
		},
		{
			id: 1,
			minutes: 15,
			description: "For small tasks",
			playing: false,
			editing: false,
		},
		{
			id: 2,
			minutes: 30,
			description: "Take a break",
			playing: false,
			editing: false,
		},
		{
			id: 3,
			minutes: 60,
			description: "For long tasks",
			playing: false,
			editing: false,
		},
	],
};
