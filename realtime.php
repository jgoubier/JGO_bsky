<!DOCTYPE html>
<html lang="en">
<head>
        <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DSLJXMQC5K"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-DSLJXMQC5K');
    </script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Realtime table</title>
    <style>
        body {
            font-family: Tahoma, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 3px;
            color: black;
            text-align: center;        
        }

        .header-text {
            font-size: 16px;
            font-weight: normal;
            text-align: center;
            color: white;
            margin: 5px 0 10px 0; /* Adds 20px space above and below */
        }

        .container {
            max-width: 350px;
            margin: auto;
            padding: 2px;
        }

        table {
            width: 100%;
            max-width: 350px;
            border-collapse: collapse;
            font-size: 13px;
            border-radius: 5px;
            overflow: hidden;
            margin: auto; /* Centers the table */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Adds subtle shadow */
        }

        th, td {
            padding: 2px;
            border: none;
        }

        th {
            background: #0056b3;
            color: white;
            padding: 10px;
            text-align: left;
            height: 60px;
        }

        tr:nth-child(even) {
            background: #f0f0f0;
        }

        tr:nth-child(odd) {
            background: white;
        }

        tr:hover {
            background: rgb(222, 222, 222);
        }

        td {
            padding: 2px 10px;
            font-size: 13px;
            height: 25px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        td.handle {
            text-align: left;
            width: 320px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        td.time {
            text-align: right;
            width: 80px;
            color: black; /* Ensures time text is black */
        }

        .vu-meter-container,
        .socket-status {
            display: flex;
            align-items: center;
            gap: 5px;
            margin: 6px 0;
        }

        .vu-meter {
            display: flex;
            gap: 1px;
        }

        .vu-led {
            width: 3px;
            height: 10px;
            background: gray;
            border-radius: 2px;
        }

        .socket-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: yellow;
        }

        .growth-rate-container {
            margin-top: 5px;
            font-size: 12px;
        }

        .socket-status span {
            font-weight: normal;
        }

        .growth-rate-container strong {
            font-weight: bold;
        }

        .growth-rate-container span {
            font-weight: normal;
        }
    
    </style>
</head>
<body>

    <div class="header-text">Real-time new or updated users</div>

    <div class="container">
        <table>
            <thead>
                <tr>
                    <th style="width: 85%;">
                        <div class="socket-status">
                            <div class="socket-dot" id="socket-dot"></div>
                            <span id="socket-status">Connecting...</span>
                        </div>
                        <div class="vu-meter-container">
                            <div class="vu-meter" id="vu-meter"></div>
                        </div>
                        <div class="growth-rate-container">
                            <strong>Growth Rate:</strong> <span id="growth-rate">Loading...</span> <span>Users per sec</span>
                        </div>
                    </th>
                    <th style="width: 15%; text-align: center;">
                        <img src="./@_icon.png" width="100px" alt="Icon">
                    </th>
                </tr>
            </thead>
            <tbody id="table-body"></tbody>
        </table>
    </div>

<script>
// Determine WebSocket protocol (ws:// or wss://) based on the page's protocol
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socketUrl = `${protocol}://bskycheck.com:${protocol === "wss" ? "3001" : "3000"}`;
const socket = new WebSocket(socketUrl);

const socketDot = document.getElementById("socket-dot");
const socketStatus = document.getElementById("socket-status");
const vuMeter = document.getElementById("vu-meter");
const growthRateElement = document.getElementById("growth-rate");
const tableBody = document.getElementById("table-body");

// Initialize VU Meter (50 LEDs)
for (let i = 0; i < 50; i++) {
    const led = document.createElement("div");
    led.className = "vu-led";
    vuMeter.appendChild(led);
}

// WebSocket Events
socket.onopen = () => {
    socketDot.style.background = "lightgreen";
    socketStatus.textContent = "Connected to Bluesky";
};

socket.onclose = () => {
    socketDot.style.background = "yellow";
    socketStatus.textContent = "Connecting...";
};

// Time Formatting Function
function formatTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

// WebSocket Message Handling
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "update") {
        const now = Math.floor(Date.now() / 1000);
        const timestamps = data.entries.map(entry => Math.floor(new Date(entry.time_us).getTime() / 1000));

        // Calculate Growth Rate
        const timeSpan = now - timestamps[timestamps.length - 1] || 1; // Avoid division by zero
        const growthRate = Math.min(5, 10 / timeSpan); // Cap at 5 entries/sec
        growthRateElement.textContent = growthRate.toFixed(2);

        // Update VU Meter LEDs
        const activeLEDs = Math.round((growthRate / 5) * 50);
        const leds = vuMeter.children;
        for (let i = 0; i < 50; i++) {
            leds[i].style.background = i < activeLEDs
                ? `rgb(${Math.min(255, i * 5)}, ${Math.max(0, 255 - i * 5)}, 0)`
                : "gray";
        }

        // Update Table (13 Rows)
        tableBody.innerHTML = "";
        data.entries.slice(0, 13).forEach((entry, index) => {
            const timestamp = timestamps[index];
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="handle ${entry.handle.includes("bsky.social") ? "" : "highlight-red"}">
                    <a href="https://bsky.app/profile/${entry.handle}" target="_blank">
                        @${entry.handle.length > 45 ? entry.handle.substring(0, 42) + '...' : entry.handle}
                    </a>
                </td>
                <td class="time" data-time="${timestamp}">${formatTimeAgo(timestamp)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
};

// Update Time Ago Every Second
setInterval(() => {
    document.querySelectorAll("[data-time]").forEach(el => {
        el.textContent = formatTimeAgo(el.getAttribute("data-time"));
    });
}, 1000);
</script>

</body>
</html>