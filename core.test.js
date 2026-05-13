const assert = require('assert');
const Core = require('./core.js');

function test(name, fn) {
    try {
        fn();
        console.log('PASS', name);
    } catch (error) {
        console.error('FAIL', name);
        console.error(error.message);
        process.exitCode = 1;
    }
}

test('calculateRoomCosts uses per-room minus area', () => {
    const room = { length: 10, breadth: 12, minusArea: 20, workType: 'floor', floorRate: 40 };
    const costs = Core.calculateRoomCosts(room, { floor: 0, wall: 0 });
    assert.strictEqual(costs.area, 120);
    assert.strictEqual(costs.finalArea, 100);
    assert.strictEqual(costs.floorMaterial, 4000);
});

test('calculateTotalCosts sums room totals and extras', () => {
    const bill = Core.createEmptyBill();
    bill.floors = [{
        name: 'Ground Floor',
        rooms: [
            { name: 'Bedroom', length: 12, breadth: 10, minusArea: 10, workType: 'floor', floorRate: 40, wallRate: 0 },
            { name: 'Kitchen', length: 10, breadth: 8, minusArea: 0, workType: 'both', floorRate: 45, wallRate: 35 }
        ]
    }];
    bill.extras.skirting = { enabled: true, length: 50 };
    bill.extras.holes = { enabled: true, count: 5 };
    bill.rates = { floor: 0, wall: 0, skirting: 12, hole: 60 };

    const totals = Core.calculateTotalCosts(bill);
    assert.strictEqual(totals.floorArea, 200);
    assert.strictEqual(totals.deductedArea, 10);
    assert.strictEqual(totals.netArea, 190);
    assert.strictEqual(totals.floorMaterial, 8000);
    assert.strictEqual(totals.wallMaterial, 2800);
    assert.strictEqual(totals.skirtingCost, 600);
    assert.strictEqual(totals.holeCost, 300);
    assert.strictEqual(totals.grandTotal, 11700);
});

test('parseDimensions handles common formats', () => {
    assert.deepStrictEqual(Core.parseDimensions('12 by 14'), { length: 12, breadth: 14 });
    assert.deepStrictEqual(Core.parseDimensions('12x14'), { length: 12, breadth: 14 });
    assert.deepStrictEqual(Core.parseDimensions('12 14'), { length: 12, breadth: 14 });
});

test('parseDimensions handles Hinglish number words', () => {
    assert.deepStrictEqual(Core.parseDimensions('barah chaudah'), { length: 12, breadth: 14 });
});

test('normalizePhoneNumber strips non-digits', () => {
    assert.strictEqual(Core.normalizePhoneNumber('+91 98765-43210'), '919876543210');
});
