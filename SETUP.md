# Thikaidar Bill Generator - Setup & Development Guide

## Quick Start

### For Users
1. **Open the Application**
   - Navigate to: `http://localhost/open-code-projects/voice-bill-genrator/`
   - Or simply open `index.html` in your browser

2. **Create Your First Bill**
   - Select language (Hindi/English)
   - Click "New Bill" / "Naya Bill"
   - Follow the guided questions
   - Export as PDF or share via WhatsApp

3. **Optional: Add Groq API Key for Better Voice**
   - Get a free API key at https://console.groq.com
   - Enter it on the welcome screen
   - The key is saved locally for future use

### For Developers

#### Prerequisites
- Modern web browser (Chrome, Firefox, Edge recommended)
- XAMPP or any local web server (for voice features to work properly)
- Text editor (VS Code recommended)

#### Project Structure
```
voice-bill-genrator/
├── index.html          # Main HTML structure
├── styles.css          # All styling (responsive, mobile-first)
├── app.js              # Application logic (2166 lines)
├── README.md           # Project overview
├── SPEC.md             # Design specification
├── TESTS.md            # Test cases and testing guide
├── SETUP.md            # This file
├── history.md          # Development history
├── session.md          # Session summaries
└── plain.md            # Build steps documentation
```

#### Architecture Overview

**State Management**
```javascript
AppState = {
    bill: { /* Current bill data */ },
    currentStep: 'customerName',  // Current question in flow
    currentFloorIndex: -1,        // Active floor being edited
    currentRoomIndex: -1,         // Active room being edited
    language: 'hi',               // 'hi' or 'en'
    voiceOutputEnabled: true,     // Text-to-speech toggle
    recognition: null,            // SpeechRecognition instance
    isRecording: false            // Voice recording state
}
```

**Question Flow System**
The app uses a state machine pattern defined in `QuestionFlow` object:
```javascript
const QuestionFlow = {
    customerName: {
        question: { en: "Customer name?", hi: "Customer ka naam kya hai?" },
        inputType: 'text',        // text, phone, number, quick, dimensions, upload
        next: 'phoneNumber',      // Next step in flow
        saveTo: 'customer.name'   // Where to save the answer
    },
    // ... more steps
}
```

**Key Modules** (all in app.js):
1. **State Management** (lines 1-50): AppState initialization
2. **Question Flow** (lines 52-240): Guided conversation logic
3. **Chat UI** (lines 242-350): Message rendering and UI updates
4. **Navigation** (lines 352-650): Bill flow control
5. **Calculations** (lines 270-320): Cost computation logic
6. **Preview Panel** (lines 850-950): Real-time bill preview
7. **Edit Functions** (lines 950-1100): Room/bill editing
8. **Storage** (lines 1050-1100): LocalStorage operations
9. **Modals** (lines 1100-1250): Saved bills, full bill view
10. **PDF Export** (lines 1250-1500): jsPDF integration
11. **WhatsApp** (lines 1500-1550): Share functionality
12. **Event Listeners** (lines 1550-1650): UI event binding
13. **AI Integration** (lines 1670-1750): Groq API voice matching
14. **Voice Recognition** (lines 1750-1850): Speech-to-text
15. **Voice Input Handler** (lines 1850-2000): Process voice input
16. **Option Matcher** (lines 2000-2166): Voice-to-option matching

---

## Development Workflow

### Making Changes

1. **Understand the Flow First**
   - Read `SPEC.md` for design intentions
   - Read `plain.md` for current feature status
   - Check `TESTS.md` for testing procedures

2. **Edit Code**
   - All logic is in `app.js`
   - Styles in `styles.css`
   - Structure in `index.html`

3. **Test Your Changes**
   - Open browser DevTools (F12)
   - Follow test cases in `TESTS.md`
   - Check console for errors

4. **Common Modifications**

**Add New Question Step:**
```javascript
// In QuestionFlow object
myNewStep: {
    question: { en: "Your question?", hi: "Aapka prashn?" },
    inputType: 'text',          // or 'quick', 'number', etc.
    options: [...],             // if inputType === 'quick'
    next: 'nextStep',           // or use checkNext for conditional
    saveTo: 'customer.field'    // where to save
}
```

**Add New Room Type:**
```javascript
// In QuestionFlow.roomName.options
{ value: 'Laundry Room', label: { en: 'Laundry Room', hi: 'Laundry Room' } }
```

**Modify Calculations:**
```javascript
// Edit calculateRoomCosts() function
// Edit calculateTotalCosts() function
```

**Add New Export Format:**
```javascript
// Create new function like exportPdf()
// Add button in HTML
// Add event listener in initEventListeners()
```

---

## Voice Integration Details

### How Voice Input Works

1. **User clicks mic button**
2. **SpeechRecognition API** captures speech
3. **Text transcript** is obtained
4. **Pattern matching** tries to match to options
5. **If pattern matching fails**, AI (Groq) is called
6. **Matched option** is selected automatically

### Voice Output (Text-to-Speech)

- Click "Speak" button to toggle
- Questions are read aloud
- Options are read aloud
- Language matches selected language (Hindi/English)

### Groq AI Integration

**Purpose**: Improve voice matching for accents and Hindi speech

**How it works**:
1. User speaks (e.g., "तीसरा फ्लोर")
2. Speech-to-text captures: "teesra floor"
3. Pattern matching tries to find option
4. If fails, sends to Groq API with context
5. AI returns: "Third Floor"
6. System matches and selects option

**Cost**: Free tier available at https://console.groq.com

**Setup**: 
- Get API key from Groq console
- Enter on welcome screen
- Key saved to localStorage

