// ===== Application State =====
const AppState = {
    bill: {
        id: null,
        customer: { name: '', phone: '', address: '', houseNumber: '' },
        floors: [],
        rates: { floor: 0, wall: 0, skirting: 0, hole: 0 },
        extras: { skirting: { enabled: false, length: 0 }, holes: { enabled: false, count: 0 } },
        minusArea: 0,
        createdAt: null,
        updatedAt: null
    },
    currentStep: 'welcome',
    currentFloorIndex: -1,
    currentRoomIndex: -1,   // FIXED: keep here, not on bill
    pendingConfirm: null,
    language: 'hi',
    voiceOutputEnabled: true,
    recognition: null,
    isRecording: false,
    voiceTranscriptBuffer: ''
};

// Prevent duplicate question showing
let lastShownQuestion = null;

// ===== Question Flow Definitions =====
const QuestionFlow = {
    welcome: { next: 'customerName' },
    customerName: {
        question: { en: "Customer name?", hi: "Customer ka naam kya hai?" },
        inputType: 'text', next: 'phoneNumber', saveTo: 'customer.name'
    },
    phoneNumber: {
        question: { en: "Phone number? (speak OR type, then press confirm)", hi: "Phone number kya hai? (bolo ya type karo, phir confirm karo)" },
        inputType: 'phone', next: 'siteAddress', saveTo: 'customer.phone'
    },
    siteAddress: {
        question: { en: "Site address?", hi: "Site address kya hai?" },
        inputType: 'text', next: 'houseNumber', saveTo: 'customer.address'
    },
    houseNumber: {
        question: { en: "House number?", hi: "Ghar ya flat number?" },
        inputType: 'text', next: 'floorSelection', saveTo: 'customer.houseNumber'
    },
    floorSelection: {
        question: { en: "Which floor?", hi: "Konsi floor hai?" },
        inputType: 'quick',
        options: [
            { value: 'Ground Floor', label: { en: 'Ground Floor', hi: 'Ground Floor' } },
            { value: 'First Floor', label: { en: 'First Floor', hi: 'First Floor' } },
            { value: 'Second Floor', label: { en: 'Second Floor', hi: 'Second Floor' } },
            { value: 'Third Floor', label: { en: 'Third Floor', hi: 'Third Floor' } },
            { value: 'Custom', label: { en: 'Other', hi: 'Doosra' } }
        ],
        next: 'customFloorName',
        checkNext: (value) => value === 'Custom' ? 'customFloorName' : 'roomCount',
        saveTo: 'currentFloor'
    },
    customFloorName: {
        question: { en: "Floor name?", hi: "Floor ka naam batayein:" },
        inputType: 'text', next: 'roomCount', saveTo: 'currentFloor'
    },
    roomCount: {
        question: { en: "How many rooms?", hi: "Kitne rooms hain?" },
        inputType: 'number', next: 'roomDetails', saveTo: 'roomCount'
    },
    roomName: {
        question: { en: "Room type?", hi: "Kaunsa room hai?" },
        inputType: 'quick',
        options: [
            { value: 'Master Bedroom', label: { en: 'Master Bedroom', hi: 'Master Bedroom' } },
            { value: 'Bedroom', label: { en: 'Bedroom', hi: 'Bedroom' } },
            { value: 'Guest Room', label: { en: 'Guest Room', hi: 'Guest Room' } },
            { value: 'Drawing Room', label: { en: 'Drawing Room', hi: 'Drawing Room' } },
            { value: 'Hall', label: { en: 'Hall', hi: 'Hall' } },
            { value: 'Kitchen', label: { en: 'Kitchen', hi: 'Kitchen' } },
            { value: 'Bathroom', label: { en: 'Bathroom', hi: 'Bathroom' } },
            { value: 'Toilet', label: { en: 'Toilet', hi: 'Toilet' } },
            { value: 'Balcony', label: { en: 'Balcony', hi: 'Balcony' } },
            { value: 'Store Room', label: { en: 'Store Room', hi: 'Store Room' } },
            { value: 'Room', label: { en: 'Other', hi: 'Doosra' } }
        ],
        next: 'roomImage', saveTo: 'currentRoom.name'
    },
    roomImage: {
        question: { en: "Room ki photo hai?", hi: "Room ki photo hai?" },
        inputType: 'quick',
        options: [
            { value: 'yes', label: { en: 'Yes', hi: 'Haan' } },
            { value: 'no', label: { en: 'No', hi: 'Nahi' } }
        ],
        next: 'roomDimensions',
        checkNext: (value) => value === 'yes' ? 'uploadRoomImage' : 'roomDimensions',
        saveTo: 'currentRoom.hasImage', saveValue: (v) => v === 'yes'
    },
    uploadRoomImage: {
        question: { en: "Upload room photo", hi: "Room ki photo upload karo" },
        inputType: 'upload', next: 'roomDimensions'
    },
    roomDimensions: {
        question: { en: "How to measure room?", hi: "Room kaise naapna hai?" },
        inputType: 'measurementChoice', next: 'roomDimensionsManual'
    },
    measurementChoice: {
        question: null,
        inputType: 'measurementChoice',
        next: 'roomDimensionsManual'
    },
    roomDimensionsManual: {
        question: { en: "Length aur Breadth? (bolo: 12 by 14)", hi: "Lambai aur Chaudai? (bolo: 12 by 14)" },
        inputType: 'dimensions', next: 'tileType'
    },
    roomPhotoCapture: {
        question: { en: "Take room photo", hi: "Room ki photo lo" },
        inputType: 'camera', next: 'markCorners'
    },
    markCorners: {
        question: { en: "Tap 4 corners", hi: "Charo kone par tap karo" },
        inputType: 'corners', next: 'roomDimensionsManual'
    },
    tileType: {
        question: { en: "Tile size?", hi: "Tile size kya hai?" },
        inputType: 'quick',
        options: [
            { value: '2x2', label: { en: '2x2 ft', hi: '2x2 ft' } },
            { value: '2x1', label: { en: '2x1 ft', hi: '2x1 ft' } },
            { value: '1x1', label: { en: '1x1 ft', hi: '1x1 ft' } },
            { value: 'Custom', label: { en: 'Custom', hi: 'Doosra' } }
        ],
        next: 'customTileSize',
        checkNext: (value) => value === 'Custom' ? 'customTileSize' : 'workType',
        saveTo: 'currentRoom.tileType'
    },
    customTileSize: {
        question: { en: "Tile size?", hi: "Tile size batayein:" },
        inputType: 'text', next: 'workType', saveTo: 'currentRoom.tileType'
    },
    workType: {
        question: { en: "Work type?", hi: "Tile kahan lagana hai?" },
        inputType: 'quick',
        options: [
            { value: 'floor', label: { en: 'Floor Only', hi: 'Niche Floor Pe' } },
            { value: 'wall', label: { en: 'Wall Only', hi: 'Opar Wall Pe' } },
            { value: 'both', label: { en: 'Both', hi: 'Dono Jagah' } }
        ],
        next: 'floorRate', saveTo: 'currentRoom.workType'
    },
    floorRate: {
        question: { en: "Floor tile ki rate per sq ft?", hi: "Floor tile ki rate per sq ft?" },
        inputType: 'number',
        saveTo: 'currentRoom.floorRate',
        checkNext: () => {
            const room = getCurrentRoom();
            return (room && room.workType === 'both') ? 'wallRate' : 'minusArea';
        }
    },
    wallRate: {
        question: { en: "Wall tile ki rate per sq ft?", hi: "Wall tile ki rate per sq ft?" },
        inputType: 'number',
        saveTo: 'currentRoom.wallRate',
        checkNext: () => 'minusArea'
    },
    minusArea: {
        question: { en: "Any area to subtract?", hi: "Koi area minus karna hai?" },
        inputType: 'quick',
        options: [
            { value: 'yes', label: { en: 'Yes', hi: 'Haan' } },
            { value: 'no', label: { en: 'No', hi: 'Nahi' } }
        ],
        next: 'nextRoom',
        checkNext: (value) => value === 'yes' ? 'minusAreaValue' : 'nextRoom',
        saveTo: 'hasMinusArea', saveValue: (v) => v === 'yes'
    },
    minusAreaValue: {
        question: { en: "Minus area in sq ft?", hi: "Minus area kitni sq ft?" },
        inputType: 'number', next: 'nextRoom', saveTo: 'minusArea'
    },
    nextRoom: {
        question: { en: "Aur room hai?", hi: "Aur room hai?" },
        inputType: 'quick',
        options: [
            { value: 'yes', label: { en: 'Yes', hi: 'Haan' } },
            { value: 'no', label: { en: 'No', hi: 'Nahi' } }
        ],
        next: 'nextFloor',
        checkNext: (value) => {
            if (value === 'yes') {
                AppState.currentRoomIndex++;  // FIXED: AppState not AppState.bill
                return 'roomName';
            }
            return 'nextFloor';
        },
        saveTo: 'addAnotherRoom'
    },
    nextFloor: {
        question: { en: "Aur floor hai?", hi: "Aur floor hai?" },
        inputType: 'quick',
        options: [
            { value: 'yes', label: { en: 'Yes', hi: 'Haan' } },
            { value: 'no', label: { en: 'No', hi: 'Nahi' } }
        ],
        next: 'skirtingNeededFinal',
        checkNext: (value) => value === 'yes' ? 'floorSelection' : 'skirtingNeededFinal',
        saveTo: 'addAnotherFloor'
    },
    skirtingNeededFinal: {
        question: { en: "Skirting chahiye?", hi: "Skirting chahiye?" },
        inputType: 'quick',
        options: [
            { value: 'yes', label: { en: 'Yes', hi: 'Haan' } },
            { value: 'no', label: { en: 'No', hi: 'Nahi' } }
        ],
        next: 'complete',
        checkNext: (value) => {
            AppState.bill.extras.skirting.enabled = value === 'yes';
            return value === 'yes' ? 'skirtingLengthFinal' : 'holesNeededFinal';
        }
    },
    skirtingLengthFinal: {
        question: { en: "Total skirting length in feet?", hi: "Total skirting ki length kitni feet?" },
        inputType: 'number', next: 'skirtingRateFinal', saveTo: 'extras.skirting.length'
    },
    skirtingRateFinal: {
        question: { en: "Skirting rate per foot?", hi: "Skirting ki rate per foot?" },
        inputType: 'number', next: 'holesNeededFinal', saveTo: 'rates.skirting', setGlobal: true
    },
    holesNeededFinal: {
        question: { en: "Koi hole fittings hain?", hi: "Koi hole fittings hain?" },
        inputType: 'quick',
        options: [
            { value: 'yes', label: { en: 'Yes', hi: 'Haan' } },
            { value: 'no', label: { en: 'No', hi: 'Nahi' } }
        ],
        next: 'showBillSummary',
        checkNext: (value) => {
            AppState.bill.extras.holes.enabled = value === 'yes';
            return value === 'yes' ? 'holeRateFinal' : 'showBillSummary';
        }
    },
    holeRateFinal: {
        question: { en: "Hole fitting ki rate per piece?", hi: "Hole fitting ki rate per piece?" },
        inputType: 'number', next: 'holeCountFinal', saveTo: 'rates.hole', setGlobal: true
    },
    holeCountFinal: {
        question: { en: "Kitne holes?", hi: "Kitne holes?" },
        inputType: 'number', next: 'showBillSummary', saveTo: 'extras.holes.count'
    },
    showBillSummary: {
        question: null, inputType: 'summary', next: 'complete'
    }
};

