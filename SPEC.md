# Tile Contractor Billing Software - SPEC.md

## Concept & Vision

A guided, voice-first billing assistant for tile contractors (thikaidar) that transforms complex billing into a simple conversation. The app feels like talking to a helpful assistant who asks one question at a time, calculates everything automatically, and produces professional bills instantly. Designed for contractors who may not be tech-savvy but are comfortable with WhatsApp-style chat interfaces.

## Design Language

### Aesthetic Direction
Inspired by WhatsApp/Messenger chat interfaces with a professional contractor feel - clean, familiar, and mobile-first.

### Color Palette
- **Primary**: `#1e88e5` (Professional Blue)
- **Secondary**: `#43a047` (Success Green)
- **Accent**: `#ff9800` (Warning Orange)
- **Background**: `#f5f5f5` (Light Gray)
- **Chat Background**: `#e8e8e8`
- **User Bubble**: `#1e88e5`
- **System Bubble**: `#ffffff`
- **Text Primary**: `#212121`
- **Text Secondary**: `#757575`
- **Danger**: `#e53935`

### Typography
- **Primary Font**: 'Segoe UI', system-ui, sans-serif
- **Headings**: 600 weight
- **Body**: 400 weight
- **Input**: 16px minimum (prevents iOS zoom)

### Spatial System
- Base unit: 8px
- Chat bubbles: 12px padding, 16px margin
- Cards: 16px padding
- Buttons: 48px minimum height (touch-friendly)

### Motion Philosophy
- Smooth slide-in for new messages (300ms ease-out)
- Pulse animation for voice recording
- Subtle fade for state transitions
- Progress indicators for calculations

## Layout & Structure

### Main Layout
```
┌─────────────────────────────────┐
│  Header (Logo + Actions)        │
├─────────────────────────────────┤
│                                 │
│  Chat Area (Scrollable)         │
│  - System questions             │
│  - User responses               │
│  - Quick action buttons         │
│                                 │
├─────────────────────────────────┤
│  Input Area                     │
│  [Text Input] [Voice] [Send]    │
└─────────────────────────────────┘
```

### Sidebar (Bill Preview)
- Collapsible on mobile
- Shows real-time bill structure
- Allows editing existing entries

### Responsive Strategy
- Mobile-first (<768px): Single column, full-width chat
- Tablet (768px+): Chat + sidebar layout
- Desktop (1024px+): Full dashboard view

## Features & Interactions

### STEP 1: Project Setup (UI Only - Current)

#### 1.1 Welcome Screen
- App logo and tagline
- "New Bill" and "Load Bill" buttons
- Language selector (EN/HI)

#### 1.2 Customer Information Flow
Questions appear as chat bubbles:
1. "What is the customer's name?"
2. "Phone number?"
3. "Site address?"
4. "House number?"

Each question shows:
- Voice input button (animated when recording)
- Text input field
- Quick reply buttons where applicable

#### 1.3 Floor Management
- Floor selection: Ground Floor, First Floor, Second Floor, Custom
- "Add Another Floor" option
- Visual floor counter

#### 1.4 Room Details Flow
For each room:
1. Room name (preset options + custom)
2. Length input
3. Breadth input
4. Auto-calculated area display
5. Tile type selection (2x2, 1x1, etc.)
6. Work type (Floor/Wall/Both)

#### 1.5 Rate Input
- Floor tile rate (per sq ft)
- Wall tile rate (per sq ft)
- Skirting rate (per running foot)
- Hole fitting rate (per piece)

#### 1.6 Extra Work
- Skirting: Yes/No → Length input
- Hole fittings: Yes/No → Count input

#### 1.7 Minus Area
- Door/window deduction: Yes/No → Area input

#### 1.8 Confirmation System
- Summary popup after each major input
- Confirm/Edit/Retry buttons

#### 1.9 Bill Preview Panel
- Real-time cost calculation
- Expandable floor/room structure
- Inline editing capability

#### 1.10 Final Summary
- Complete cost breakdown
- Grand total display
- Edit option for any section

### Interaction Details

**Voice Button States:**
- Default: Microphone icon
- Recording: Red pulsing dot + "Listening..."
- Processing: Spinner
- Success: Checkmark flash
- Error: Shake animation + "Try again"

**Input States:**
- Empty: Placeholder text
- Focused: Blue border
- Filled: Black text
- Error: Red border + error message

**Quick Buttons:**
- Yes/No buttons (48px height, full-width on mobile)
- Floor/Room type chips (scrollable horizontal)

## Component Inventory

### ChatBubble
- System bubble: White, left-aligned, shadow
- User bubble: Blue, right-aligned, white text
- States: appearing (slide-in), static

### VoiceButton
- States: idle, recording, processing, success, error
- Visual: Circular, 56px, icon-only

### TextInput
- Large, touch-friendly (48px height)
- Clear button when filled
- States: empty, focused, filled, error

### QuickButton
- Pill-shaped buttons
- Primary (filled) and secondary (outlined) variants
- States: default, pressed, disabled

### FloorCard
- Collapsible header
- Room list inside
- Edit/delete actions
- Cost summary footer

### RoomItem
- Inline expandable
- Area display
- Item breakdown
- Individual cost

### BillSummary
- Section headers
- Cost rows
- Total row (highlighted)
- Action buttons

## Technical Approach

### Frontend (Step 1 - UI)
- Pure HTML5, CSS3, JavaScript (ES6+)
- No framework dependencies
- LocalStorage for bill data persistence
- CSS Grid/Flexbox for layout

### Voice Integration (Step 2)
- Web Speech API (SpeechRecognition)
- Fallback to manual input
- Number extraction from Hinglish

### Data Flow
```
User Input → State Manager → UI Update → LocalStorage
                    ↓
              Bill Preview
                    ↓
              Export Module
```

### State Management
Single bill object in memory, synced to LocalStorage:
```javascript
{
  customer: { name, phone, address, houseNumber },
  floors: [{ name, rooms: [{ name, length, breadth, area, items: [] }] }],
  rates: { floor: 0, wall: 0, skirting: 0, hole: 0 },
  extras: { skirting: { enabled, length }, holes: { enabled, count } },
  minusArea: 0,
  currentStep: 'welcome',
  currentFloor: 0,
  currentRoom: 0
}
```

## Step-by-Step Build Plan

1. **Step 1 (Current)**: UI Foundation
   - HTML structure
   - CSS styling (chat interface)
   - JavaScript state management
   - Question flow logic
   - Form inputs and quick buttons
   - Bill preview panel

2. **Step 2**: Voice Integration
   - Web Speech API setup
   - Hinglish number parsing
   - Voice feedback

3. **Step 3**: Backend & Database
   - API endpoints
   - Data persistence
   - PDF generation
