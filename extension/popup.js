let currentTabId;

document.getElementById("scanBtn").addEventListener("click", async () => {
    const status = document.getElementById("status");
    const result = document.getElementById("result");
    const permission = document.getElementById("permission");

    permission.style.display = "none";
    status.textContent = "Scanning...";
    result.textContent = "";

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        currentTabId = tab.id;

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

        if (data.masked_text === page.result) {
            status.textContent = "No sensitive information detected!";
            return;
        }

        status.textContent = "Sensitive information detected!";
        result.textContent = data.masked_text.substring(0, 1000);

        permission.style.display = "block";

    } catch (error) {
        status.textContent = "Scan failed. Check backend.";
        console.error(error);
    }
});

document.getElementById("yesBtn").addEventListener("click", async () => {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            func: () => {
                const patterns = [
                    [/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL]"],
                    [/(?<!\d)(?:\+91[- ]?)?[6-9]\d{4}[ -]?\d{5}(?!\d)/g, "[PHONE]"],
                    [/(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)/g, "[AADHAAR]"],
                    [/\b[A-Z]{5}\d{4}[A-Z]\b/gi, "[PAN]"],
                    [/(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g, "[CARD NUMBER]"]
                ];

                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT
                );

                let node;

                while (node = walker.nextNode()) {
                    if (node.parentElement.closest("script, style, noscript")) {
                        continue;
                    }

                    patterns.forEach(([regex, replacement]) => {
                        node.nodeValue = node.nodeValue.replace(regex, replacement);
                    });
                }
            }
        });

        document.getElementById("status").textContent =
            "Sensitive information masked successfully!";

        document.getElementById("permission").style.display = "none";

    } catch (error) {
        document.getElementById("status").textContent = "Masking failed.";
        console.error(error);
    }
});

document.getElementById("noBtn").addEventListener("click", () => {
    document.getElementById("permission").style.display = "none";
    document.getElementById("status").textContent =
        "Masking skipped. No changes made.";
});