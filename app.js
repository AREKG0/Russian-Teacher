document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('english-input');
    const translateBtn = document.getElementById('translate-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    const placeholderState = document.getElementById('placeholder');
    const loadingState = document.getElementById('loading-state');
    const resultContainer = document.getElementById('result-container');
    
    const russianOutput = document.getElementById('russian-output');
    const pronunciationOutput = document.getElementById('pronunciation-output');
    
    const copyBtns = document.querySelectorAll('.copy-btn');
    const listenBtn = document.getElementById('listen-btn');
    const toast = document.getElementById('toast');

    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    let debounceTimer;

    // Transliteration mapping (Cyrillic to Latin/English)
    const transliterationMap = {
        'А': 'A', 'а': 'a',
        'Б': 'B', 'б': 'b',
        'В': 'V', 'в': 'v',
        'Г': 'G', 'г': 'g',
        'Д': 'D', 'д': 'd',
        'Е': 'Ye', 'е': 'ye',
        'Ё': 'Yo', 'ё': 'yo',
        'Ж': 'Zh', 'ж': 'zh',
        'З': 'Z', 'з': 'z',
        'И': 'I', 'и': 'i',
        'Й': 'Y', 'й': 'y',
        'К': 'K', 'к': 'k',
        'Л': 'L', 'л': 'l',
        'М': 'M', 'м': 'm',
        'Н': 'N', 'н': 'n',
        'О': 'O', 'о': 'o',
        'П': 'P', 'п': 'p',
        'Р': 'R', 'р': 'r',
        'С': 'S', 'с': 's',
        'Т': 'T', 'т': 't',
        'У': 'U', 'у': 'u',
        'Ф': 'F', 'ф': 'f',
        'Х': 'Kh', 'х': 'kh',
        'Ц': 'Ts', 'ц': 'ts',
        'Ч': 'Ch', 'ч': 'ch',
        'Ш': 'Sh', 'ш': 'sh',
        'Щ': 'Shch', 'щ': 'shch',
        'Ъ': '', 'ъ': '',
        'Ы': 'Y', 'ы': 'y',
        'Ь': "'", 'ь': "'",
        'Э': 'E', 'э': 'e',
        'Ю': 'Yu', 'ю': 'yu',
        'Я': 'Ya', 'я': 'ya'
    };

    function transliterate(text) {
        return text.split('').map(char => transliterationMap[char] || char).join('');
    }

    function showState(state) {
        placeholderState.classList.add('hidden');
        loadingState.classList.add('hidden');
        resultContainer.classList.add('hidden');

        if (state === 'placeholder') placeholderState.classList.remove('hidden');
        if (state === 'loading') loadingState.classList.remove('hidden');
        if (state === 'result') resultContainer.classList.remove('hidden');
    }

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // --- History Logic ---
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('russianTeacherHistory') || '[]');
        if (history.length === 0) {
            historySection.classList.add('hidden');
            return;
        }

        historySection.classList.remove('hidden');
        historyList.innerHTML = '';
        
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-item-en">${item.english}</div>
                <div class="history-item-ru">${item.russian}</div>
            `;
            // Click to restore
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                inputArea.value = item.english;
                russianOutput.textContent = item.russian;
                pronunciationOutput.textContent = item.pronunciation;
                showState('result');
            });
            historyList.appendChild(div);
        });
    }

    function saveToHistory(english, russian, pronunciation) {
        let history = JSON.parse(localStorage.getItem('russianTeacherHistory') || '[]');
        // Avoid consecutive duplicates
        if (history.length > 0 && history[0].english.toLowerCase() === english.toLowerCase()) {
            return;
        }
        
        history.unshift({ english, russian, pronunciation });
        // Keep only last 10
        if (history.length > 10) history = history.slice(0, 10);
        
        localStorage.setItem('russianTeacherHistory', JSON.stringify(history));
        loadHistory();
    }

    // --- Translation Logic ---
    async function translateText(isAuto = false) {
        const text = inputArea.value.trim();
        if (!text) {
            showState('placeholder');
            return;
        }

        showState('loading');
        
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(text)}`);
            
            if (!response.ok) throw new Error('Translation failed');
            
            const data = await response.json();
            let translatedText = '';
            if (data && data[0]) {
                data[0].forEach(item => {
                    if (item[0]) translatedText += item[0];
                });
            }
            
            if (!translatedText) throw new Error('No translation returned');

            const pronunciation = transliterate(translatedText);

            russianOutput.textContent = translatedText;
            pronunciationOutput.textContent = pronunciation;
            
            showState('result');

            // Only save to history if it was explicitly submitted or a significant pause
            saveToHistory(text, translatedText, pronunciation);

        } catch (error) {
            console.error(error);
            russianOutput.innerHTML = `<span class="error-text">Failed to translate. Please try again.</span>`;
            pronunciationOutput.textContent = '-';
            showState('result');
        }
    }

    // Trigger voice loading on startup
    window.speechSynthesis.getVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    // --- Text to Speech Logic ---
    function speakRussian() {
        const text = russianOutput.textContent;
        if (!text || text.includes('Failed to translate')) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU'; // Set language to Russian
        utterance.rate = 0.9;     // Slightly slower for learning
        
        // Explicitly try to find a Russian voice
        const voices = window.speechSynthesis.getVoices();
        const ruVoice = voices.find(voice => voice.lang.toLowerCase().includes('ru'));
        if (ruVoice) {
            utterance.voice = ruVoice;
        }
        
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        window.speechSynthesis.speak(utterance);
    }

    // --- Event Listeners ---
    
    // Auto-translate (Debounce)
    inputArea.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const text = inputArea.value.trim();
        
        if (!text) {
            showState('placeholder');
            return;
        }
        
        debounceTimer = setTimeout(() => {
            translateText(true);
        }, 800); // 800ms debounce
    });

    translateBtn.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        translateText();
    });

    inputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            clearTimeout(debounceTimer);
            translateText();
        }
    });

    clearBtn.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        inputArea.value = '';
        inputArea.focus();
        showState('placeholder');
    });

    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const textToCopy = document.getElementById(targetId).textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast();
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    });

    if (listenBtn) {
        listenBtn.addEventListener('click', speakRussian);
    }

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('russianTeacherHistory');
        loadHistory();
    });

    // Initialize
    loadHistory();
    inputArea.focus();
});