// ===== DOM Elements =====
let DOM = {};
document.addEventListener('DOMContentLoaded', () => {
    DOM = {
        welcomeScreen: document.getElementById('welcomeScreen'),
        chatMessages: document.getElementById('chatMessages'),
        inputArea: document.getElementById('inputArea'),
        textInput: document.getElementById('textInput'),
        voiceBtn: document.getElementById('voiceBtn'),
        voiceOutputBtn: document.getElementById('voiceOutputBtn'),
        sendBtn: document.getElementById('sendBtn'),
        quickButtons: document.getElementById('quickButtons'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        previewContent: document.getElementById('previewContent'),
        previewFooter: document.getElementById('previewFooter'),
        grandTotal: document.getElementById('grandTotal'),
        billPreview: document.getElementById('billPreview'),
        savedBillsModal: document.getElementById('savedBillsModal'),
        savedBillsList: document.getElementById('savedBillsList'),
        fullBillModal: document.getElementById('fullBillModal'),
        fullBillContent: document.getElementById('fullBillContent')
    };

    initVoiceRecognition();
    initEventListeners();
    selectLanguage('hi');

    const savedVoicePref = localStorage.getItem('voiceOutputEnabled');
    if (savedVoicePref !== null) {
        AppState.voiceOutputEnabled = savedVoicePref === 'true';
        if (DOM.voiceOutputBtn) {
            DOM.voiceOutputBtn.classList.toggle('active', AppState.voiceOutputEnabled);
        }
    }
});

// ===== XSS Prevention =====
function sanitizeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ===== Utility Functions =====
function getQuestion(key) {
    const q = QuestionFlow[key];
    if (!q || !q.question) return null;
    let question = q.question[AppState.language] || q.question.en;
    if (key === 'roomDimensionsManual') {
        const roomName = getCurrentRoomName();
        if (roomName) {
            question = AppState.language === 'hi'
                ? `${roomName} ki lambai aur chaurai? (bolo: 12 by 14)`
                : `${roomName} length and breadth? (say: 12 by 14)`;
        }
    }
    return question;
}

function getCurrentRoomName() {
    const room = getCurrentRoom();
    return room ? room.name : null;
}

function getCurrentRoom() {
    if (AppState.currentFloorIndex >= 0 && AppState.bill.floors[AppState.currentFloorIndex]) {
        const floor = AppState.bill.floors[AppState.currentFloorIndex];
        if (floor.rooms[AppState.currentRoomIndex]) {
            return floor.rooms[AppState.currentRoomIndex];
        }
    }
    return null;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
    return 'Rs.' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calculateRoomArea(room) {
    return (parseFloat(room.length) || 0) * (parseFloat(room.breadth) || 0);
}

function calculateRoomCosts(room, rates) {
    const area = calculateRoomArea(room);
    const finalArea = Math.max(0, area - (AppState.bill.minusArea || 0));
    const costs = { floorMaterial: 0, wallMaterial: 0 };
    const floorRate = room.floorRate || rates.floor || 0;
    const wallRate = room.wallRate || rates.wall || 0;
    if (room.workType === 'floor' || room.workType === 'both') {
        costs.floorMaterial = finalArea * floorRate;
    }
    if (room.workType === 'wall' || room.workType === 'both') {
        costs.wallMaterial = finalArea * wallRate;
    }
    return { ...costs, area, finalArea, roomTotal: costs.floorMaterial + costs.wallMaterial, floorRate, wallRate };
}

function calculateTotalCosts() {
    const rates = AppState.bill.rates;
    const totals = { floorArea: 0, floorMaterial: 0, wallMaterial: 0, skirtingCost: 0, holeCost: 0 };
    AppState.bill.floors.forEach(floor => {
        floor.rooms.forEach(room => {
            const costs = calculateRoomCosts(room, rates);
            totals.floorArea += costs.area;
            totals.floorMaterial += costs.floorMaterial;
            totals.wallMaterial += costs.wallMaterial;
        });
    });
    if (AppState.bill.extras.skirting.enabled) {
        totals.skirtingCost = (AppState.bill.extras.skirting.length || 0) * (rates.skirting || 0);
    }
    if (AppState.bill.extras.holes.enabled) {
        totals.holeCost = (AppState.bill.extras.holes.count || 0) * (rates.hole || 0);
    }
    totals.grandTotal = totals.floorMaterial + totals.wallMaterial + totals.skirtingCost + totals.holeCost;
    return totals;
}

function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ===== Chat UI Functions =====
function addMessage(content, type = 'system') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    const avatarSvg = type === 'system'
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
    const safeContent = type === 'user' ? sanitizeHTML(content) : content;
    messageEl.innerHTML = `<div class="message-avatar">${avatarSvg}</div><div class="message-content"><div class="message-bubble">${safeContent}</div></div>`;
    DOM.chatMessages.appendChild(messageEl);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function renderQuickButtons(options) {
    DOM.quickButtons.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quick-btn';
        btn.textContent = typeof opt.label === 'object' ? (opt.label[AppState.language] || opt.label.en) : opt.label;
        btn.dataset.value = opt.value;
        btn.addEventListener('click', (function(value) {
            return function() { handleQuickButton(value); };
        })(opt.value));
        DOM.quickButtons.appendChild(btn);
    });
}

function clearQuickButtons() {
    DOM.quickButtons.innerHTML = '';
}

