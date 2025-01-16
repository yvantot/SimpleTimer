const storage = chrome.storage.local;
const DEFAULT = {
	timers: [
		{
			id: 0,
			minutes: 5,
			description: "",
			editing: false,
		},
		{
			id: 1,
			minutes: 15,
			description: "For small tasks",
			editing: false,
		},
		{
			id: 2,
			minutes: 30,
			description: "Take a break",
			editing: false,
		},
		{
			id: 3,
			minutes: 60,
			description: "For long tasks",
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
		addTimers(timers);
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
				editing: false,
			};
			timers.push(data);
		}

		await storage.set({ timers });
	});
}

function listenStorage() {
	chrome.storage.onChanged.addListener(async () => {
		const { timers } = await storage.get("timers");
		addTimers(timers);
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
