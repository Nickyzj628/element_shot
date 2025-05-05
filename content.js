let isSelecting = false;
let target = null;

const highlight = (element) => {
    if (target) {
        target.classList.remove("highlight");
    }
    target = element;
    target.classList.add("highlight");
};

const shot = (element) => {
    const rect = element.getBoundingClientRect();
    chrome.runtime.sendMessage({
        action: "shot",
        data: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        }
    });
};

document.addEventListener("mouseover", (e) => {
    if (!isSelecting) return;
    e.preventDefault();
    e.stopPropagation();
    const element = e.target;
    highlight(element);
});

document.addEventListener("click", (e) => {
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    target.classList.remove("highlight");
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            shot(target);
            // 退出选择模式
            isSelecting = false;
            target = null;
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "select": {
            isSelecting = true;
            break;
        }
    }
});