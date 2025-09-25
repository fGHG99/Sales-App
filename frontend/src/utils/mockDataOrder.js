import { mockProducts } from './mockDataProduct';

// Helper function to get product by ID
const getProduct = (id) => mockProducts.find(p => p.id === id);

export const mockOrders = [
    {
        id: "ORD-2024-001",
        orderDate: "2024-01-15T10:30:00Z",
        status: "completed",
        totalAmount: 4499550,
        items: [
            {
                productId: "prod-001",
                name: getProduct("prod-001")?.name || "Gaming Mechanical Keyboard",
                price: 2249850,
                quantity: 1,
                image: getProduct("prod-001")?.image || "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-002",
                name: getProduct("prod-002")?.name || "Wireless Gaming Mouse",
                price: 1349850,
                quantity: 1,
                image: getProduct("prod-002")?.image || "https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-003",
                name: getProduct("prod-003")?.name || "RGB Mousepad",
                price: 899850,
                quantity: 1,
                image: getProduct("prod-003")?.image || "https://images.unsplash.com/photo-1616197322138-af1c99c27fbf?w=300&h=300&fit=crop"
            }
        ]
    },
    {
        id: "ORD-2024-002",
        orderDate: "2024-01-20T14:15:00Z",
        status: "on_delivery",
        totalAmount: 13499550,
        items: [
            {
                productId: "prod-004",
                name: getProduct("prod-004")?.name || "RTX 4070 Graphics Card",
                price: 8999850,
                quantity: 1,
                image: getProduct("prod-004")?.image || "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-005",
                name: getProduct("prod-005")?.name || "16GB DDR4 RAM Kit",
                price: 2249850,
                quantity: 1,
                image: getProduct("prod-005")?.image || "https://images.unsplash.com/photo-1562976540-8521e64dae4d?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-006",
                name: getProduct("prod-006")?.name || "CPU Cooler",
                price: 2249850,
                quantity: 1,
                image: getProduct("prod-006")?.image || "https://images.unsplash.com/photo-1555617778-02518db0d4d2?w=300&h=300&fit=crop"
            }
        ]
    },
    {
        id: "ORD-2024-003",
        orderDate: "2024-01-25T09:45:00Z",
        status: "processing",
        totalAmount: 19499550,
        items: [
            {
                productId: "prod-007",
                name: getProduct("prod-007")?.name || "Gaming Monitor 27\" 144Hz",
                price: 6749850,
                quantity: 1,
                image: getProduct("prod-007")?.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-008",
                name: getProduct("prod-008")?.name || "Mechanical Switch Tester",
                price: 449850,
                quantity: 1,
                image: getProduct("prod-008")?.image || "https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-009",
                name: getProduct("prod-009")?.name || "Gaming Chair Pro",
                price: 12299850,
                quantity: 1,
                image: getProduct("prod-009")?.image || "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=300&fit=crop"
            }
        ]
    },
    {
        id: "ORD-2024-004",
        orderDate: "2024-01-28T16:22:00Z",
        status: "waiting_payment",
        totalAmount: 2999550,
        items: [
            {
                productId: "prod-010",
                name: getProduct("prod-010")?.name || "USB-C Hub with 7 Ports",
                price: 1199850,
                quantity: 1,
                image: getProduct("prod-010")?.image || "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-011",
                name: getProduct("prod-011")?.name || "Wireless Charging Pad",
                price: 599850,
                quantity: 1,
                image: getProduct("prod-011")?.image || "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-012",
                name: getProduct("prod-012")?.name || "Cable Management Kit",
                price: 1199850,
                quantity: 1,
                image: getProduct("prod-012")?.image || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop"
            }
        ]
    },
    {
        id: "ORD-2024-005",
        orderDate: "2024-02-01T11:30:00Z",
        status: "arrived",
        totalAmount: 8249550,
        items: [
            {
                productId: "prod-013",
                name: getProduct("prod-013")?.name || "Webcam 4K Pro",
                price: 2999850,
                quantity: 1,
                image: getProduct("prod-013")?.image || "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-014",
                name: getProduct("prod-014")?.name || "Studio Microphone",
                price: 4499850,
                quantity: 1,
                image: getProduct("prod-014")?.image || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-015",
                name: getProduct("prod-015")?.name || "Ring Light with Stand",
                price: 749850,
                quantity: 1,
                image: getProduct("prod-015")?.image || "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=300&h=300&fit=crop"
            }
        ]
    },
    {
        id: "ORD-2024-006",
        orderDate: "2024-02-05T13:45:00Z",
        status: "payment_completed",
        totalAmount: 11999550,
        items: [
            {
                productId: "prod-016",
                name: getProduct("prod-016")?.name || "Laptop Stand Adjustable",
                price: 1349850,
                quantity: 1,
                image: getProduct("prod-016")?.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-017",
                name: getProduct("prod-017")?.name || "External SSD 1TB",
                price: 2249850,
                quantity: 1,
                image: getProduct("prod-017")?.image || "https://images.unsplash.com/photo-1597872200969-2b65d56bd16d?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-018",
                name: getProduct("prod-018")?.name || "Bluetooth Speakers Premium",
                price: 8399850,
                quantity: 1,
                image: getProduct("prod-018")?.image || "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop"
            }
        ]
    },
    {
        id: "ORD-2024-007",
        orderDate: "2024-02-10T15:20:00Z",
        status: "completed",
        totalAmount: 5699550,
        items: [
            {
                productId: "prod-022",
                name: getProduct("prod-022")?.name || "Stream Deck",
                price: 2249850,
                quantity: 1,
                image: getProduct("prod-022")?.image || "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-023",
                name: getProduct("prod-023")?.name || "Gaming Headset Wireless",
                price: 2999850,
                quantity: 1,
                image: getProduct("prod-023")?.image || "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=300&fit=crop"
            },
            {
                productId: "prod-024",
                name: getProduct("prod-024")?.name || "Desk Mat XXL",
                price: 749850,
                quantity: 1,
                image: getProduct("prod-024")?.image || "https://images.unsplash.com/photo-1616197322138-af1c99c27fbf?w=300&h=300&fit=crop"
            }
        ]
    }
];