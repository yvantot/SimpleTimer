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
	const data = await storage.get("timers");

	// If user doesn't have a timer, fill with default
	if (Object.keys(data).length === 0) {
	} else {
	}
}

const addTimer = document.getElementById("add-timer");
const mainBody = document.querySelector("main");

addTimer.addEventListener("click", () => {
	const div = document.createElement("div");
	div.setAttribute("class", "timer-container");
	div.innerHTML = `
        <div class="feature-icon delete-timer">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
        </div>
        <div class="timer-info">
            <p class="timer-value" contenteditable="false">40 min</p>
            <p class="timer-desc" contenteditable="false" title="show all value">Work</p>
        </div>
        <div class="feature-icon edit-timer">
            <img src="./../assets/edit-timer.svg" alt="Edit timer" />
        </div>
    `;
	mainBody.appendChild(div);
});
