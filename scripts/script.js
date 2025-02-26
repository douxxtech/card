const userID = "1117912749146656790"; 

const elements = {
	statusBox: document.querySelector(".status"),
	statusImage: document.getElementById("status-image"),
	displayName: document.querySelector(".display-name"),
	username: document.querySelector(".username"),
	customStatus: document.querySelector(".custom-status"),
	customStatusText: document.querySelector(".custom-status-text"),
	customStatusEmoji: document.getElementById("custom-status-emoji"),
};

function startWebSocket() {
	const ws = new WebSocket("wss://api.lanyard.rest/socket");

	ws.onopen = () => {
		ws.send(
			JSON.stringify({
				op: 2,
				d: {
					subscribe_to_id: userID,
				},
			})
		);
	};

	ws.onmessage = (event) => {
		const { t, d } = JSON.parse(event.data);
		if (t === "INIT_STATE" || t === "PRESENCE_UPDATE") {
			updateStatus(d);
		}
	};

	ws.onerror = (error) => {
		console.error("WebSocket error:", error);
		ws.close();
	};

	ws.onclose = () => {
		console.log("WebSocket closed, try connecting again...");
		setTimeout(startWebSocket, 1000); 
	};
}

function updateStatus(lanyardData) {
	const { discord_status, activities, discord_user } = lanyardData;

	elements.displayName.innerHTML = discord_user.display_name;
	elements.username.innerHTML = discord_user.username;

	let imagePath;
	let label;

	switch (discord_status) {
		case "online":
			imagePath = "./public/status/online.svg";
			label = "Online";
			break;
		case "idle":
			imagePath = "./public/status/idle.svg";
			label = "Idle / AFK";
			break;
		case "dnd":
			imagePath = "./public/status/dnd.svg";
			label = "Do Not Disturb";
			break;
		case "offline":
			imagePath = "./public/status/offline.svg";
			label = "Offline";
			break;
		default:
			imagePath = "./public/status/idle.svg";
			label = "Unknown";
			break;
	}

	const isStreaming = activities.some(
		(activity) =>
			activity.type === 1 &&
			(activity.url.includes("twitch.tv") ||
				activity.url.includes("youtube.com"))
	);

	if (isStreaming) {
		imagePath = "./public/status/streaming.svg";
		label = "Streaming";
	}

	elements.statusImage.src = imagePath;
	elements.statusBox.setAttribute("aria-label", label);

	if (activities[0]?.state) {
		elements.customStatusText.innerHTML = activities[0].state;
	} else {
		elements.customStatusText.innerHTML = "Not doing anything!";
	}

	const emoji = activities[0]?.emoji;
	if (emoji?.id) {
		elements.customStatusEmoji.src = `https://cdn.discordapp.com/emojis/${emoji.id}?format=webp&size=24&quality=lossless`;
	} else if (emoji?.name) {
		elements.customStatusEmoji.src = "https://cdn.discordapp.com/emojis/1295176506586169456.webp?size=96&quality=lossless";
	} else {
		elements.customStatusEmoji.style.display = "none";
	}
	if (!activities[0]?.state && !emoji) {
		elements.customStatus.style.display = "none";
	} else {
		elements.customStatus.style.display = "flex";
	}
}
startWebSocket();
