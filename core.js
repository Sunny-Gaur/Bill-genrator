(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.BillCore = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function toNumber(value) {
        const num = parseFloat(value);
        return Number.isFinite(num) ? num : 0;
    }

    function createEmptyBill() {
        return {
            id: null,
            customer: { name: '', phone: '', address: '', houseNumber: '' },
            floors: [],
            rates: { floor: 0, wall: 0, skirting: 0, hole: 0 },
            extras: {
                skirting: { enabled: false, length: 0 },
                holes: { enabled: false, count: 0 }
            },
            customNotes: [],
            createdAt: null,
            updatedAt: null
        };
    }

    function createEmptyRoom() {
        return {
            name: '',
            length: 0,
            breadth: 0,
            minusArea: 0,
            tileType: '',
            workType: '',
            floorRate: 0,
            wallRate: 0,
            imageData: null,
            notes: ''
        };
    }

    function calculateRoomArea(room) {
        if (!room) return 0;
        return toNumber(room.length) * toNumber(room.breadth);
    }

    function calculateNetRoomArea(room) {
        if (!room) return 0;
        return Math.max(0, calculateRoomArea(room) - toNumber(room.minusArea));
    }

    function calculateRoomCosts(room, rates) {
        const area = calculateRoomArea(room);
        const minusArea = toNumber(room && room.minusArea);
        const finalArea = calculateNetRoomArea(room);
        const floorRate = toNumber(room && room.floorRate) || toNumber(rates && rates.floor);
        const wallRate = toNumber(room && room.wallRate) || toNumber(rates && rates.wall);
        const costs = { floorMaterial: 0, wallMaterial: 0 };

        if (room && (room.workType === 'floor' || room.workType === 'both')) {
            costs.floorMaterial = finalArea * floorRate;
        }
        if (room && (room.workType === 'wall' || room.workType === 'both')) {
            costs.wallMaterial = finalArea * wallRate;
        }

        return {
            ...costs,
            area,
            minusArea,
            finalArea,
            roomTotal: costs.floorMaterial + costs.wallMaterial,
            floorRate,
            wallRate
        };
    }

    function calculateTotalCosts(bill) {
        const safeBill = bill || createEmptyBill();
        const rates = safeBill.rates || {};
        const totals = {
            floorArea: 0,
            deductedArea: 0,
            netArea: 0,
            floorMaterial: 0,
            wallMaterial: 0,
            skirtingCost: 0,
            holeCost: 0,
            grandTotal: 0
        };

        (safeBill.floors || []).forEach((floor) => {
            (floor.rooms || []).forEach((room) => {
                const costs = calculateRoomCosts(room, rates);
                totals.floorArea += costs.area;
                totals.deductedArea += costs.minusArea;
                totals.netArea += costs.finalArea;
                totals.floorMaterial += costs.floorMaterial;
                totals.wallMaterial += costs.wallMaterial;
            });
        });

        if (safeBill.extras && safeBill.extras.skirting && safeBill.extras.skirting.enabled) {
            totals.skirtingCost = toNumber(safeBill.extras.skirting.length) * toNumber(rates.skirting);
        }
        if (safeBill.extras && safeBill.extras.holes && safeBill.extras.holes.enabled) {
            totals.holeCost = toNumber(safeBill.extras.holes.count) * toNumber(rates.hole);
        }

        totals.grandTotal = totals.floorMaterial + totals.wallMaterial + totals.skirtingCost + totals.holeCost;
        return totals;
    }

    function parseDimensions(input) {
        const text = String(input || '').toLowerCase().trim();
        if (!text) return null;

        const normalized = text.replace(/[×✕✖]/g, 'x');
        const patterns = [
            /(\d+(?:\.\d+)?)\s*(?:by|x|-)\s*(\d+(?:\.\d+)?)/i,
            /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/
        ];

        for (const pattern of patterns) {
            const match = normalized.match(pattern);
            if (match) {
                const length = toNumber(match[1]);
                const breadth = toNumber(match[2]);
                if (length > 0 && length <= 500 && breadth > 0 && breadth <= 500) {
                    return { length, breadth };
                }
            }
        }

        const wordToNumber = {
            ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chah: 6, saat: 7, aath: 8, nau: 9, das: 10,
            gyarah: 11, barah: 12, tera: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17, atharah: 18, unis: 19, bees: 20
        };

        const values = [];
        normalized.split(/\s+/).forEach((word) => {
            if (wordToNumber[word]) values.push(wordToNumber[word]);
            const digitMatch = word.match(/\d+/);
            if (digitMatch) values.push(toNumber(digitMatch[0]));
        });

        if (values.length >= 2 && values[0] > 0 && values[1] > 0 && values[0] <= 500 && values[1] <= 500) {
            return { length: values[0], breadth: values[1] };
        }

        return null;
    }

    function normalizePhoneNumber(value) {
        return String(value || '').replace(/\D/g, '');
    }

    return {
        createEmptyBill,
        createEmptyRoom,
        calculateRoomArea,
        calculateNetRoomArea,
        calculateRoomCosts,
        calculateTotalCosts,
        parseDimensions,
        normalizePhoneNumber
    };
}));
