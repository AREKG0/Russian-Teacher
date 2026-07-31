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
    const toast = document.getElementById('toast');

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

    async function translateText() {
        const text = inputArea.value.trim();
        if (!text) return;

        showState('loading');
        
        try {
            // MyMemory API
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ru`);
            
            if (!response.ok) throw new Error('Translation failed');
            
            const data = await response.json();
            const translatedText = data.responseData.translatedText;
            
            if (!translatedText) throw new Error('No translation returned');

            // Apply transliteration
            const pronunciation = transliterate(translatedText);

            // Update UI
            russianOutput.textContent = translatedText;
            pronunciationOutput.textContent = pronunciation;
            
            showState('result');

        } catch (error) {
            console.error(error);
            russianOutput.innerHTML = `<span class="error-text">Failed to translate. Please try again.</span>`;
            pronunciationOutput.textContent = '-';
            showState('result');
        }
    }

    // Event Listeners
    translateBtn.addEventListener('click', translateText);

    inputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            translateText();
        }
    });

    clearBtn.addEventListener('click', () => {
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

    // Initial focus
    inputArea.focus();
});
