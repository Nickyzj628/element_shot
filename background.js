chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "select" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== "shot") return;
    const { x, y, width, height } = message.data;
    chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
        // 将 data URL 转换为 Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        // 创建 OffscreenCanvas 处理图像裁剪
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);

        // 转换为 data URL
        const clippedBlob = await canvas.convertToBlob({ type: "image/png" });
        const clippedDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(clippedBlob);
        });

        // 注入脚本将图像写入剪贴板
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: async (dataUrl) => {
                // 将 data URL 转换为 Blob
                const response = await fetch(dataUrl);
                const blob = await response.blob();

                // 将 Blob 写入剪贴板
                const data = [new ClipboardItem({ [blob.type]: blob })]
                await navigator.clipboard.write(data);
            },
            args: [clippedDataUrl]
        });
    });
});