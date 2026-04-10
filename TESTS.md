# Voice Bill Generator - Test Suite

This file contains manual test cases for the Voice Bill Generator application.

## How to Test

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge)
2. Open Developer Console (F12)
3. Follow test cases below

---

## Test Case 1: Cost Calculations ✅ Critical

### Test 1.1: Basic Room Calculation
```javascript
// Setup
const room = { length: 10, breadth: 12, workType: 'floor', floorRate: 40, wallRate: 0 };
const rates = { floor: 40, wall: 35, skirting: 10, hole: 50 };

// Calculate
const costs = calculateRoomCosts(room, rates);

// Expected:
// area: 120 sq ft
// floorMaterial: 120 * 40 = 4800
// wallMaterial: 0
// roomTotal: 4800
console.log('Test 1.1:', costs);
```

### Test 1.2: Both Work Types
```javascript
const room = { length: 15, breadth: 20, workType: 'both', floorRate: 45, wallRate: 35 };
const rates = { floor: 0, wall: 0, skirting: 0, hole: 0 };

const costs = calculateRoomCosts(room, rates);

// Expected:
// area: 300 sq ft
// floorMaterial: 300 * 45 = 13500
// wallMaterial: 300 * 35 = 10500
// roomTotal: 24000
console.log('Test 1.2:', costs);
```

### Test 1.3: Minus Area Deduction
```javascript
// Set up bill with minus area
AppState.bill.minusArea = 20;
const room = { length: 10, breadth: 10, workType: 'floor', floorRate: 50, wallRate: 0 };
const rates = { floor: 0, wall: 0, skirting: 0, hole: 0 };

const costs = calculateRoomCosts(room, rates);

// Expected:
// area: 100 sq ft
// finalArea: 100 - 20 = 80 sq ft
// floorMaterial: 80 * 50 = 4000
console.log('Test 1.3:', costs);
```

### Test 1.4: Total Bill Calculation
```javascript
// Setup complete bill
AppState.bill = {
    floors: [{
        name: 'Ground Floor',
        rooms: [
            { name: 'Bedroom', length: 12, breadth: 10, workType: 'floor', floorRate: 40, wallRate: 0 },
            { name: 'Kitchen', length: 10, breadth: 8, workType: 'both', floorRate: 45, wallRate: 35 }
        ]
    }],
    extras: {
        skirting: { enabled: true, length: 50 },
        holes: { enabled: true, count: 5 }
    },
    rates: { floor: 0, wall: 0, skirting: 12, hole: 60 },
    minusArea: 10
};

const totals = calculateTotalCosts();

// Expected:
// Bedroom: 120 sq ft, floor: 120 * 40 = 4800
// Kitchen: 80 sq ft, floor: 80 * 45 = 3600, wall: 80 * 35 = 2800
// Skirting: 50 * 12 = 600
// Holes: 5 * 60 = 300
// Grand Total: 4800 + 3600 + 2800 + 600 + 300 = 12100
console.log('Test 1.4:', totals);
```

---

## Test Case 2: Dimension Parsing

### Test 2.1: Standard Formats
```javascript
console.log(parseDimensions('12 by 14'));      // {length: 12, breadth: 14}
console.log(parseDimensions('12x14'));         // {length: 12, breadth: 14}
console.log(parseDimensions('12 14'));         // {length: 12, breadth: 14}
console.log(parseDimensions('12-14'));         // {length: 12, breadth: 14}
console.log(parseDimensions('12 by 14 feet')); // {length: 12, breadth: 14}
```

### Test 2.2: Hindi Numbers
```javascript
console.log(parseDimensions('baarah chaudah'));     // {length: 12, breadth: 14}
console.log(parseDimensions('do teen'));            // {length: 2, breadth: 3}
console.log(parseDimensions('das paanch'));         // {length: 10, breadth: 5}
```

### Test 2.3: Edge Cases
```javascript
console.log(parseDimensions('0 10'));          // null (invalid length)
console.log(parseDimensions('600 10'));        // null (exceeds max)
console.log(parseDimensions('abc'));           // null
console.log(parseDimensions(''));              // null
console.log(parseDimensions('10'));            // null (only one number)
```

