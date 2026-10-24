async function scanCurrentPage() {
    const pageText = document.body.innerText;

    try {
        const response = await fetch("http://127.0.0.1:8000/scan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: pageText })
        });

        const data = await response.json();

        alert("Scan complete!\n\nMasked Preview:\n" + data.masked_text.substring(0, 1000));

    } catch (error) {
        alert("Backend connect nahi hua. Check karo server running hai ya nahi.");
    }
}

scanCurrentPage();