// ===== Navigation Functions =====
function startNewBill() {
    AppState.bill = {
        id: generateId(),
        customer: { name: '', phone: '', address: '', houseNumber: '' },
        floors: [],
        rates: { floor: 0, wall: 0, skirting: 0, hole: 0 },
        extras: { skirting: { enabled: false, length: 0 }, holes: { enabled: false, count: 0 } },
        minusArea: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    AppState.currentStep = 'customerName';
    AppState.currentFloorIndex = -1;
    AppState.currentRoomIndex = -1;
    lastShownQuestion = null;

    DOM.welcomeScreen.style.display = 'none';
    DOM.chatMessages.style.display = 'flex';
    DOM.chatMessages.innerHTML = '';
    DOM.inputArea.style.display = 'block';
    DOM.progressContainer.style.display = 'block';
    DOM.previewFooter.style.display = 'block';

    updatePreview();
    showQuestion(AppState.currentStep);
}

// ===== FIXED showQuestion =====
function showQuestion(stepKey) {
    // Always allow if we're moving to a different step than what was last shown
    if (lastShownQuestion === stepKey && AppState.currentStep === stepKey) {
        console.log('[showQuestion] Duplicate blocked:', stepKey);
        return;
    }

    // Prevent showing dimension question if dimensions are already saved
    if (stepKey === 'roomDimensions' || stepKey === 'roomDimensionsManual') {
        const currentRoom = getCurrentRoom();
        if (currentRoom && currentRoom.length > 0 && currentRoom.breadth > 0) {
            stepKey = 'tileType';
        }
    }

    const step = QuestionFlow[stepKey];
    if (!step) {
        console.error('[showQuestion] Step not found:', stepKey);
        return;
    }

    AppState.currentStep = stepKey;
    lastShownQuestion = stepKey;

    clearPhoneConfirmBtn();
    const question = getQuestion(stepKey);
    if (question) {
        addMessage(question, 'system');
        speakQuestion(question, step);
    }

    if (step.inputType === 'quick' && step.options) {
        renderQuickButtons(step.options);
        DOM.textInput.value = '';
        DOM.textInput.placeholder = AppState.language === 'hi' ? 'Button dabao...' : 'Tap a button...';
        DOM.textInput.blur();
    } else if (step.inputType === 'phone') {
        clearQuickButtons();
        DOM.textInput.value = '';
        updateInputPlaceholder();
        DOM.textInput.focus();
        setTimeout(() => showPhoneConfirmBtn(), 100);
    } else if (step.inputType === 'dimensions') {
        clearQuickButtons();
        clearPhoneConfirmBtn();
        DOM.textInput.value = '';
        DOM.textInput.placeholder = AppState.language === 'hi' ? '12 by 14 type karo ya bolo...' : '12 by 14 type or say...';
        DOM.textInput.focus();
    } else if (step.inputType === 'upload') {
        clearQuickButtons();
        clearPhoneConfirmBtn();
        DOM.textInput.value = '';
        showImageUploadUI();
    } else if (step.inputType === 'measurementChoice') {
        clearQuickButtons();
        clearPhoneConfirmBtn();
        DOM.textInput.value = '';
        openMeasurementOverlay();
        return;
    } else {
        clearQuickButtons();
        clearPhoneConfirmBtn();
        DOM.textInput.value = '';
        updateInputPlaceholder();
        DOM.textInput.focus();
    }
}

function speakQuestion(text, step) {
    if (!AppState.voiceOutputEnabled) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let fullText = text;
        if (step && step.inputType === 'quick' && step.options) {
            const optionsText = step.options.map(opt => {
                const label = typeof opt.label === 'object' ? opt.label.hi || opt.label.en : opt.label;
                return label;
            }).join(', ');
            fullText = text + '. Options: ' + optionsText;
        } else if (step && step.inputType === 'dimensions') {
            fullText = text + '. Example: twelve by fourteen';
        }
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.lang = AppState.language === 'hi' ? 'hi-IN' : 'en-US';
        utterance.rate = 0.85;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}

function toggleVoiceOutput() {
    AppState.voiceOutputEnabled = !AppState.voiceOutputEnabled;
    if (DOM.voiceOutputBtn) {
        DOM.voiceOutputBtn.classList.toggle('active', AppState.voiceOutputEnabled);
    }
    localStorage.setItem('voiceOutputEnabled', AppState.voiceOutputEnabled);
}

// ===== FIXED handleQuickButton =====
function handleQuickButton(value) {
    const step = QuestionFlow[AppState.currentStep];
    if (!step) return;

    const label = step.options?.find(o => o.value === value)?.label;
    const displayLabel = typeof label === 'object'
        ? (label[AppState.language] || label.en)
        : (label || value);
    addMessage(displayLabel, 'user');

    // CRITICAL: reset lastShownQuestion so next question is never blocked
    lastShownQuestion = null;

    processAnswer(value, step);
}

// Flag to prevent duplicate dimension processing
let isProcessingDimensions = false;

function handleTextInput() {
    let value = DOM.textInput.value.trim();
    if (!value) return;

    const step = QuestionFlow[AppState.currentStep];

    if (step.inputType === 'phone') {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) {
            showToast('Phone number should be at least 10 digits', 'error');
            return;
        }
        addMessage(digits, 'user');
        DOM.textInput.value = '';
        clearPhoneConfirmBtn();
        processAnswer(digits, step);
        return;
    }

    if (step.inputType === 'dimensions') {
        if (isProcessingDimensions) return;
        isProcessingDimensions = true;
        DOM.textInput.value = '';

        if (AppState.isRecording) {
            AppState.recognition.stop();
        }

        const dimensions = parseDimensions(value);
        if (dimensions) {
            addMessage(`Length: ${dimensions.length}', Breadth: ${dimensions.breadth}'`, 'user');
            saveDimensionsAndAdvance(dimensions);
        } else {
            showToast('Format samajh nahi aaya. Bolo: 12 by 14 ya 12 14', 'error');
        }
        isProcessingDimensions = false;
        return;
    }

    if (step.inputType === 'number') {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            showToast('Please enter a valid number', 'error');
            return;
        }
        value = num.toString();
    }

    addMessage(value, 'user');
    DOM.textInput.value = '';
    processAnswer(value, step);
}

// ===== EXTRACTED: Save dimensions in one place =====
function saveDimensionsAndAdvance(dimensions) {
    ensureCurrentRoom();
    if (AppState.currentFloorIndex >= 0 && AppState.currentRoomIndex >= 0) {
        const room = AppState.bill.floors[AppState.currentFloorIndex].rooms[AppState.currentRoomIndex];
        room.length = dimensions.length;
        room.breadth = dimensions.breadth;
        AppState.bill.updatedAt = new Date().toISOString();
        saveToLocalStorage();
    }
    lastShownQuestion = null;
    AppState.currentStep = 'tileType';
    updatePreview();
    showQuestion('tileType');
}

function parseDimensions(input) {
    const text = input.toLowerCase().trim();

    const patterns = [
        /(\d+(?:\.\d+)?)\s*(?:by|x|×|✕|‐|\-)\s*(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const length = parseFloat(match[1]);
            const breadth = parseFloat(match[2]);
            if (length > 0 && length <= 500 && breadth > 0 && breadth <= 500) {
                return { length, breadth };
            }
        }
    }

    const hindiNums = {
        'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5,
        'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
        'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
        'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
        'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
        'chah': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
        'gyarah': 11, 'barah': 12, 'tera': 13, 'chaudah': 14, 'pandrah': 15,
        'solah': 16, 'satrah': 17, 'atharah': 18, 'unis': 19, 'bees': 20
    };

    const words = text.split(/\s+/);
    const nums = [];
    for (const word of words) {
        if (hindiNums[word]) nums.push(hindiNums[word]);
        const digitMatch = word.match(/\d+/);
        if (digitMatch) nums.push(parseInt(digitMatch[0]));
    }

    if (nums.length >= 2 && nums[0] > 0 && nums[0] <= 500 && nums[1] > 0 && nums[1] <= 500) {
        return { length: nums[0], breadth: nums[1] };
    }

    return null;
}

function showPhoneConfirmBtn() {
    if (document.getElementById('phoneConfirmBtn')) return;
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'phoneConfirmBtn';
    confirmBtn.className = 'btn btn-primary btn-sm';
    confirmBtn.style.cssText = 'margin-left:8px;padding:8px 16px;font-size:0.875rem;flex-shrink:0;';
    confirmBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> OK';
    confirmBtn.addEventListener('click', handleTextInput);
    DOM.inputArea.querySelector('.input-container').appendChild(confirmBtn);
    showToast('Type or speak digits, then press OK', 'info');
}

function clearPhoneConfirmBtn() {
    const btn = document.getElementById('phoneConfirmBtn');
    if (btn) btn.remove();
}

