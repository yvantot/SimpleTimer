const storage = chrome.storage.local;

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

async function init() {
	// Updates UI
	listenStorage();

	// Add listeners
	addListeners();

	const { timers } = await storage.get("timers");

	// If user doesn't have a timer, fill with default
	if (timers?.length === 0 || !timers) {
		await storage.set(DEFAULT);
	} else {
		const hasPlaying = timers.findIndex((timer) => timer.playing === true);
		if (hasPlaying === -1) {
			addTimers(timers);
		} else {
			document.querySelector("main").innerHTML = "";
			addPlaybar(timers[hasPlaying]);
		}
	}
}

function addListeners() {
	document.getElementById("add-timer").addEventListener("click", async () => {
		const { timers } = await storage.get("timers");
		if (timers.length === 0) {
			const data = {
				id: 0,
				minutes: 5,
				description: "",
				playing: false,
				editing: false,
			};
			timers.push(data);
		} else {
			const lastTimer = timers[timers.length - 1];
			const id = lastTimer.id + 1;
			const minutes = lastTimer.minutes + 10;
			const data = {
				id,
				minutes,
				description: "",
				playing: false,
				editing: false,
			};
			timers.push(data);
		}

		await storage.set({ timers });
	});
}

function listenStorage() {
	chrome.storage.onChanged.addListener(async (changes) => {
		const { timers } = changes;
		const hasPlaying = timers.newValue.findIndex((timer) => timer.playing === true);

		if (hasPlaying === -1) {
			// Nothing is playing
			addTimers(timers.newValue);
		} else {
			// Timer is playing
			document.querySelector("main").innerHTML = "";
			addPlaybar(timers.newValue[hasPlaying]);
		}
	});
}

function addTimers(timers) {
	const mainBody = document.querySelector("main");
	if (timers.length > 0) {
		mainBody.innerHTML = "";
		timers.forEach((timer) => {
			addTimer(timer);
		});
	} else if (timers.length === 0) mainBody.innerHTML = "";
}

function addPlaybar(timer) {
	const { minutes, description } = timer;
	const playDiv = document.createElement("div");
	playDiv.setAttribute("class", "play-container");
	playDiv.innerHTML = `        
			<div class="play-value">
				<div class="play-bar-value">${minutes}</div>
				<span> min</span>
			</div>
			<div class="play-desc">${description}</div>
			<div class="play-bar" style="animation: timerBar ${minutes * 60}s forwards;"></div>
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

	const body = document.body;
	body.insertBefore(playDiv, body.firstChild);
}

function addTimer(data) {
	const { id, minutes, description, editing } = data;
	const mainBody = document.querySelector("main");

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

	mainBody.appendChild(div);

	// Timer
	div.querySelector(".timer-info").addEventListener("click", async () => {
		const { timers } = await storage.get("timers");
		const dataId = parseInt(div.getAttribute("data-id"));
		const index = timers.findIndex((timer) => timer.id === dataId);

		if (timers[index].editing) return;
		timers[index].playing = true;
		await storage.set({ timers });
		chrome.runtime.sendMessage({ message: "startTimer", id, minutes, description, editing });
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

// Start
init();
