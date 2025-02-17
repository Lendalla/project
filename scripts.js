<script>
    const apiKey = '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'; // API key ของคุณ
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const mainTextElement = document.querySelector('.main-text');
    const chatInputArea = document.querySelector('.chat-input-area');
    const botInfoArea = document.querySelector('.bot-info-area');
    const headerTextElement = document.querySelector('.header-text');
    const geminiButton = document.getElementById('gemini-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const sendIcon = document.getElementById('send-icon');

    let currentModelVersion = "2o"; // Default version

    geminiButton.addEventListener('click', function(event) {
        dropdownMenu.classList.toggle('show');
        event.stopPropagation();
    });

    dropdownMenu.addEventListener('click', function(event) {
        if (event.target.classList.contains('dropdown-item')) {
            const selectedVersion = event.target.dataset.modelVersion;
            currentModelVersion = selectedVersion;
            dropdownMenu.classList.remove('show');
        }
    });

    document.addEventListener('click', function(event) {
        if (!geminiButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    sendIcon.addEventListener('click', sendMessage); // ตรวจสอบการคลิกที่ปุ่มส่งข้อความ

    userInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
            event.preventDefault();
        }
    });

    async function sendMessage() {
        const messageText = userInput.value;
        if (!messageText) return;

        addUserMessage(messageText);
        userInput.value = ''; // ล้างข้อความหลังจากส่ง

        if (mainTextElement) {
            mainTextElement.style.display = 'none';
        }
        if (chatMessages) {
            chatMessages.classList.remove('items-center', 'justify-center');
            chatMessages.classList.add('items-start', 'justify-start');
        }
        if (headerTextElement) {
            headerTextElement.classList.remove('text-center');
            headerTextElement.classList.add('text-left');
        }

        const botResponse = await getBotResponse(messageText);
        addBotMessage(botResponse);
    }

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.innerHTML = `<p>${message}</p>`;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message');

        // ตรวจสอบว่าข้อความมีโค้ดหรือไม่
        if (message.includes("```")) {
            const codeContent = extractCode(message);
            messageElement.innerHTML = ` 
                <div class="code-block">
                    <div class="flex justify-between items-center mb-2">
                        <h1 class="text-lg font-semibold text-gray-900"># ตัวอย่างโค้ด</h1>
                        <button class="copy-button text-gray-500 hover:text-gray-700" onclick="copyCode(this)">
                            <i class="fas fa-copy"></i> Copy code
                        </button>
                    </div>
                    <pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code class="text-sm">${codeContent}</code>
                    </pre>
                </div>
            `;
        } else {
            messageElement.innerHTML = `<p>${message}</p>`;
        }

        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function extractCode(message) {
        const codeRegex = /```[\s\S]*?```/g;
        const matches = message.match(codeRegex);
        if (matches) {
            return matches[0].replace(/```/g, '').trim();
        }
        return message;
    }

    function copyCode(button) {
        const codeElement = button.closest('.code-block').querySelector('code');
        const textToCopy = codeElement.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy"></i> Copy code';
            }, 2000);
        });
    }

    async function getBotResponse(message) {
        const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        const modelName = "qwen-2.5-32b";

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Groq-Api-Key': apiKey
                },
                body: JSON.stringify({
                    "messages": [{"role": "user", "content": message}],
                    "model": modelName,
                    "temperature": 0.6,
                    "max_tokens": 4096,
                    "top_p": 0.95,
                    "stream": false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            const botReply = responseData.choices[0].message.content;
            return botReply || "เกิดข้อผิดพลาดในการรับข้อความตอบกลับ";
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการเรียก API:', error);
            return "ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้";
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
</script>
