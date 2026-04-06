# Voice Bill Generator - Development History

## Overview
A web-based billing software for tile contractors (thikaidar) with a guided chat-based system that asks step-by-step questions to create detailed tile work bills.

---

## Features Implemented

### 1. Chat-Based Interface
- Step-by-step guided questions
- Quick reply buttons for options
- Text input for numbers and text
- Hindi language primary support
- Language toggle (Hindi/English)

### 2. Customer Information
- Customer name
- Phone number
- Site address
- House/Flat number

### 3. Floor Management
- Ground Floor
- First Floor
- Second Floor
- Third Floor
- Custom floors
- Multiple floors support

### 4. Room Types
- Master Bedroom
- Bedroom
- Guest Room
- Drawing Room
- Hall
- Kitchen
- Bathroom
- Toilet
- Balcony
- Store Room
- Other/Custom

### 5. Room Details
- Length input (in feet)
- Breadth input (in feet)
- Area calculation (Length × Breadth)
- Dynamic questions: "Bedroom ki lambai kitni feet hai?"

### 6. Tile Options
- 2x2 ft tiles
- 2x1 ft tiles
- 1x1 ft tiles
- Custom size

### 7. Work Type Selection
- Floor Only (Niche Floor Pe)
- Wall Only (Opar Wall Pe)
- Both (Dono Jagah)

### 8. Pricing
- Per room tile rate (different rate per room possible)
- Calculation: Area × Rate = Room Total
- Skirting rate (per foot)
- Hole fitting rate (per piece)

### 9. Extras
- Skirting (length in feet)
- Hole fittings (count)
- Minus area deduction

### 10. Question Flow
```
Customer Name → Phone → Address → House Number
↓
Select Floor → Number of Rooms
↓
Loop for each room:
  Room Type → Length → Breadth → Tile Size → Work Type → Rate
  ↓
  "Aur room hai?" (loop back or continue)
↓
"Aur floor hai?" (add more floors or continue)
↓
Skirting questions (once at end)
Hole fitting questions (once at end)
↓
Show Bill Summary
```

### 11. Bill Display
- Live preview panel
- Room-by-room breakdown
- Area × Rate = Cost per room
- Skirting and hole costs in grand total
- Full bill modal with print option

### 12. Storage
- LocalStorage save/load
- View saved bills
- Delete old bills

### 13. Voice Features
- **Voice Input (Speech-to-Text)**
  - Click mic button to speak
  - Hindi (hi-IN) and English support
  - Number recognition in Hindi and English
  
- **Voice Output (Text-to-Speech)**
  - "Speak" button to toggle
  - Reads questions aloud
  - Reads options aloud
  - Hindi and English voice

- **AI Integration (Groq API)**
  - Free API key: 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
  - Acts as intermediary for better voice understanding
  - Handles accent variations and typos
  - Matches Hindi Devanagari script to options

### 14. Voice Recognition Mappings
```
Floor Names:
- "ग्राउंड" / "ground" → Ground Floor
- "फर्स्ट" / "first" → First Floor
- "सेकंड" / "second" → Second Floor
- "थर्ड" / "third" → Third Floor
- "दूसरा" / "other" → Custom

Room Names:
- "मास्टर" / "master" → Master Bedroom
- "बेडरूम" / "bedroom" → Bedroom
- "हॉल" / "hall" → Hall
- "किचन" / "kitchen" → Kitchen
- etc.

Yes/No:
- "haan", "han", "ji" → Yes
- "nahi", "nahin" → No

Numbers:
- "ek" → 1, "do" → 2, "teen" → 3, "char" → 4
- "tees" → 30, "chaalis" → 40, "pachaas" → 50
- "bees" → 20, "tees" → 30, etc.
```

---

## Question Text Changes
| Original | Changed To |
|----------|-----------|
| "Kaam kahan lagana hai?" | "Tile kahan lagana hai?" |
| "Work type?" | Options: "Niche Floor Pe", "Opar Wall Pe", "Dono Jagah" |

---

## Files Structure
```
voice-bill-genrator/
├── index.html      # Main HTML structure
├── styles.css      # CSS styling (responsive, mobile-friendly)
├── app.js          # JavaScript logic
├── SPEC.md         # Design specification
└── plain.md       # Build documentation
```

---

## Known Issues Fixed
1. ✅ Rate per room (not global) - each room can have different rate
2. ✅ Skirting/holes asked once at end, not per room
3. ✅ "Aur room hai?" asked before "Aur floor hai?"
4. ✅ Work type skips irrelevant rate questions
5. ✅ Hindi Devanagari voice recognition
6. ✅ AI intermediary for better voice understanding

---

## Future Enhancements
- [ ] PDF export (currently uses print)
- [ ] Backend/database for cloud storage
- [ ] WhatsApp integration
- [ ] Share bill via link
- [ ] Multi-language support beyond Hindi/English
- [ ] Edit existing bill
- [ ] Duplicate bill feature