function showImageUploadUI() {
    const existingUpload = document.getElementById('imageUploadContainer');
    if (existingUpload) existingUpload.remove();

    const container = document.createElement('div');
    container.id = 'imageUploadContainer';
    container.style.cssText = 'margin-top:12px;padding:16px;background:#f5f5f5;border-radius:12px;';
    container.innerHTML = `
        <div style="text-align:center;">
            <p style="margin-bottom:12px;color:#666;font-size:0.9rem;">Room ki photo upload karo (optional)</p>
            <label for="roomImageInput" style="display:inline-block;padding:12px 24px;background:#1e88e5;color:white;border-radius:8px;cursor:pointer;font-weight:500;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:8px;"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                Photo Chuno
            </label>
            <input type="file" id="roomImageInput" accept="image/*" capture="environment" style="display:none;">
            <div id="imagePreview" style="margin-top:12px;"></div>
            <button id="skipImageBtn" style="margin-top:12px;padding:8px 16px;background:transparent;border:1px solid #ddd;color:#666;border-radius:8px;cursor:pointer;font-size:0.85rem;">
                Skip →
            </button>
        </div>
    `;

    DOM.inputArea.querySelector('.quick-buttons').appendChild(container);

    document.getElementById('skipImageBtn').addEventListener('click', () => {
        container.remove();
        lastShownQuestion = null;
        AppState.currentStep = 'roomDimensions';
        showQuestion('roomDimensions');
    });

    document.getElementById('roomImageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${evt.target.result}" style="max-width:100%;max-height:150px;border-radius:8px;">`;
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const jpegData = canvas.toDataURL('image/jpeg', 0.8);
                    const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
                    if (jpegData.length > MAX_IMAGE_SIZE) {
                        showToast('Image too large. Max 2MB allowed.', 'error');
                        return;
                    }
                    ensureCurrentRoom();
                    AppState.bill.floors[AppState.currentFloorIndex].rooms[AppState.currentRoomIndex].imageData = jpegData;
                    showToast('Photo uploaded!', 'success');
                    setTimeout(() => {
                        container.remove();
                        lastShownQuestion = null;
                        AppState.currentStep = 'roomDimensions';
                        showQuestion('roomDimensions');
                    }, 1000);
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// ===== FIXED processAnswer =====
function processAnswer(value, step) {
    // Handle dimensions object (from voice/camera path)
    if ((AppState.currentStep === 'roomDimensions' || AppState.currentStep === 'roomDimensionsManual')
        && typeof value === 'object' && value.length && value.breadth) {
        addMessage(`Length: ${value.length}', Breadth: ${value.breadth}'`, 'user');
        saveDimensionsAndAdvance(value);
        return;
    }

    // Save value and determine next step
    saveValue(value, step);
    const nextStep = step.checkNext ? step.checkNext(value) : step.next;
    AppState.currentStep = nextStep;

    // Handle special routing
    if (AppState.currentStep === 'roomDetails') {
        AppState.currentRoomIndex = 0;
        AppState.currentStep = 'roomName';
    } else if (AppState.currentStep === 'showBillSummary') {
        showFinalSummary();
        return;
    } else if (AppState.currentStep === 'complete') {
        showFinalSummary();
        return;
    }

    updatePreview();
    showQuestion(AppState.currentStep);
}

// ===== FIXED saveValue =====
function saveValue(value, step) {
    if (!step.saveTo) return;
    const path = step.saveTo;
    let finalValue = value;
    if (step.saveValue) finalValue = step.saveValue(value);
    else if (step.inputType === 'number') finalValue = parseFloat(value) || 0;

    if (path === 'currentFloor') {
        // FIXED: Always create a new floor when coming from floorSelection
        // Only update name if customFloorName is updating an existing floor
        if (AppState.currentStep === 'floorSelection' || AppState.currentStep === 'customFloorName') {
            if (AppState.currentStep === 'floorSelection') {
                // Always push new floor for floorSelection
                AppState.bill.floors.push({ name: value === 'Custom' ? '' : value, rooms: [] });
                AppState.currentFloorIndex = AppState.bill.floors.length - 1;
                AppState.currentRoomIndex = 0;
            } else {
                // customFloorName: update the name of the floor just created
                if (AppState.currentFloorIndex >= 0) {
                    AppState.bill.floors[AppState.currentFloorIndex].name = value;
                }
            }
        } else {
            // Fallback
            if (AppState.currentFloorIndex === -1) {
                AppState.bill.floors.push({ name: value, rooms: [] });
                AppState.currentFloorIndex = AppState.bill.floors.length - 1;
                AppState.currentRoomIndex = 0;
            } else {
                AppState.bill.floors[AppState.currentFloorIndex].name = value;
            }
        }
    } else if (path.startsWith('currentRoom.')) {
        const key = path.split('.')[1];
        ensureCurrentRoom();
        AppState.bill.floors[AppState.currentFloorIndex].rooms[AppState.currentRoomIndex][key] = finalValue;
    } else if (path.startsWith('customer.')) {
        AppState.bill.customer[path.split('.')[1]] = finalValue;
    } else if (path.startsWith('rates.')) {
        AppState.bill.rates[path.split('.')[1]] = finalValue;
    } else if (path.startsWith('extras.')) {
        const parts = path.split('.');
        AppState.bill.extras[parts[1]][parts[2]] = finalValue;
    } else {
        AppState.bill[path] = finalValue;
    }
    AppState.bill.updatedAt = new Date().toISOString();
    saveToLocalStorage();
}

function ensureCurrentRoom() {
    if (AppState.currentFloorIndex === -1) return;
    const floor = AppState.bill.floors[AppState.currentFloorIndex];
    if (!floor.rooms[AppState.currentRoomIndex]) {
        floor.rooms[AppState.currentRoomIndex] = {
            name: '', length: 0, breadth: 0, area: 0,
            tileType: '', workType: '', floorRate: 0, wallRate: 0, imageData: null
        };
    }
}

function showFinalSummary() {
    const totals = calculateTotalCosts();
    const rates = AppState.bill.rates;

    let roomDetails = '';
    AppState.bill.floors.forEach((floor, fi) => {
        floor.rooms.forEach((room, ri) => {
            const area = calculateRoomArea(room);
            const costs = calculateRoomCosts(room, rates);
            const workLabel = room.workType === 'floor' ? 'Floor' : room.workType === 'wall' ? 'Wall' : 'Floor+Wall';
            const roomImageHtml = room.imageData ? `<img src="${room.imageData}" style="max-width:120px;max-height:80px;border-radius:8px;margin-bottom:8px;cursor:pointer;" onclick="this.style.maxWidth='300px';this.style.maxHeight='300px';">` : '';

            roomDetails += `
                <div style="margin-bottom:15px;padding:10px;background:#f5f5f5;border-radius:8px;">
                    ${roomImageHtml}
                    <div style="font-weight:600;margin-bottom:5px;">${sanitizeHTML(room.name)} (${sanitizeHTML(floor.name)})</div>
                    <div style="font-size:0.85rem;color:#666;">
                        <div>Size: ${room.length || 0}' x ${room.breadth || 0}' = ${area} sq ft</div>
                        <div>Tile: ${sanitizeHTML(room.tileType)} | Work: ${workLabel}</div>
                    </div>
                    <table style="width:100%;margin-top:8px;font-size:0.85rem;">
                        ${costs.floorMaterial > 0 ? `<tr><td>Floor Tile</td><td>${area} sq ft</td><td>x ${costs.floorRate}</td><td style="text-align:right;">${formatCurrency(costs.floorMaterial)}</td></tr>` : ''}
                        ${costs.wallMaterial > 0 ? `<tr><td>Wall Tile</td><td>${area} sq ft</td><td>x ${costs.wallRate}</td><td style="text-align:right;">${formatCurrency(costs.wallMaterial)}</td></tr>` : ''}
                        <tr style="font-weight:600;background:#e3f2fd;"><td colspan="3">Room Total:</td><td style="text-align:right;">${formatCurrency(costs.roomTotal)}</td></tr>
                    </table>
                </div>`;
        });
    });

    addMessage(`<strong>Bill Summary</strong><br><br>
        <div style="text-align:left;font-size:0.9rem;">
            <div style="margin-bottom:10px;"><strong>Customer:</strong> ${sanitizeHTML(AppState.bill.customer.name)}</div>
            <div style="margin-bottom:10px;"><strong>Phone:</strong> ${sanitizeHTML(AppState.bill.customer.phone)}</div>
            ${roomDetails}
            ${totals.skirtingCost > 0 ? `<div style="padding:10px;background:#e8f5e9;border-radius:8px;margin-bottom:10px;"><strong>Skirting:</strong> ${AppState.bill.extras.skirting.length} ft x ${rates.skirting} = ${formatCurrency(totals.skirtingCost)}</div>` : ''}
            ${totals.holeCost > 0 ? `<div style="padding:10px;background:#e8f5e9;border-radius:8px;margin-bottom:10px;"><strong>Hole Fittings:</strong> ${AppState.bill.extras.holes.count} x ${rates.hole} = ${formatCurrency(totals.holeCost)}</div>` : ''}
            <hr style="border:2px solid #1e88e5;margin:15px 0;">
            <div style="display:flex;justify-content:space-between;font-size:1.3rem;font-weight:bold;color:#1e88e5;">
                <span>Grand Total:</span>
                <span>${formatCurrency(totals.grandTotal)}</span>
            </div>
        </div>`, 'system');

    DOM.grandTotal.textContent = formatCurrency(totals.grandTotal);
    clearQuickButtons();
    DOM.inputArea.style.display = 'none';
    DOM.progressContainer.style.display = 'none';

    addMessage(`<div style="margin-top:20px;text-align:center;">
        <button class="btn btn-primary" onclick="showFullBill()" style="margin:5px;">View Full Bill</button>
        <button class="btn btn-secondary" onclick="if(confirm('Start new bill?'))location.reload()" style="margin:5px;">New Bill</button>
    </div>`, 'system');
}

// ===== Preview Panel =====
function updatePreview() {
    const content = DOM.previewContent;
    if (AppState.bill.floors.length === 0 && !AppState.bill.customer.name) {
        content.innerHTML = '<div class="preview-empty"><p>Start creating a bill...</p></div>';
        return;
    }

    let html = '';
    if (AppState.bill.customer.name) {
        html += `<div style="margin-bottom:16px;padding:12px;background:var(--background);border-radius:8px;">
            <h4 style="font-size:0.875rem;font-weight:600;margin-bottom:4px;">${sanitizeHTML(AppState.bill.customer.name)}</h4>
            <p style="font-size:0.75rem;color:var(--text-secondary);">${sanitizeHTML(AppState.bill.customer.phone) || 'No phone'}</p>
        </div>`;
    }

    AppState.bill.floors.forEach((floor, fi) => {
        html += `<div class="floor-card ${fi === 0 ? 'expanded' : ''}" data-floor="${fi}">
            <div class="floor-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div class="floor-title"><span class="floor-title-icon">${fi + 1}</span>${sanitizeHTML(floor.name)}</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:0.75rem;color:var(--text-secondary);">${floor.rooms.length} rooms</span>
                    <svg class="floor-expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                </div>
            </div>
            <div class="floor-body">${floor.rooms.map((room, ri) => {
                const area = calculateRoomArea(room);
                const costs = calculateRoomCosts(room, AppState.bill.rates);
                const roomImageHtml = room.imageData ? `<img src="${room.imageData}" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;">` : '';
                const editBtn = `<button onclick="editRoom(${ri}, ${fi})" style="position:absolute;top:8px;right:8px;background:rgba(30,136,229,0.9);color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:0.7rem;">Edit</button>`;
                return `<div class="room-item" style="position:relative;">
                    ${roomImageHtml}${editBtn}
                    <div class="room-item-header">
                        <span class="room-item-name">${sanitizeHTML(room.name) || 'Room ' + (ri + 1)}</span>
                        <span class="room-item-area" style="background:#1e88e5;color:white;padding:2px 8px;border-radius:4px;">${formatCurrency(costs.roomTotal)}</span>
                    </div>
                    <div style="font-size:0.8rem;color:#666;margin:5px 0;">
                        <span>${room.length || 0}' x ${room.breadth || 0}' = ${area} sq ft</span>
                    </div>
                    <div class="room-item-details">
                        <span class="room-item-tag">${sanitizeHTML(room.tileType) || 'No tile'}</span>
                        <span class="room-item-tag">${room.workType === 'floor' ? 'Floor' : room.workType === 'wall' ? 'Wall' : room.workType === 'both' ? 'Floor+Wall' : 'No work'}</span>
                    </div>
                    <div class="cost-summary">
                        ${costs.floorMaterial > 0 ? `<div class="cost-row"><span>Floor (${area} x ${costs.floorRate})</span><span>${formatCurrency(costs.floorMaterial)}</span></div>` : ''}
                        ${costs.wallMaterial > 0 ? `<div class="cost-row"><span>Wall (${area} x ${costs.wallRate})</span><span>${formatCurrency(costs.wallMaterial)}</span></div>` : ''}
                    </div>
                </div>`;
            }).join('')}</div>
        </div>`;
    });

    content.innerHTML = html;
}

// ===== Edit Bill Functions =====
function editRoom(roomIndex, floorIndex) {
    const room = AppState.bill.floors[floorIndex].rooms[roomIndex];
    DOM.fullBillModal.classList.add('active');
    DOM.fullBillContent.innerHTML = `
        <div style="padding:20px;">
            <h3 style="margin-bottom:20px;color:#1e88e5;">Edit Room</h3>
            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;font-weight:500;">Room Name</label>
                <input type="text" id="editRoomName" value="${sanitizeHTML(room.name)}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;">
            </div>
            <div style="display:flex;gap:15px;margin-bottom:15px;">
                <div style="flex:1;">
                    <label style="display:block;margin-bottom:5px;font-weight:500;">Length (feet)</label>
                    <input type="number" id="editRoomLength" value="${room.length || 0}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;">
                </div>
                <div style="flex:1;">
                    <label style="display:block;margin-bottom:5px;font-weight:500;">Breadth (feet)</label>
                    <input type="number" id="editRoomBreadth" value="${room.breadth || 0}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;">
                </div>
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;font-weight:500;">Tile Size</label>
                <input type="text" id="editRoomTile" value="${room.tileType || ''}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;font-weight:500;">Work Type</label>
                <select id="editRoomWorkType" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;">
                    <option value="floor" ${room.workType === 'floor' ? 'selected' : ''}>Floor Only</option>
                    <option value="wall" ${room.workType === 'wall' ? 'selected' : ''}>Wall Only</option>
                    <option value="both" ${room.workType === 'both' ? 'selected' : ''}>Both</option>
                </select>
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;font-weight:500;">Floor Rate</label>
                <input type="number" id="editRoomFloorRate" value="${room.floorRate || 0}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:5px;font-weight:500;">Wall Rate</label>
                <input type="number" id="editRoomWallRate" value="${room.wallRate || 0}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;">
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:5px;font-weight:500;">Notes</label>
                <textarea id="editRoomNotes" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:1rem;min-height:80px;">${sanitizeHTML(room.notes || '')}</textarea>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="deleteRoom(${roomIndex}, ${floorIndex})" style="background:#e53935;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;">Delete</button>
                <button onclick="closeEditModal()" style="padding:12px 20px;border:1px solid #ddd;border-radius:8px;cursor:pointer;">Cancel</button>
                <button onclick="saveRoomEdit(${roomIndex}, ${floorIndex})" style="background:#1e88e5;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;">Save</button>
            </div>
        </div>`;
}

function saveRoomEdit(roomIndex, floorIndex) {
    applyRoomEdits(roomIndex, floorIndex);
}

function applyRoomEdits(roomIndex, floorIndex) {
    const room = AppState.bill.floors[floorIndex].rooms[roomIndex];
    room.name = document.getElementById('editRoomName').value;
    room.length = parseFloat(document.getElementById('editRoomLength').value) || 0;
    room.breadth = parseFloat(document.getElementById('editRoomBreadth').value) || 0;
    room.tileType = document.getElementById('editRoomTile').value;
    room.workType = document.getElementById('editRoomWorkType').value;
    room.floorRate = parseFloat(document.getElementById('editRoomFloorRate').value) || 0;
    room.wallRate = parseFloat(document.getElementById('editRoomWallRate').value) || 0;
    room.notes = document.getElementById('editRoomNotes').value;
    AppState.bill.updatedAt = new Date().toISOString();
    saveToLocalStorage();
    updatePreview();
    closeEditModal();
    showFinalSummary();
    showToast('Room updated!', 'success');
}

function deleteRoom(roomIndex, floorIndex) {
    if (confirm('Delete this room?')) {
        AppState.bill.floors[floorIndex].rooms.splice(roomIndex, 1);
        AppState.bill.updatedAt = new Date().toISOString();
        saveToLocalStorage();
        updatePreview();
        closeEditModal();
        showFinalSummary();
        showToast('Room deleted!', 'success');
    }
}

function closeEditModal() {
    DOM.fullBillModal.classList.remove('active');
}

function addCustomNote() {
    const note = prompt('Enter your note:');
    if (note) {
        if (!AppState.bill.customNotes) AppState.bill.customNotes = [];
        AppState.bill.customNotes.push({ text: note, timestamp: new Date().toISOString() });
        saveToLocalStorage();
        showFinalSummary();
        showToast('Note added!', 'success');
    }
}

// ===== Storage Functions =====
function saveToLocalStorage() {
    try {
        const bills = JSON.parse(localStorage.getItem('thikaidar_bills') || '{}');
        bills[AppState.bill.id] = AppState.bill;
        localStorage.setItem('thikaidar_bills', JSON.stringify(bills));
    } catch (e) { console.error('Save error:', e); }
}

function loadFromLocalStorage(id) {
    try {
        const bills = JSON.parse(localStorage.getItem('thikaidar_bills') || '{}');
        return bills[id] || null;
    } catch (e) { return null; }
}

function getAllBills() {
    try {
        const bills = JSON.parse(localStorage.getItem('thikaidar_bills') || '{}');
        return Object.values(bills).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (e) { return []; }
}

function deleteBill(id) {
    try {
        const bills = JSON.parse(localStorage.getItem('thikaidar_bills') || '{}');
        if (bills[id]) {
            delete bills[id];
            localStorage.setItem('thikaidar_bills', JSON.stringify(bills));
            showToast('Bill deleted successfully', 'success');
        }
    } catch (e) {
        showToast('Failed to delete bill: ' + e.message, 'error');
    }
}

// ===== Modal Functions =====
function showSavedBills() {
    const bills = getAllBills();
    if (bills.length === 0) {
        DOM.savedBillsList.innerHTML = '<div class="empty-list">No saved bills</div>';
    } else {
        DOM.savedBillsList.innerHTML = bills.map(bill => `
            <div class="saved-bill-item" data-id="${bill.id}">
                <div class="saved-bill-info">
                    <h4>${sanitizeHTML(bill.customer.name) || 'Unnamed'}</h4>
                    <p>${bill.floors.length} floor(s) | ${new Date(bill.updatedAt).toLocaleDateString()}</p>
                </div>
                <div class="saved-bill-actions">
                    <button class="btn btn-sm btn-secondary load-bill-btn">Load</button>
                    <button class="btn btn-sm btn-danger delete-bill-btn">Delete</button>
                </div>
            </div>`).join('');

        DOM.savedBillsList.querySelectorAll('.load-bill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.saved-bill-item').dataset.id;
                loadBill(id);
                DOM.savedBillsModal.classList.remove('active');
            });
        });
        DOM.savedBillsList.querySelectorAll('.delete-bill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.saved-bill-item').dataset.id;
                if (confirm('Delete this bill?')) {
                    deleteBill(id);
                    showSavedBills();
                }
            });
        });
    }
    DOM.savedBillsModal.classList.add('active');
}

function loadBill(id) {
    const bill = loadFromLocalStorage(id);
    if (!bill) { showToast('Bill not found', 'error'); return; }
    AppState.bill = bill;
    AppState.currentStep = 'complete';
    AppState.currentFloorIndex = bill.floors.length - 1;
    AppState.currentRoomIndex = 0;
    DOM.welcomeScreen.style.display = 'none';
    DOM.chatMessages.style.display = 'flex';
    DOM.inputArea.style.display = 'none';
    DOM.progressContainer.style.display = 'none';
    DOM.previewFooter.style.display = 'block';
    addMessage(`<strong>Bill loaded:</strong> ${sanitizeHTML(bill.customer.name)}`, 'system');
    const totals = calculateTotalCosts();
    DOM.grandTotal.textContent = formatCurrency(totals.grandTotal);
    updatePreview();
    showFinalSummary();
    showToast('Bill loaded', 'success');
}

function showFullBill() {
    const bill = AppState.bill;
    const totals = calculateTotalCosts();
    const rates = bill.rates;

    let roomRows = '';
    bill.floors.forEach((floor, fi) => {
        floor.rooms.forEach((room, ri) => {
            const area = calculateRoomArea(room);
            const costs = calculateRoomCosts(room, rates);
            const roomImageHtml = room.imageData ? `<img src="${room.imageData}" style="max-width:200px;max-height:150px;border-radius:8px;margin-bottom:12px;cursor:pointer;" onclick="this.style.maxWidth='500px';this.style.maxHeight='500px';">` : '';

            roomRows += `
                <div style="margin-bottom:20px;padding:15px;background:#f9f9f9;border-radius:8px;position:relative;">
                    <button onclick="editRoom(${ri}, ${fi})" style="position:absolute;top:10px;right:10px;background:#1e88e5;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;">Edit</button>
                    ${roomImageHtml}
                    <div style="font-weight:bold;font-size:1.1rem;margin-bottom:10px;color:#1e88e5;">${sanitizeHTML(floor.name)} - ${sanitizeHTML(room.name)}</div>
                    ${room.notes ? `<div style="background:#fff3e0;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:0.85rem;"><strong>Note:</strong> ${sanitizeHTML(room.notes)}</div>` : ''}
                    <table style="width:100%;border-collapse:collapse;">
                        <tr style="background:#eee;">
                            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Description</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Length</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Breadth</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Area</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Rate</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Amount</th>
                        </tr>
                        ${costs.floorMaterial > 0 ? `<tr>
                            <td style="padding:8px;border:1px solid #ddd;">Floor Tile (${sanitizeHTML(room.tileType)})</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${room.length}'</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${room.breadth}'</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${area} sq ft</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${costs.floorRate}</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">${formatCurrency(costs.floorMaterial)}</td>
                        </tr>` : ''}
                        ${costs.wallMaterial > 0 ? `<tr>
                            <td style="padding:8px;border:1px solid #ddd;">Wall Tile (${sanitizeHTML(room.tileType)})</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${room.length}'</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${room.breadth}'</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${area} sq ft</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${costs.wallRate}</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">${formatCurrency(costs.wallMaterial)}</td>
                        </tr>` : ''}
                        <tr style="background:#e3f2fd;font-weight:bold;">
                            <td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:right;">Room Total:</td>
                            <td style="padding:8px;border:1px solid #ddd;text-align:right;color:#1e88e5;">${formatCurrency(costs.roomTotal)}</td>
                        </tr>
                    </table>
                </div>`;
        });
    });

    DOM.fullBillContent.innerHTML = `
        <div class="bill-document">
            <div class="bill-header">
                <div><div class="bill-title">THIKAI DAR</div><div class="bill-subtitle">Professional Tile Work Billing</div></div>
                <div class="bill-info">
                    <p><strong>Bill No:</strong> ${bill.id.substring(0, 8).toUpperCase()}</p>
                    <p><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="bill-customer">
                <h3>Customer Details</h3>
                <p><strong>Name:</strong> ${sanitizeHTML(bill.customer.name)}</p>
                <p><strong>Phone:</strong> ${sanitizeHTML(bill.customer.phone)}</p>
                <p><strong>Address:</strong> ${sanitizeHTML(bill.customer.address)}</p>
                <p><strong>House No:</strong> ${sanitizeHTML(bill.customer.houseNumber)}</p>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;">
                <h3 style="margin:0;">Room Details</h3>
                <button onclick="addCustomNote()" style="background:#43a047;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:0.85rem;">+ Add Note</button>
            </div>
            ${roomRows}
            ${totals.skirtingCost > 0 ? `<div style="margin-top:15px;padding:15px;background:#e8f5e9;border-radius:8px;"><strong>Skirting:</strong> ${bill.extras.skirting.length} ft x ${rates.skirting} = ${formatCurrency(totals.skirtingCost)}</div>` : ''}
            ${totals.holeCost > 0 ? `<div style="margin-top:10px;padding:15px;background:#e8f5e9;border-radius:8px;"><strong>Hole Fittings:</strong> ${bill.extras.holes.count} x ${rates.hole} = ${formatCurrency(totals.holeCost)}</div>` : ''}
            <div class="bill-totals" style="margin-top:20px;">
                <div class="bill-total-row grand"><span>Grand Total</span><span>${formatCurrency(totals.grandTotal)}</span></div>
            </div>
        </div>`;
    DOM.fullBillModal.classList.add('active');
}

function printBill() {
    const printContent = DOM.fullBillContent.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Print Bill</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}</style></head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.print();
}

async function exportPdf() {
    showToast('Generating PDF...', 'info');
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        let yPos = margin;
        const bill = AppState.bill;
        const totals = calculateTotalCosts();
        const rates = bill.rates;

        doc.setFillColor(30, 136, 229);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('THIKAI DAR', margin, 18);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Professional Tile Work Billing', margin, 26);
        doc.text(`Bill No: ${bill.id.substring(0, 8).toUpperCase()}`, pageWidth - margin - 60, 15);
        doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, pageWidth - margin - 60, 22);
        yPos = 45;

        doc.setTextColor(30, 136, 229);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Details', margin, yPos);
        yPos += 8;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${bill.customer.name}`, margin, yPos); yPos += 6;
        doc.text(`Phone: ${bill.customer.phone}`, margin, yPos); yPos += 6;
        doc.text(`Address: ${bill.customer.address}`, margin, yPos); yPos += 6;
        doc.text(`House No: ${bill.customer.houseNumber}`, margin, yPos);
        yPos += 12;

        doc.setTextColor(30, 136, 229);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Room Details', margin, yPos);
        yPos += 10;

        bill.floors.forEach((floor) => {
            floor.rooms.forEach((room) => {
                const area = calculateRoomArea(room);
                const costs = calculateRoomCosts(room, rates);
                let roomBlockHeight = 40;
                if (costs.floorMaterial > 0) roomBlockHeight += 8;
                if (costs.wallMaterial > 0) roomBlockHeight += 8;
                roomBlockHeight += 8;
                if (yPos + roomBlockHeight > pageHeight - margin) { doc.addPage(); yPos = margin; }

                const roomStartY = yPos;
                const hasImage = !!room.imageData;
                const imgWidth = 40, imgHeight = 32;
                if (hasImage) {
                    try {
                        const imgFormat = room.imageData.indexOf('data:image/png') !== -1 ? 'PNG' : 'JPEG';
                        doc.addImage(room.imageData, imgFormat, margin, yPos, imgWidth, imgHeight);
                    } catch (e) { console.log('Image error:', e); }
                }
                const textStartX = hasImage ? margin + imgWidth + 5 : margin;
                const headerWidth = contentWidth - (hasImage ? imgWidth + 5 : 0);
                doc.setFillColor(227, 242, 253);
                doc.rect(textStartX, yPos, headerWidth, 8, 'F');
                doc.setTextColor(30, 136, 229);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`${floor.name} - ${room.name}`, textStartX + 2, yPos + 5.5);
                yPos += 12;
                doc.setTextColor(50, 50, 50);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Size: ${room.length}' x ${room.breadth}' = ${area} sq ft`, textStartX, yPos); yPos += 6;
                doc.text(`Tile: ${room.tileType}  |  Work: ${room.workType === 'both' ? 'Floor + Wall' : room.workType}`, textStartX, yPos); yPos += 8;
                if (hasImage && yPos < roomStartY + imgHeight + 4) yPos = roomStartY + imgHeight + 4;

                const colDesc = margin + 2, colArea = margin + 55, colRate = margin + 95, colAmount = pageWidth - margin - 10;
                doc.setFillColor(230, 230, 230);
                doc.rect(margin, yPos, contentWidth, 7, 'F');
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('Description', colDesc, yPos + 5);
                doc.text('Area', colArea, yPos + 5);
                doc.text('Rate', colRate, yPos + 5);
                doc.text('Amount', colAmount, yPos + 5, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                yPos += 9;
                if (costs.floorMaterial > 0) {
                    doc.text('Floor Tile', colDesc, yPos);
                    doc.text(`${area} sq ft`, colArea, yPos);
                    doc.text(String(costs.floorRate), colRate, yPos);
                    doc.text(formatCurrency(costs.floorMaterial), colAmount, yPos, { align: 'right' });
                    yPos += 7;
                }
                if (costs.wallMaterial > 0) {
                    doc.text('Wall Tile', colDesc, yPos);
                    doc.text(`${area} sq ft`, colArea, yPos);
                    doc.text(String(costs.wallRate), colRate, yPos);
                    doc.text(formatCurrency(costs.wallMaterial), colAmount, yPos, { align: 'right' });
                    yPos += 7;
                }
                doc.setFillColor(227, 242, 253);
                doc.rect(margin, yPos, contentWidth, 7, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Room Total:', colDesc, yPos + 5);
                doc.text(formatCurrency(costs.roomTotal), colAmount, yPos + 5, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                yPos += 12;
            });
        });

        if (totals.skirtingCost > 0 || totals.holeCost > 0) {
            if (yPos > pageHeight - margin - 30) { doc.addPage(); yPos = margin; }
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            if (totals.skirtingCost > 0) { doc.text(`Skirting: ${bill.extras.skirting.length} ft x ${rates.skirting} = ${formatCurrency(totals.skirtingCost)}`, margin, yPos); yPos += 6; }
            if (totals.holeCost > 0) { doc.text(`Hole Fittings: ${bill.extras.holes.count} x ${rates.hole} = ${formatCurrency(totals.holeCost)}`, margin, yPos); yPos += 6; }
            yPos += 3;
        }

        if (yPos > pageHeight - margin - 25) { doc.addPage(); yPos = margin; }
        doc.setDrawColor(30, 136, 229);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
        doc.setFillColor(227, 242, 253);
        doc.roundedRect(margin, yPos - 5, contentWidth, 14, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 136, 229);
        doc.text('Grand Total:', margin + 5, yPos + 5);
        doc.text(formatCurrency(totals.grandTotal), pageWidth - margin - 5, yPos + 5, { align: 'right' });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated by Thikaidar Bill Generator  |  Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        }

        const fileName = `Thikaidar_Bill_${bill.customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        showToast('PDF downloaded!', 'success');
    } catch (error) {
        console.error('PDF Error:', error);
        showToast('PDF export failed: ' + error.message, 'error');
    }
}

// ===== WhatsApp Share =====
function shareToWhatsApp(forceTextOnly = false) {
    const bill = AppState.bill;
    const totals = calculateTotalCosts();
    let message = `*Thikaidar Bill*\n─────────────────\n`;
    message += `*Customer:* ${bill.customer.name}\n*Phone:* ${bill.customer.phone}\n*Address:* ${bill.customer.address}\n─────────────────\n`;
    bill.floors.forEach(floor => {
        floor.rooms.forEach(room => {
            const area = (parseFloat(room.length) || 0) * (parseFloat(room.breadth) || 0);
            const workLabel = room.workType === 'floor' ? 'Floor' : room.workType === 'wall' ? 'Wall' : 'Floor+Wall';
            message += `${room.name} (${floor.name}): ${room.length}'x${room.breadth}' = ${area} sq ft [${workLabel}]\n`;
        });
    });
    if (totals.skirtingCost > 0) message += `Skirting: ${bill.extras.skirting.length}ft x Rs${bill.rates.skirting} = Rs${totals.skirtingCost}\n`;
    if (totals.holeCost > 0) message += `Hole Fittings: ${bill.extras.holes.count} x Rs${bill.rates.hole} = Rs${totals.holeCost}\n`;
    message += `─────────────────\n*GRAND TOTAL: Rs${totals.grandTotal}*\n─────────────────\nGenerated by Thikaidar Bill`;

    if (!forceTextOnly && navigator.share) {
        navigator.share({ title: 'Thikaidar Bill', text: message })
            .then(() => showToast('Shared successfully!', 'success'))
            .catch((e) => { if (e.name !== 'AbortError') openWhatsAppLink(message, bill.customer.phone); });
        return;
    }
    openWhatsAppLink(message, bill.customer.phone);
}

function openWhatsAppLink(message, phone) {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone.length >= 10
        ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
        : `https://web.whatsapp.com/send?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
}

// ===== Event Listeners =====
function initEventListeners() {
    document.getElementById('startNewBillBtn').addEventListener('click', startNewBill);
    document.getElementById('loadBillBtn').addEventListener('click', showSavedBills);
    document.getElementById('hindiLangBtn').addEventListener('click', () => selectLanguage('hi'));
    document.getElementById('englishLangBtn').addEventListener('click', () => selectLanguage('en'));
    document.getElementById('newBillBtn').addEventListener('click', () => { if (confirm('Start new bill?')) location.reload(); });
    document.getElementById('savedBillsBtn').addEventListener('click', showSavedBills);
    document.getElementById('collapseBtn').addEventListener('click', () => DOM.billPreview.classList.toggle('collapsed'));
    DOM.sendBtn.addEventListener('click', handleTextInput);
    DOM.textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const step = QuestionFlow[AppState.currentStep];
            if (step && step.inputType === 'phone') {
                e.preventDefault();
                showToast('Press confirm button or keep typing', 'info');
            } else {
                handleTextInput();
            }
        }
    });
    document.getElementById('closeSavedBillsBtn').addEventListener('click', () => DOM.savedBillsModal.classList.remove('active'));
    document.getElementById('closeFullBillBtn').addEventListener('click', () => DOM.fullBillModal.classList.remove('active'));
    document.getElementById('previewBillBtn').addEventListener('click', showFullBill);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
    document.getElementById('whatsappShareBtn').addEventListener('click', shareToWhatsApp);
    document.getElementById('printBillBtn').addEventListener('click', printBill);
    document.getElementById('exportFullPdfBtn').addEventListener('click', exportPdf);
    [DOM.savedBillsModal, DOM.fullBillModal].forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    });
    document.getElementById('languageBtn').addEventListener('click', () => {
        selectLanguage(AppState.language === 'en' ? 'hi' : 'en');
    });
    if (DOM.voiceOutputBtn) {
        DOM.voiceOutputBtn.addEventListener('click', toggleVoiceOutput);
        DOM.voiceOutputBtn.classList.add('active');
    }
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
        const keyInput = document.getElementById('groqApiKey');
        if (keyInput) keyInput.value = savedKey;
    }
    const apiKeyInput = document.getElementById('groqApiKey');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('change', (e) => {
            saveApiKey(e.target.value.trim());
            showToast('API Key saved', 'success');
        });
    }
}

function selectLanguage(lang) {
    AppState.language = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('selected', btn.dataset.lang === lang));
    document.getElementById('languageBtn').querySelector('span').textContent = lang === 'en' ? 'EN' : 'HI';
    document.getElementById('newBillBtnText').textContent = lang === 'hi' ? 'Naya Bill' : 'New Bill';
    document.getElementById('loadBillBtnText').textContent = lang === 'hi' ? 'Purana Bill' : 'Load Bill';
    updateInputPlaceholder();
    if (AppState.recognition) {
        AppState.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    }
}

function updateInputPlaceholder() {
    const step = QuestionFlow[AppState.currentStep];
    if (step && step.inputType === 'phone') {
        DOM.textInput.placeholder = AppState.language === 'hi' ? 'Digits bolo ya type karo...' : 'Speak or type digits...';
    } else if (step && step.inputType === 'dimensions') {
        DOM.textInput.placeholder = AppState.language === 'hi' ? '12 by 14 bolo...' : '12 by 14 say...';
    } else {
        DOM.textInput.placeholder = AppState.language === 'hi' ? 'Type karo...' : 'Type here...';
    }
}

// ===== AI Integration =====
let GROQ_API_KEY = localStorage.getItem('groq_api_key') || '';

function saveApiKey(key) {
    if (key && key.trim().length > 0) {
        GROQ_API_KEY = key.trim();
        localStorage.setItem('groq_api_key', GROQ_API_KEY);
        return true;
    } else {
        GROQ_API_KEY = '';
        localStorage.removeItem('groq_api_key');
        return false;
    }
}

async function getAIResponse(transcript, currentStep, options) {
    if (!GROQ_API_KEY) return null;
    const stepQuestion = getQuestion(currentStep) || '';
    const valueToOption = {};
    options.forEach(o => {
        valueToOption[o.value] = o;
        if (o.label.hi) valueToOption[o.label.hi.toLowerCase()] = o;
        if (o.label.en) valueToOption[o.label.en.toLowerCase()] = o;
    });
    const prompt = `User said: "${transcript}"\nQuestion: "${stepQuestion}"\nAvailable option values: ${options.map(o => o.value).join(', ')}\nReturn ONLY the exact option value that matches. No explanation.`;
    try {
        showToast('AI samajh raha hai...', 'info');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama-3.2-3b-preview', messages: [{ role: 'user', content: prompt }], max_tokens: 50, temperature: 0.1 })
        });
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content?.trim().replace(/"/g, '') || '';
        if (valueToOption[answer]) return valueToOption[answer];
        for (const [key, option] of Object.entries(valueToOption)) {
            if (answer.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(answer.toLowerCase())) return option;
        }
        return null;
    } catch (e) {
        console.error('AI Error:', e);
        return null;
    }
}

// ===== Voice Recognition =====
function initVoiceRecognition() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
        if (DOM.voiceBtn) DOM.voiceBtn.style.display = 'none';
        return;
    }
    AppState.recognition = new SpeechRecognitionAPI();
    AppState.recognition.continuous = false;
    AppState.recognition.interimResults = true;
    AppState.recognition.lang = 'hi-IN';

    AppState.recognition.onstart = () => {
        AppState.isRecording = true;
        AppState.voiceTranscriptBuffer = '';
        DOM.voiceBtn.classList.add('recording');
        DOM.voiceBtn.querySelector('.mic-icon').style.display = 'none';
        DOM.voiceBtn.querySelector('.stop-icon').style.display = 'block';
        showToast('Sun raha hai... boliye', 'info');
    };
    AppState.recognition.onend = () => {
        AppState.isRecording = false;
        DOM.voiceBtn.classList.remove('recording');
        DOM.voiceBtn.querySelector('.mic-icon').style.display = 'block';
        DOM.voiceBtn.querySelector('.stop-icon').style.display = 'none';
    };
    AppState.recognition.onresult = (event) => {
        const result = event.results[0];
        const transcript = result[0].transcript;
        const step = QuestionFlow[AppState.currentStep];
        if (result.isFinal) {
            AppState.voiceTranscriptBuffer = transcript;
            if (step.inputType === 'phone') {
                const digits = transcript.replace(/\D/g, '');
                const currentValue = DOM.textInput.value.replace(/\D/g, '');
                DOM.textInput.value = digits.length > currentValue.length ? digits : (digits || currentValue);
            } else {
                handleVoiceInput(transcript);
            }
        } else {
            AppState.voiceTranscriptBuffer = transcript;
            if (step.inputType === 'phone') {
                DOM.textInput.value = transcript.replace(/\D/g, '');
            } else {
                DOM.textInput.value = transcript;
            }
        }
    };
    AppState.recognition.onerror = (event) => {
        AppState.isRecording = false;
        DOM.voiceBtn.classList.remove('recording');
        DOM.voiceBtn.querySelector('.mic-icon').style.display = 'block';
        DOM.voiceBtn.querySelector('.stop-icon').style.display = 'none';
        const errorMessages = {
            'no-speech': 'Kuch nahi suna. Phir se try karo.',
            'audio-capture': 'Microphone nahi mila.',
            'not-allowed': 'Microphone ki permission den.',
            'network': 'Network error.',
            'aborted': 'Rok diya.'
        };
        showToast(errorMessages[event.error] || 'Voice error: ' + event.error, 'error');
    };
    DOM.voiceBtn.addEventListener('click', toggleVoiceRecording);
}

function toggleVoiceRecording() {
    if (AppState.isRecording) {
        AppState.recognition.stop();
    } else {
        AppState.recognition.lang = AppState.language === 'hi' ? 'hi-IN' : 'en-US';
        AppState.recognition.start();
    }
}

async function handleVoiceInput(transcript) {
    if (!transcript) return;
    const step = QuestionFlow[AppState.currentStep];

    if (step.inputType === 'phone') {
        const digits = transcript.replace(/\D/g, '');
        if (digits.length > 0) {
            const newValue = DOM.textInput.value.replace(/\D/g, '') + digits;
            DOM.textInput.value = newValue;
            if (newValue.length >= 10) showToast('Phone number ready! Press OK', 'success');
        }
        return;
    }

    if (step.inputType === 'dimensions') {
        if (isProcessingDimensions) return;
        isProcessingDimensions = true;
        DOM.textInput.value = '';
        const dimensions = parseDimensions(transcript);
        if (dimensions) {
            addMessage(`Length: ${dimensions.length}', Breadth: ${dimensions.breadth}'`, 'user');
            saveDimensionsAndAdvance(dimensions);
        } else {
            addMessage(`Suna: "${transcript}" - Samajh nahi aaya. Bolo: 12 by 14`, 'system');
        }
        isProcessingDimensions = false;
        return;
    }

    if (step.inputType === 'quick') {
        let matchedOption = findMatchingOption(transcript, step.options);
        if (!matchedOption && GROQ_API_KEY) {
            matchedOption = await getAIResponse(transcript, AppState.currentStep, step.options);
        }
        if (matchedOption) {
            handleQuickButton(matchedOption.value);
        } else {
            addMessage(`Suna: "${transcript}" - Samajh nahi aaya. Button dabao.`, 'system');
        }
    } else if (step.inputType === 'number') {
        const numMatch = transcript.match(/\d+/);
        if (numMatch) {
            DOM.textInput.value = numMatch[0];
            handleTextInput();
            return;
        }
        const hindiNumbers = {
            'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
            'बीस': 20, 'तीस': 30, 'चालीस': 40, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90, 'सौ': 100,
            'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'chah': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
            'bees': 20, 'tees': 30, 'chaalis': 40, 'pachaas': 50, 'sau': 100, 'hazaar': 1000
        };
        for (const [word, num] of Object.entries(hindiNumbers)) {
            if (transcript.includes(word)) {
                DOM.textInput.value = String(num);
                handleTextInput();
                return;
            }
        }
        addMessage(`Suna: "${transcript}" - Number nahi samjha. Type karo.`, 'system');
    } else {
        DOM.textInput.value = transcript;
        handleTextInput();
    }
}

function findMatchingOption(transcript, options) {
    const transcriptLower = transcript.toLowerCase().trim();

    function similarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        if (longer.length === 0) return 1.0;
        return (longer.length - editDistance(longer, shorter)) / longer.length;
    }
    function editDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) costs[j] = j;
                else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    const noPatterns = /\b(nahi|nahin|no|nah|nhi)\b/i;
    if (noPatterns.test(transcriptLower) || transcript.includes('नहीं') || transcript.includes('नही')) {
        return options.find(o => o.value === 'no') || null;
    }
    const yesPatterns = /\b(haan|han|yes|ji|yeah)\b/i;
    if (yesPatterns.test(transcriptLower) || transcript.includes('हाँ') || transcript.includes('हां')) {
        return options.find(o => o.value === 'yes') || null;
    }

    const currentStep = AppState.currentStep;
    let mappings = {};
    if (currentStep === 'floorSelection') {
        mappings = {
            'ground': 'Ground Floor', 'graund': 'Ground Floor',
            'first': 'First Floor', 'pahla': 'First Floor', 'पहली': 'First Floor',
            'second': 'Second Floor', 'दूसरी': 'Second Floor',
            'third': 'Third Floor', 'तीसरी': 'Third Floor',
            'doosra': 'Custom', 'other': 'Custom', 'custom': 'Custom'
        };
    } else if (currentStep === 'roomName') {
        mappings = {
            'master': 'Master Bedroom', 'मास्टर': 'Master Bedroom',
            'bedroom': 'Bedroom', 'बेडरूम': 'Bedroom', 'bed': 'Bedroom',
            'guest': 'Guest Room', 'drawing': 'Drawing Room',
            'hall': 'Hall', 'हॉल': 'Hall',
            'kitchen': 'Kitchen', 'किचन': 'Kitchen',
            'bathroom': 'Bathroom', 'बाथरूम': 'Bathroom',
            'toilet': 'Toilet', 'टॉयलेट': 'Toilet',
            'balcony': 'Balcony', 'store': 'Store Room',
            'room': 'Room', 'other': 'Room'
        };
    } else if (currentStep === 'tileType') {
        mappings = { '2x2': '2x2', '2x1': '2x1', '1x1': '1x1', 'custom': 'Custom', 'doosra': 'Custom' };
    } else if (currentStep === 'workType') {
        mappings = {
            'floor': 'floor', 'niche': 'floor', 'नीचे': 'floor',
            'wall': 'wall', 'opar': 'wall', 'upar': 'wall', 'ऊपर': 'wall',
            'both': 'both', 'dono': 'both', 'दोनों': 'both'
        };
    }

    for (const option of options) {
        const labelHi = option.label.hi || '';
        if (labelHi && transcript.includes(labelHi)) return option;
    }
    for (const [key, value] of Object.entries(mappings)) {
        if (transcriptLower.includes(key) || transcript.includes(key)) {
            const option = options.find(o => o.value === value);
            if (option) return option;
        }
    }
    for (const option of options) {
        const labelEn = option.label.en || '';
        if (transcriptLower.includes(labelEn.toLowerCase())) return option;
    }

    let bestMatch = null, bestScore = 0;
    for (const option of options) {
        const labelHi = option.label.hi || '', labelEn = option.label.en || '';
        const score = Math.max(similarity(transcriptLower, labelHi.toLowerCase()), similarity(transcriptLower, labelEn.toLowerCase()));
        if (score > bestScore && score > 0.5) { bestScore = score; bestMatch = option; }
    }
    return bestMatch;
}

// ===== Room Measurement =====
let measurementCorners = [];
let roomPhotoStream = null;

function openMeasurementOverlay() {
    document.getElementById('measurementOverlay').style.display = 'flex';
    document.getElementById('measureChoices').style.display = 'flex';
    document.getElementById('cameraView').style.display = 'none';
    document.getElementById('photoReview').style.display = 'none';
}

function closeMeasurementOverlay() {
    document.getElementById('measurementOverlay').style.display = 'none';
    if (roomPhotoStream) {
        roomPhotoStream.getTracks().forEach(t => t.stop());
        roomPhotoStream = null;
    }
}

async function startCameraMeasure() {
    document.getElementById('measureChoices').style.display = 'none';
    document.getElementById('cameraView').style.display = 'flex';
    try {
        roomPhotoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        document.getElementById('measureVideo').srcObject = roomPhotoStream;
    } catch (e) {
        showToast("Camera nahi chalu hua. Manual likho.", "error");
        enterManualMeasure();
    }
}

document.getElementById('captureBtn').addEventListener('click', () => {
    const video = document.getElementById('measureVideo');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    document.getElementById('reviewPhoto').src = canvas.toDataURL('image/jpeg');
    document.getElementById('cameraView').style.display = 'none';
    document.getElementById('photoReview').style.display = 'flex';
    document.getElementById('cornerInstruction').textContent = "Charo kone par tap karo (1/4)";
    measurementCorners = [];
    updateCornerOverlay();
    if (roomPhotoStream) { roomPhotoStream.getTracks().forEach(t => t.stop()); roomPhotoStream = null; }
});

function retakePhoto() {
    document.getElementById('photoReview').style.display = 'none';
    startCameraMeasure();
}

document.getElementById('photoContainer').addEventListener('click', (e) => {
    if (measurementCorners.length >= 4) return;
    const rect = e.currentTarget.getBoundingClientRect();
    measurementCorners.push({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
    updateCornerOverlay();
    if (measurementCorners.length < 4) {
        document.getElementById('cornerInstruction').textContent = `Charo kone par tap karo (${measurementCorners.length + 1}/4)`;
    } else {
        document.getElementById('cornerInstruction').textContent = "Sab corners mark ho gaye! ✅";
        document.getElementById('confirmCornersBtn').disabled = false;
    }
});

function updateCornerOverlay() {
    const svg = document.getElementById('cornerSvg');
    svg.innerHTML = '';
    if (measurementCorners.length > 1) {
        let pathD = `M ${measurementCorners[0].x * 100}% ${measurementCorners[0].y * 100}%`;
        for (let i = 1; i < measurementCorners.length; i++) {
            pathD += ` L ${measurementCorners[i].x * 100}% ${measurementCorners[i].y * 100}%`;
        }
        svg.innerHTML += `<path d="${pathD}" class="corner-line" />`;
    }
    measurementCorners.forEach((c, i) => {
        svg.innerHTML += `<circle cx="${c.x * 100}%" cy="${c.y * 100}%" r="8" class="corner-dot" />`;
        svg.innerHTML += `<text x="${c.x * 100}%" y="${c.y * 100}%" fill="white" font-size="12" text-anchor="middle" dominant-baseline="middle">${i + 1}</text>`;
    });
}

function calculateRoomAreaFromCorners() {
    closeMeasurementOverlay();
    addMessage("Room ki photo le li! ✅ Ab dimensions type karo (feet mein). Jaise: 12 by 14", 'system');
    lastShownQuestion = null;
    AppState.currentStep = 'roomDimensionsManual';
    showQuestion('roomDimensionsManual');
}

function enterManualMeasure() {
    closeMeasurementOverlay();
    lastShownQuestion = null;
    AppState.currentStep = 'roomDimensionsManual';
    showQuestion('roomDimensionsManual');
}

document.getElementById('closeMeasureBtn').addEventListener('click', () => {
    closeMeasurementOverlay();
    enterManualMeasure();
});