---

## LocalStorage Data Structure

### Bills Storage
```javascript
// Key: 'thikaidar_bills'
// Value: JSON object
{
    "bill_id_1": { /* bill data */ },
    "bill_id_2": { /* bill data */ },
    ...
}
```

### Bill Object Structure
```javascript
{
    id: "unique_id",
    customer: {
        name: "Customer Name",
        phone: "1234567890",
        address: "Site Address",
        houseNumber: "House/Flat Number"
    },
    floors: [
        {
            name: "Ground Floor",
            rooms: [
                {
                    name: "Master Bedroom",
                    length: 12,
                    breadth: 10,
                    tileType: "2x2",
                    workType: "floor",  // 'floor', 'wall', 'both'
                    floorRate: 40,
                    wallRate: 0,
                    imageData: null  // base64 image string
                }
            ]
        }
    ],
    rates: {
        floor: 0,      // global rates (fallback)
        wall: 0,
        skirting: 10,
        hole: 50
    },
    extras: {
        skirting: { enabled: true, length: 50 },
        holes: { enabled: true, count: 5 }
    },
    minusArea: 0,
    customNotes: [
        { text: "Note text", timestamp: "2026-04-10T..." }
    ],
    createdAt: "2026-04-10T...",
    updatedAt: "2026-04-10T..."
}
```

### Other LocalStorage Keys
- `groq_api_key`: User's Groq API key
- `voiceOutputEnabled`: Text-to-speech preference

**Storage Limits**: 
- LocalStorage: ~5-10MB total
- Images: Max 2MB per image (validated)
- Warning: Large images can fill up storage quickly

---

## Troubleshooting

### Voice Input Not Working
1. Check browser compatibility (Chrome/Edge recommended)
2. Allow microphone permissions
3. Check console for errors
4. Verify Groq API key is entered (if using AI matching)

### PDF Export Fails
1. Check browser console for errors
2. Ensure jsPDF library is loaded (CDN link in HTML)
3. Check if bill data is valid
4. Try with simpler bill first

### Bills Not Saving
1. Check localStorage quota (F12 > Application > Local Storage)
2. Clear old bills if quota exceeded
3. Check for JavaScript errors in console

### Voice Output Not Working
1. Check browser supports SpeechSynthesis API
2. Ensure "Speak" button is activated (green)
3. Check system volume
4. Try different browser

### App Not Loading
1. Ensure XAMPP/Apache is running
2. Check file path is correct
3. Clear browser cache
4. Check console for syntax errors

---

## Performance Optimization

### Current Optimizations
- Event delegation where possible
- Lazy loading of bill preview
- Minimal DOM updates
- CSS animations instead of JS

### Future Improvements
- [ ] Virtual scrolling for long bill lists
- [ ] Image compression before localStorage
- [ ] IndexedDB for larger storage
- [ ] Web Workers for PDF generation
- [ ] Code splitting for faster load

---

## Browser Compatibility

| Feature | Chrome | Firefox | Edge | Safari |
|---------|--------|---------|------|--------|
| Speech Recognition | ✅ | ❌ | ✅ | ❌ |
| Speech Synthesis | ✅ | ✅ | ✅ | ✅ |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |
| PDF Export | ✅ | ✅ | ✅ | ✅ |
| Web Share API | ✅ (Mobile) | ❌ | ✅ | ✅ (Mobile) |

**Recommended**: Chrome or Edge for full feature support

---

## Contributing

### Code Style
- Use 4-space indentation
- Follow existing naming conventions
- Add comments for complex logic
- Test thoroughly before committing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
# ...

# Commit with descriptive message
git commit -m "feat: add support for custom room types"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions
- `chore:` Maintenance tasks

---

## Deployment

### Static Hosting (Recommended)
1. Upload all files to hosting service
2. Ensure `index.html` is accessible
3. No server-side processing needed
4. Works on GitHub Pages, Netlify, Vercel, etc.

### Local Network (Office Use)
1. Place in XAMPP `htdocs` directory
2. Start Apache server
3. Access via `http://localhost/voice-bill-genrator/`
4. Or access via LAN IP: `http://192.168.x.x/voice-bill-genrator/`

### Security Considerations
- ⚠️ **Never hardcode API keys** (already fixed)
- All data is client-side (localStorage)
- No server = no server-side vulnerabilities
- HTTPS recommended for production

---

## API Reference

### Core Functions

#### `calculateRoomCosts(room, rates)`
Calculates costs for a single room
- **Input**: Room object, rates object
- **Output**: `{floorMaterial, wallMaterial, area, finalArea, roomTotal, floorRate, wallRate}`

#### `calculateTotalCosts()`
Calculates complete bill totals
- **Input**: Uses `AppState.bill`
- **Output**: `{floorArea, floorMaterial, wallMaterial, skirtingCost, holeCost, grandTotal}`

#### `parseDimensions(input)`
Parses dimension string into object
- **Input**: String like "12 by 14", "12x14", etc.
- **Output**: `{length, breadth}` or `null`

#### `findMatchingOption(transcript, options)`
Matches voice transcript to option
- **Input**: Transcript string, options array
- **Output**: Matched option object or `null`

#### `sanitizeHTML(str)`
Escapes HTML to prevent XSS
- **Input**: String
- **Output**: Sanitized string

---

## Getting Help

1. Check `TESTS.md` for testing procedures
2. Check `SPEC.md` for design specifications
3. Check `history.md` for feature history
4. Check console for error messages
5. Review code comments in `app.js`

---

## License

MIT License - See README.md
