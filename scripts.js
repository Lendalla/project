let typingIndicator;
let codeVisible = false;
let darkMode = false; // สถานะของโหมดมืด
let messageHistory = []; // เก็บประวัติข้อความ

// ฟังก์ชันสำหรับส่งข้อความ
async function sendMessage() {
    const userMessage = document.getElementById('user-message').value.trim();
    if (!userMessage) return;

    displayMessage(userMessage, 'user');
    document.getElementById('user-message').value = '';
    document.getElementById('user-message').style.height = '30px'; // Reset height to initial size

    messageHistory.push({ role: 'user', content: userMessage }); // เก็บข้อความในประวัติ

    const sendButton = document.getElementById('send-button');
    const sendIcon = sendButton.querySelector('img');
    sendButton.classList.add('loading');
    sendIcon.src = 'https://cdn-icons-png.flaticon.com/128/7794/7794282.png';

    displayTypingIndicator();

    try {
        const model = document.querySelector('#model-options').value;
        let botResponse;

        if (model === 'typhoon-v1.5-instruct-fc' || model === 'openthaigpt1.5-7b-instruct') {
            botResponse = 'ยังไม่เปิดให้ใช้งาน จะเปิดให้ใช้งานในอีกล้านปีข้างหน้า';
        } else {
            const endpoint = 'https://api.opentyphoon.ai/v1/chat/completions';
            const headers = {
                Authorization: 'Bearer sk-frn8Q6cNenIlNT0oSmOJ1HVnSIrnjB3c6XKv12xeoSMNFx45'
            };
            const data = {
                model: model,
                max_tokens: 512,
                messages: [
                    { role: "system", content: model === 'typhoon-v1.5-instruct-fc' ? "You are a helpful assistant named ArtX." : "You are Gen, a large language model trained by SCB And Padlojh. Your goal is to assist with helpful, informative, and friendly responses. Always adapt to the user's tone, be conversational, and provide clear and concise answers. Avoid giving medical, legal, or financial advice." },
                    ...messageHistory // ส่งประวัติข้อความไปด้วย
                ],
                temperature: model === 'typhoon-v1.5-instruct-fc' ? 0.2 : 0.4,
                top_p: 0.9,
                top_k: 0,
                repetition_penalty: model === 'typhoon-v1.5-instruct-fc' ? 1.1 : 1.05,
                min_p: 0.05
            };

            const response = await axios.post(endpoint, data, { headers });
            botResponse = response.data.choices[0].message.content;
        }

        displayMessage(botResponse, 'bot');
        messageHistory.push({ role: 'bot', content: botResponse }); // เก็บข้อความในประวัติ
        resetScroll();
    } catch (error) {
        console.error('Error fetching data from Chatai:', error);
        if (error.message === 'Failed to fetch') {
            displayMessage('ขอโทษ, เกิดข้อผิดพลาดในการส่งข้อความ.', 'bot');
        } else if (error.response) {
            console.error('Response data:', error.response.data);
            if (error.response.status === 404 && error.response.data.detail === 'Not Found') {
                displayMessage('ขอโทษ, ยังไม่เปิดให้ใช้งาน.', 'bot');
            } else {
                displayMessage('ขอโทษ, ข้อความของคุณไม่ถูกต้องหรือไม่สามารถประมวลผลได้.', 'bot');
            }
        } else {
            displayMessage('ขอโทษ, เกิดข้อผิดพลาดในการส่งข้อความ.', 'bot');
        }
    } finally {
        sendButton.classList.remove('loading');
        sendIcon.src = 'https://cdn-icons-png.flaticon.com/128/318/318476.png';
        hideTypingIndicator();
    }
}

// ฟังก์ชันสำหรับเลือก Model
function selectModel() {
    const selectedModel = document.querySelector('#model-options').value;
    console.log("Selected model: " + selectedModel);
    newChat(); // Start a new chat when a new model is selected
}

// ฟังก์ชันสำหรับตรวจสอบว่าเป็นโค้ดหรือไม่
function isCode(response) {
    return response.includes('```');
}

// ฟังก์ชันสำหรับแสดงโค้ดด้วย markdown (ลบ icon และ footer เดิม)
function displayCode(codeContent) {
    const chatBox = document.getElementById('chat-box');
    const codeDiv = document.createElement('div');
    codeDiv.className = 'message bot-message';
    
    const pre = document.createElement('pre');
    pre.className = 'markdown-code';
    const codeElement = document.createElement('code');
    // ใช้ textContent เพื่อรักษารูปแบบและไม่ให้ render HTML ภายใน
    codeElement.textContent = codeContent;
    
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/128/5859/5859288.png" alt="Copy Icon" />';
    copyButton.onclick = () => {
        copyToClipboard(codeContent);
        copyButton.querySelector('img').src = 'https://cdn-icons-png.flaticon.com/128/6974/6974447.png';
    };

    pre.appendChild(codeElement);
    pre.appendChild(copyButton); // Move the copy button inside the code canvas at the bottom right corner
    codeDiv.appendChild(pre);
    chatBox.appendChild(codeDiv);
    resetScroll(); // Ensure the chat box scrolls to the bottom
}

// ฟังก์ชันสำหรับคัดลอกโค้ดไปยังคลิปบอร์ด
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// ฟังก์ชันสำหรับตรวจสอบการกด Enter
function checkEnter(event) {
    const textarea = event.target;
    if (event.key === 'Enter' && !event.shiftKey) {
        sendMessage();
        event.preventDefault();
    } else {
        autoResize(textarea);
    }
}