---

## Test Case 3: Input Sanitization (XSS Prevention)

### Test 3.1: HTML Injection in Customer Name
```javascript
// Try adding malicious input
const maliciousName = '<script>alert("XSS")</script>';
AppState.bill.customer.name = maliciousName;

// Now call updatePreview() or showFinalSummary()
// The script should NOT execute
// It should be displayed as escaped text: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
```

### Test 3.2: Script in Room Name
```javascript
const room = {
    name: '<img src=x onerror=alert(1)>',
    length: 10,
    breadth: 10,
    workType: 'floor',
    floorRate: 40,
    wallRate: 0
};

// Add to bill and show summary
// Should not execute JavaScript
```

---

## Test Case 4: LocalStorage Operations

### Test 4.1: Save and Load Bill
```javascript
// Create a bill
AppState.bill = {
    id: 'test123',
    customer: { name: 'Test Customer', phone: '1234567890', address: 'Test Address', houseNumber: 'A-101' },
    floors: [{
        name: 'Ground Floor',
        rooms: [{ name: 'Bedroom', length: 12, breadth: 10, workType: 'floor', floorRate: 40, wallRate: 0, imageData: null }]
    }],
    rates: { floor: 0, wall: 0, skirting: 0, hole: 0 },
    extras: { skirting: { enabled: false, length: 0 }, holes: { enabled: false, count: 0 } },
    minusArea: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// Save
saveToLocalStorage();

// Load
const loaded = loadFromLocalStorage('test123');
console.log('Loaded bill:', loaded);
console.log('Match:', loaded.customer.name === 'Test Customer');
```

### Test 4.2: Get All Bills
```javascript
const allBills = getAllBills();
console.log('Total bills:', allBills.length);
console.log('Bills:', allBills);
```

### Test 4.3: Delete Bill
```javascript
deleteBill('test123');
const deleted = loadFromLocalStorage('test123');
console.log('Deleted:', deleted); // Should be null
```

---

## Test Case 5: Voice Option Matching

### Test 5.1: Floor Selection
```javascript
const floorOptions = QuestionFlow.floorSelection.options;

console.log(findMatchingOption('ground', floorOptions));      // Ground Floor
console.log(findMatchingOption('first floor', floorOptions)); // First Floor
console.log(findMatchingOption('दूसरा', floorOptions));      // Second Floor
console.log(findMatchingOption('third', floorOptions));       // Third Floor
console.log(findMatchingOption('other', floorOptions));       // Custom
```

### Test 5.2: Room Names
```javascript
const roomOptions = QuestionFlow.roomName.options;

console.log(findMatchingOption('master bedroom', roomOptions));  // Master Bedroom
console.log(findMatchingOption('bedroom', roomOptions));         // Bedroom
console.log(findMatchingOption('hall', roomOptions));            // Hall
console.log(findMatchingOption('किचन', roomOptions));             // Kitchen
console.log(findMatchingOption('bathroom', roomOptions));        // Bathroom
```

### Test 5.3: Yes/No Matching
```javascript
const yesNoOptions = [
    { value: 'yes', label: { en: 'Yes', hi: 'Haan' } },
    { value: 'no', label: { en: 'No', hi: 'Nahi' } }
];

console.log(findMatchingOption('haan', yesNoOptions));     // yes
console.log(findMatchingOption('nahi', yesNoOptions));     // no
console.log(findMatchingOption('जी', yesNoOptions));        // yes
console.log(findMatchingOption('हाँ', yesNoOptions));       // yes
console.log(findMatchingOption('नहीं', yesNoOptions));      // no
```

---

## Test Case 6: Error Handling

### Test 6.1: Invalid Phone Number
```javascript
// Try phone number with less than 10 digits
DOM.textInput.value = '12345';
handleTextInput();
// Should show error toast: "Phone number should be at least 10 digits"
```

### Test 6.2: Invalid Dimensions
```javascript
console.log(parseDimensions('invalid'));     // null
console.log(parseDimensions(''));            // null
console.log(parseDimensions('0 0'));         // null (invalid dimensions)
console.log(parseDimensions('1000 1000'));   // null (exceeds max)
```

