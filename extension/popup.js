
document.getElementById("scanBtn").addEventListener("click", async () => {
    const status = document.getElementById("status");
    const result = document.getElementById("result");

    status.textContent = "Scanning...";
    result.textContent = "";

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        const [page] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.innerText
        });

        const response = await fetch("http://127.0.0.1:8000/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: page.result })
        });

        if (!response.ok) throw new Error("Backend error");

        const data = await response.json();
        status.textContent = "Scan complete!";
        result.textContent = data.masked_text.substring(0, 1500);

    } catch (error) {
        status.textContent = "Scan failed. Check backend and permissions.";
        console.error(error);
    }
});