// ฟังก์ชันสำหรับปรับขนาด textarea อัตโนมัติ
function autoResize(textarea) {
    textarea.style.height = 'auto'; // Reset height to auto
    if (textarea.scrollHeight > textarea.clientHeight) {
        textarea.style.height = `${textarea.scrollHeight}px`; // Adjust height based on content
    }
}

// ฟังก์ชันสำหรับแสดง Indicator การพิมพ์
function displayTypingIndicator() {
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot-message typing-indicator';
    typingIndicator.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/128/319/319873.png" alt="Typing Indicator" />';
    document.getElementById('chat-box').appendChild(typingIndicator);
    
    setTimeout(() => {
        typingIndicator.style.opacity = 1;
    }, 10);
    resetScroll(); // Ensure the chat box scrolls to the bottom
}

// ฟังก์ชันสำหรับซ่อน Indicator การพิมพ์
function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.opacity = 0;
        setTimeout(() => {
            typingIndicator.remove();
        }, 500);
    }
}

// ฟังก์ชันสำหรับแสดงข้อความ
function displayMessage(message, sender) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const icon = sender === 'user'
        ? '<img class="icon" src="https://i.postimg.cc/yNP1Z2wS/user.jpg" alt="User Icon" />' 
        : '<img class="icon" src="https://cdn-icons-png.flaticon.com/128/686/686700.png" alt="Typing Icon" />';

    const emoji = '😊'; 
    const formattedMessage = message.replace(/\n/g, ' '); // แปลงการขึ้นบรรทัดใหม่เป็น <br>
    
    if (isCode(message)) {
        // ดึงเฉพาะเนื้อหาของโค้ดที่อยู่ภายใน ``` ```
        const match = message.match(/```([\s\S]*?)```/);
        if (match) {
            const codeContent = match[1];
            // ดึงข้อความที่ไม่ใช่โค้ด (ถ้ามี)
            const textContent = message.split(/```[\s\S]*?```/)[0].trim();
            if (textContent) {
                messageDiv.innerHTML = `<div class="message-content">${textContent} ${emoji}</div>` + icon;
                chatBox.appendChild(messageDiv);
            }
            displayCode(codeContent);
        } else {
            // If no code block is found, display the message as usual
            messageDiv.innerHTML = icon + `<div class="message-content">${formattedMessage}</div>`;
            chatBox.appendChild(messageDiv);
        }
    } else {
        if (sender === 'user') {
            messageDiv.innerHTML = `<div class="message-content">${formattedMessage}</div>` + icon; 
            chatBox.appendChild(messageDiv);
        } else {
            messageDiv.innerHTML = icon + `<div class="message-content typing-effect"></div>`; 
            chatBox.appendChild(messageDiv);
            typeWriterEffect(messageDiv.querySelector('.message-content'), formattedMessage + ' ' + emoji);
        }
    }
    
    setTimeout(() => { 
        messageDiv.style.opacity = 1;
        resetScroll(); // Ensure the chat box scrolls to the bottom
    }, 10);
}

// ฟังก์ชันสำหรับ effect การพิมพ์ทีละตัว
function typeWriterEffect(element, text, index = 0) {
    if (index < text.length) {
        element.innerHTML += text.charAt(index);
        setTimeout(() => typeWriterEffect(element, text, index + 1), 5); // เปลี่ยนความเร็วเป็น 0.3 วินาที (30 มิลลิวินาที)
    } else {
        element.classList.remove('typing-effect');
        element.classList.add('fade-in');
        setTimeout(() => {
            element.classList.add('show');
            element.parentElement.querySelector('.icon').src = 'https://cdn-icons-png.flaticon.com/128/1694/1694153.png';
            element.parentElement.querySelector('.icon').classList.remove('icon-hidden');
            element.parentElement.querySelector('.icon').classList.add('icon-visible');
            resetScroll(); // Ensure the chat box scrolls to the bottom
        }, 10);
    }
}

// ฟังก์ชันสำหรับรีเซ็ตการเลื่อน
function resetScroll() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ฟังก์ชันสำหรับเปิด/ปิดโหมดมืด
function toggleMode() {
    darkMode = !darkMode;
    const body = document.body;
    const modeIcon = document.getElementById('mode-icon');

    if (darkMode) {
        body.classList.add('dark-mode');
        modeIcon.src = 'https://cdn-icons-png.flaticon.com/128/12301/12301305.png'; 
    } else {
        body.classList.remove('dark-mode');
        modeIcon.src = 'https://cdn-icons-png.flaticon.com/128/1687/1687788.png'; 
    }
}

// ฟังก์ชันสำหรับเริ่มการสนทนาใหม่
function newChat() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    messageHistory = []; // รีเซ็ตประวัติข้อความ
    resetScroll(); // Ensure the chat box scrolls to the bottom
}

// ฟังก์ชันสำหรับปรับขนาด canvas
function resizeCanvas() {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.style.height = `${window.innerHeight}px`;
    chatContainer.style.width = `${window.innerWidth}px`;
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

const textarea = document.getElementById('auto-resize-textarea');

textarea.addEventListener('input', autoResize);

function autoResize() {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    const containerHeight = textarea.parentElement.clientHeight;
    const textareaHeight = textarea.scrollHeight;
    const bottomOffset = containerHeight - textareaHeight;
    textarea.style.bottom = `${bottomOffset}px`;
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

const userMessage = document.getElementById('user-message');
userMessage.addEventListener('focus', scrollToBottom);

// ฟังก์ชันสำหรับรีเซ็ตขนาด textarea เมื่อสูญเสียโฟกัส
document.getElementById('user-message').addEventListener('blur', function() {
    this.style.height = '30px'; // Reset height to initial size
});
