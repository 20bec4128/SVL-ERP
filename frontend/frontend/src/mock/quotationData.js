export const quotationCatalog = {
  settings: {
    currency: "INR",
    currencySymbol: "₹",
    company: {
      name: "SVL",
      address: "Your Company Address Here",
      gstin: "XXXXXXXXXXXX",
    },
    tax: {
      cgst: 0,
      sgst: 0,
    },
    discount: {
      enabled: true,
    },
  },
  categories: [
    {
      id: "printing",
      name: "Printing",
      products: [
        {
          id: "visiting_card",
          name: "Visiting Card",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 3 },
              { min: 501, max: 1500, price_per_unit: 2.55 },
              { min: 1501, max: 5000, price_per_unit: 2.25 },
            ],
          },
        },
        {
          id: "brochure",
          name: "Brochure",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 8 },
              { min: 501, max: 1500, price_per_unit: 6.8 },
              { min: 1501, max: 5000, price_per_unit: 6.0 },
            ],
          },
        },
        {
          id: "flyer",
          name: "Flyer",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 4 },
              { min: 501, max: 1500, price_per_unit: 3.4 },
              { min: 1501, max: 5000, price_per_unit: 3.0 },
            ],
          },
        },
        {
          id: "poster",
          name: "Poster",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 10 },
              { min: 501, max: 1500, price_per_unit: 8.5 },
              { min: 1501, max: 5000, price_per_unit: 7.5 },
            ],
          },
        },
        {
          id: "letterhead",
          name: "Letterhead",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 2 },
              { min: 501, max: 1500, price_per_unit: 1.7 },
              { min: 1501, max: 5000, price_per_unit: 1.5 },
            ],
          },
        },
        {
          id: "envelope",
          name: "Envelope",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 3 },
              { min: 501, max: 1500, price_per_unit: 2.55 },
              { min: 1501, max: 5000, price_per_unit: 2.25 },
            ],
          },
        },
        {
          id: "sticker",
          name: "Sticker",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 2 },
              { min: 501, max: 1500, price_per_unit: 1.7 },
              { min: 1501, max: 5000, price_per_unit: 1.5 },
            ],
          },
        },
        {
          id: "booklet",
          name: "Booklet",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 20 },
              { min: 501, max: 1500, price_per_unit: 17.0 },
              { min: 1501, max: 5000, price_per_unit: 15.0 },
            ],
          },
        },
        {
          id: "calendar",
          name: "Calendar",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 25 },
              { min: 501, max: 1500, price_per_unit: 21.25 },
              { min: 1501, max: 5000, price_per_unit: 18.75 },
            ],
          },
        },
        {
          id: "menu_card",
          name: "Menu Card",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 12 },
              { min: 501, max: 1500, price_per_unit: 10.2 },
              { min: 1501, max: 5000, price_per_unit: 9.0 },
            ],
          },
        },
        {
          id: "id_card",
          name: "ID Card",
          options: {
            material: [
              { name: "Matte", extra_cost: 0 },
              { name: "Glossy", extra_cost: 0.5 },
              { name: "Premium", extra_cost: 1 },
            ],
            size: [
              { name: "Standard", extra_cost: 0 },
              { name: "Custom", extra_cost: 1 },
            ],
            print: [
              { name: "Single Side", extra_cost: 0 },
              { name: "Double Side", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Lamination", extra_cost: 1.5 },
            ],
            design: {
              available: true,
              cost: 500,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 15 },
              { min: 501, max: 1500, price_per_unit: 12.75 },
              { min: 1501, max: 5000, price_per_unit: 11.25 },
            ],
          },
        },
      ],
    },
    {
      id: "packaging",
      name: "Packaging",
      products: [
        {
          id: "box_packaging",
          name: "Box Packaging",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 25 },
              { min: 501, max: 1500, price_per_unit: 21.25 },
              { min: 1501, max: 5000, price_per_unit: 18.75 },
            ],
          },
        },
        {
          id: "paper_bag",
          name: "Paper Bag",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 10 },
              { min: 501, max: 1500, price_per_unit: 8.5 },
              { min: 1501, max: 5000, price_per_unit: 7.5 },
            ],
          },
        },
        {
          id: "carry_bag",
          name: "Carry Bag",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 12 },
              { min: 501, max: 1500, price_per_unit: 10.2 },
              { min: 1501, max: 5000, price_per_unit: 9.0 },
            ],
          },
        },
        {
          id: "label_tag",
          name: "Label Tag",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 2 },
              { min: 501, max: 1500, price_per_unit: 1.7 },
              { min: 1501, max: 5000, price_per_unit: 1.5 },
            ],
          },
        },
        {
          id: "corrugated_box",
          name: "Corrugated Box",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 30 },
              { min: 501, max: 1500, price_per_unit: 25.5 },
              { min: 1501, max: 5000, price_per_unit: 22.5 },
            ],
          },
        },
        {
          id: "food_box",
          name: "Food Box",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 15 },
              { min: 501, max: 1500, price_per_unit: 12.75 },
              { min: 1501, max: 5000, price_per_unit: 11.25 },
            ],
          },
        },
        {
          id: "gift_box",
          name: "Gift Box",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 40 },
              { min: 501, max: 1500, price_per_unit: 34.0 },
              { min: 1501, max: 5000, price_per_unit: 30.0 },
            ],
          },
        },
        {
          id: "pouch",
          name: "Packaging Pouch",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 8 },
              { min: 501, max: 1500, price_per_unit: 6.8 },
              { min: 1501, max: 5000, price_per_unit: 6.0 },
            ],
          },
        },
        {
          id: "bottle_label",
          name: "Bottle Label",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 3 },
              { min: 501, max: 1500, price_per_unit: 2.55 },
              { min: 1501, max: 5000, price_per_unit: 2.25 },
            ],
          },
        },
        {
          id: "wrap_paper",
          name: "Wrapping Paper",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 5 },
              { min: 501, max: 1500, price_per_unit: 4.25 },
              { min: 1501, max: 5000, price_per_unit: 3.75 },
            ],
          },
        },
        {
          id: "tube_packaging",
          name: "Tube Packaging",
          options: {
            material: [
              { name: "Standard", extra_cost: 0 },
              { name: "Premium", extra_cost: 2 },
            ],
            size: [
              { name: "Small", extra_cost: 0 },
              { name: "Medium", extra_cost: 2 },
              { name: "Large", extra_cost: 4 },
            ],
            print: [
              { name: "None", extra_cost: 0 },
              { name: "Single Color", extra_cost: 1 },
            ],
            finish: [
              { name: "None", extra_cost: 0 },
              { name: "Glossy", extra_cost: 2 },
            ],
            design: {
              available: true,
              cost: 800,
            },
          },
          pricing: {
            tiers: [
              { min: 100, max: 500, price_per_unit: 18 },
              { min: 501, max: 1500, price_per_unit: 15.3 },
              { min: 1501, max: 5000, price_per_unit: 13.5 },
            ],
          },
        },
      ],
    },
  ],
};