### Test 6.3: LocalStorage Quota Exceeded
```javascript
// Try to save a very large bill with multiple large images
// Should show error toast instead of crashing
```

---

## Test Case 7: PDF Export

### Test 7.1: Basic PDF Export
```javascript
// Create a simple bill
AppState.bill = {
    id: 'pdf-test',
    customer: { name: 'PDF Test Customer', phone: '9876543210', address: 'Test Address', houseNumber: 'T-100' },
    floors: [{
        name: 'Ground Floor',
        rooms: [{
            name: 'Test Room',
            length: 12,
            breadth: 10,
            workType: 'both',
            floorRate: 40,
            wallRate: 35,
            tileType: '2x2',
            imageData: null
        }]
    }],
    rates: { floor: 0, wall: 0, skirting: 10, hole: 50 },
    extras: {
        skirting: { enabled: true, length: 30 },
        holes: { enabled: true, count: 3 }
    },
    minusArea: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customNotes: []
};

// Call export function
exportPdf();
// Should download PDF file without errors
```

---

## Test Case 8: WhatsApp Share

### Test 8.1: Share with Customer Phone
```javascript
// Create bill with customer phone
AppState.bill.customer.phone = '9876543210';

shareToWhatsApp();
// Should open WhatsApp with pre-filled message to customer
```

### Test 8.2: Share without Customer Phone
```javascript
// Create bill without customer phone
AppState.bill.customer.phone = '';

shareToWhatsApp();
// Should open WhatsApp web with pre-filled message
```

---

## Test Case 9: Edge Cases

### Test 9.1: Empty Bill
```javascript
// Try to export PDF with empty bill
// Should handle gracefully without crashing
```

### Test 9.2: Very Long Names
```javascript
// Try customer name with 500+ characters
// Should handle without breaking UI
```

### Test 9.3: Special Characters
```javascript
// Try names with special characters: @#$%^&*()
// Should display correctly without errors
```

---

## Manual Testing Checklist

- [ ] Welcome screen displays correctly
- [ ] Language toggle works (Hindi/English)
- [ ] New bill creation works
- [ ] Customer info collection works
- [ ] Floor addition works
- [ ] Room addition works
- [ ] Dimension input works (text and voice)
- [ ] Tile type selection works
- [ ] Work type selection works
- [ ] Rate input works
- [ ] Bill preview updates in real-time
- [ ] Bill summary displays correctly
- [ ] PDF export works
- [ ] WhatsApp share works
- [ ] Save/Load bills work
- [ ] Delete bills work
- [ ] Voice input works (if API key provided)
- [ ] Voice output works (speak button)
- [ ] Mobile responsive design works
- [ ] All error messages display correctly
- [ ] No console errors during normal usage

---

## Automated Test Script (Copy-Paste to Console)

```javascript
// Run all calculation tests
(function runTests() {
    console.log('=== Starting Test Suite ===\n');
    
    let passed = 0;
    let failed = 0;
    
    function test(name, actual, expected) {
        const pass = JSON.stringify(actual) === JSON.stringify(expected);
        if (pass) {
            console.log(`✅ ${name}`);
            passed++;
        } else {
            console.error(`❌ ${name}`);
            console.log('Expected:', expected);
            console.log('Actual:', actual);
            failed++;
        }
    }
    
    // Test dimensions
    test('Parse "12 by 14"', parseDimensions('12 by 14'), {length: 12, breadth: 14});
    test('Parse "12x14"', parseDimensions('12x14'), {length: 12, breadth: 14});
    test('Parse invalid', parseDimensions('invalid'), null);
    test('Parse too large', parseDimensions('600 10'), null);
    
    // Test calculations
    const room1 = { length: 10, breadth: 12, workType: 'floor', floorRate: 40, wallRate: 0 };
    const costs1 = calculateRoomCosts(room1, {floor: 0, wall: 0, skirting: 0, hole: 0});
    test('Room area', costs1.area, 120);
    test('Floor cost', costs1.floorMaterial, 4800);
    test('Room total', costs1.roomTotal, 4800);
    
    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
})();
```
