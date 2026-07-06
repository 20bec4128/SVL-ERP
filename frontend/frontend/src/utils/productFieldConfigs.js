/* ───────── product field configs by type name ───────── */
function createCustomSizeField(options, {
  label = "Size",
  unit = "mm",
  dimensions = ["width", "height"],
  customPlaceholder = "Enter custom size",
} = {}) {
  return {
    key: "size",
    label,
    type: "select",
    options,
    allowCustom: true,
    customPlaceholder,
    customDimensions: dimensions,
    customDimensionUnit: unit,
  };
}

export const BOX_PACKAGING_FIELDS = [
  { key: "lengthCm", label: "Length (cm)", type: "number" },
  { key: "widthCm", label: "Width (cm)", type: "number" },
  { key: "heightCm", label: "Height (cm)", type: "number" },
  { key: "loadCapacityKg", label: "Load Capacity (kg)", type: "number" },
  { key: "boxStyle", label: "Box Style", type: "select", options: ["RSC", "Die-cut", "Mailer", "Flap"] },
  { key: "ply", label: "Ply", type: "select", options: ["Single", "3", "5", "7"] },
  { key: "fluteType", label: "Flute Type", type: "select", options: ["E", "B", "C", "BC"] },
  { key: "boardGsm", label: "Board GSM", type: "text", placeholder: "e.g. 150, 200, 300" },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Flexo", "Offset", "Digital"] },
  { key: "printColours", label: "Print Colours", type: "select", options: ["Plain", "1 colour", "2 colour", "CMYK"] },
  { key: "finish", label: "Finish", type: "select", options: ["Matte", "Glossy", "UV", "Emboss"] },
  { key: "usageType", label: "Usage Type", type: "select", options: ["Food", "Retail", "E-commerce", "Industrial"] },
  { key: "addons", label: "Add-ons", type: "text", placeholder: "e.g. Partition, Handle, Window" },
  { key: "dielineAvailable", label: "Dieline Available", type: "select", options: ["Yes", "No"] },
  { key: "foodSafe", label: "Food Safe", type: "select", options: ["Yes", "No"] },
  { key: "greaseProof", label: "Grease Proof", type: "select", options: ["Yes", "No"] },
];

export const FOOD_CUP_FIELDS = [
  { key: "capacityMl", label: "Capacity (ml)", type: "number" },
  { key: "material", label: "Material", type: "select", options: ["Paper", "Plastic", "Bagasse"] },
  { key: "gsm", label: "GSM", type: "text" },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Screen", "Digital", "Flexo", "Offset"] },
  { key: "printType", label: "Print Type", type: "select", options: ["Single colour", "Multicolour"] },
  { key: "lamination", label: "Lamination", type: "select", options: ["None", "Matte", "Glossy"] },
  { key: "lidType", label: "Lid Type", type: "select", options: ["Flat", "Dome", "Spout"] },
  { key: "foodSafe", label: "Food Safe", type: "select", options: ["Yes", "No"] },
  { key: "leakProof", label: "Leak Proof", type: "select", options: ["Yes", "No"] },
];

export const WRAP_FIELDS = [
  { key: "size", label: "Size (mm/cm)", type: "text", placeholder: "e.g. 200 x 150 mm" },
  { key: "material", label: "Material", type: "select", options: ["Butter paper", "Foil", "Paper"] },
  { key: "gsm", label: "GSM", type: "text" },
  { key: "printing", label: "Printing", type: "select", options: ["Yes", "No"] },
  { key: "foodSafe", label: "Food Safe", type: "select", options: ["Yes", "No"] },
  { key: "greaseProof", label: "Grease Proof", type: "select", options: ["Yes", "No"] },
];

export const ACCESSORY_FIELDS = [
  { key: "material", label: "Material", type: "select", options: ["Wood", "Plastic"] },
  { key: "size", label: "Size", type: "text" },
  { key: "accessoryType", label: "Type", type: "select", options: ["Disposable", "Re-usable"] },
  { key: "foodGrade", label: "Food Grade", type: "select", options: ["Yes", "No"] },
];

export const WOOD_PLASTIC_SPOON_FIELDS = [
  { key: "type", label: "Type", type: "select", options: ["Wood", "Plastic"] },
  { key: "size", label: "Size", type: "text", placeholder: "Custom size" },
];

export const ICE_CREAM_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Custom" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Custom" },
  { key: "gsm", label: "GSM", type: "text", placeholder: "Custom" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss"] },
  { key: "boxOuterType", label: "Box Outer Type", type: "select", options: ["White", "Readymade Box"] },
];

export const MONOCOTTON_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Custom" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Custom" },
  { key: "gsm", label: "GSM", type: "text", placeholder: "Custom" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Glossy"] },
];

export const BRANDING_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Custom" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Custom" },
  { key: "gsm", label: "GSM", type: "text", placeholder: "Custom" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Glossy"] },
];

export const PLAIN_CUSTOMIZED_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Custom" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Custom" },
  { key: "gsm", label: "GSM", type: "text", placeholder: "Custom" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Glossy"] },
];

export const FLEX_PRINTING_FIELDS = [
  createCustomSizeField(["Small (2×1 ft)", "Medium (4×2 ft)", "Large (6×3 ft)", "Extra Large (8×4 ft)", "Custom"], { unit: "ft" }),
  { key: "orientation", label: "Orientation", type: "select", options: ["Horizontal", "Vertical"] },
  { key: "required", label: "Required", type: "select", options: ["Flex Only", "Flex with Frame"] },
];

export const FLEX_WITH_COLOUR_FIELDS = [
  createCustomSizeField(["Small (2×1 ft)", "Medium (4×2 ft)", "Large (6×3 ft)", "Extra Large (8×4 ft)", "Custom"], { unit: "ft" }),
  { key: "orientation", label: "Orientation", type: "select", options: ["Horizontal", "Vertical"] },
  { key: "required", label: "Required", type: "select", options: ["Flex Only", "Flex with Frame"] },
  { key: "colour", label: "Colour", type: "select", options: ["Red", "Blue", "Green", "Yellow", "Custom"], allowCustom: true, customPlaceholder: "Enter custom colour" },
];

export const FLEX_WITH_COLOUR_AND_VARIENT_FIELDS = [
  createCustomSizeField(["Small (2×1 ft)", "Medium (4×2 ft)", "Large (6×3 ft)", "Extra Large (8×4 ft)", "Custom"], { unit: "ft" }),
  { key: "orientation", label: "Orientation", type: "select", options: ["Horizontal", "Vertical"] },
  { key: "required", label: "Required", type: "select", options: ["Flex Only", "Flex with Frame"] },
  { key: "colour", label: "Colour", type: "select", options: ["Red", "Blue", "Green", "Yellow", "Custom"], allowCustom: true, customPlaceholder: "Enter custom colour" },
  { key: "bottomVarient", label: "Bottom Varient", type: "select", options: ["Stand", "Flat"] },
];

export const VISITING_CARD_FIELDS = [
  { key: "size", label: "Card Size", type: "select", options: ["3.5x2 inches", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "orientation", label: "Orientation", type: "select", options: ["Horizontal", "Vertical"] },
  { key: "cornerType", label: "Corner Type", type: "select", options: ["Normal", "Round"] },
  { key: "paperGsm", label: "Paper GSM", type: "select", options: ["300", "350", "400"] },
  { key: "printType", label: "Print Type", type: "select", options: ["Front Only", "Front & Back"] },
  { key: "color", label: "Color", type: "select", options: ["Single", "Multi"] },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss", "Velvet"] },
  { key: "foilingType", label: "Foiling Type", type: "select", options: ["Gold Foil", "Silver Foil"] },
  { key: "embossingType", label: "Embossing Type", type: "select", options: ["With Embossing", "Without Embossing"] },
];

export const REFLECTOR_FLEX_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["Custom"], allowCustom: true, customPlaceholder: "Enter custom size", customSizeMode: "text" },
  { key: "orientation", label: "Orientation", type: "select", options: ["Horizontal", "Vertical"] },
  { key: "colour", label: "Colour", type: "select", options: ["All Colours ", "Custom"], allowCustom: true, customPlaceholder: "Enter custom colour" },
];

export const BLACK_LIGHT_FLEX_FIELDS = [
  createCustomSizeField(["Custom"], { unit: "ft" }),
  { key: "ledType", label: "Led Type", type: "select", options: ["Box", "Flex", "Back Side Led Tubelight"] },
];

export const LED_CUTTING_WITH_LIGHTING_FIELDS = [
  createCustomSizeField(["Mock Small (2×1 ft)", "Mock Medium (4×2 ft)", "Mock Large (6×3 ft)", "Custom"], { unit: "ft" }),
  { key: "ledType", label: "Led Type", type: "select", options: ["Box", "Flex", "Back Side Led Tubelight"] },
];

export const AGRALIC_2D_FIELDS = [
  createCustomSizeField(["Small (2×1 ft)", "Medium (4×2 ft)", "Large (6×3 ft)", "Extra Large (8×4 ft)", "Custom"], { unit: "ft" }),
  { key: "requirementDetails", label: "Requirement Details", type: "text", placeholder: "Enter requirement details" },
];

export const AGRALIC_3D_FIELDS = [
  createCustomSizeField(["Small (2×1×1 ft)", "Medium (4×2×1.5 ft)", "Large (6×3×2 ft)", "Extra Large (8×4×2.5 ft)", "Custom"], { unit: "ft", dimensions: ["width", "height", "depth"] }),
  { key: "requirementDetails", label: "Requirement Details", type: "text", placeholder: "Enter requirement details" },
];

export const CUSTOM_PAPER_STICKER_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["Small (2×1 inch)", "Medium (3×2 inch)", "Large (4×3 inch)", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "stickerShape", label: "Sticker Shape", type: "select", options: ["Square", "Round", "Custom"], allowCustom: true, customPlaceholder: "Enter custom sticker shape" },
  { key: "pastingType", label: "Pasting Type (Product)", type: "select", options: ["Custom"], allowCustom: true, customPlaceholder: "Enter custom pasting type" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss"] },
  { key: "stickerType", label: "Sticker Type", type: "select", options: ["Roll", "Sheet"] },
];

export const VINYL_STICKER_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["Small (2×1 inch)", "Medium (3×2 inch)", "Large (4×3 inch)", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "stickerShape", label: "Sticker Shape", type: "select", options: ["Square", "Round", "Custom"], allowCustom: true, customPlaceholder: "Enter custom sticker shape" },
  { key: "pastingType", label: "Pasting Type (Product)", type: "select", options: ["Custom"], allowCustom: true, customPlaceholder: "Enter custom pasting type" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss", "Transparent"] },
  { key: "stickerType", label: "Sticker Type", type: "select", options: ["Roll", "Sheet"] },
  { key: "gummingType", label: "Gumming Type", type: "select", options: ["Normal Gum", "SunSui Gum"] },
];

export const POLYCARBONATE_STICKER_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["Small (2×1 inch)", "Medium (3×2 inch)", "Large (4×3 inch)", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "stickerShape", label: "Sticker Shape", type: "select", options: ["Square", "Round", "Custom"], allowCustom: true, customPlaceholder: "Enter custom sticker shape" },
  { key: "pastingType", label: "Pasting Type (Product)", type: "select", options: ["Custom"], allowCustom: true, customPlaceholder: "Enter custom pasting type" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss", "Transparent"] },
  { key: "stickerType", label: "Sticker Type", type: "select", options: ["Roll", "Sheet"] },
  { key: "gummingType", label: "Gumming Type", type: "select", options: ["Normal Gum", "SunSui Gum"] },
];

export const FOAM_STICKER_FIELDS = [
  { key: "foamThickness", label: "Foam Thickness", type: "select", options: ["3 Mm", "4 Mm", "5 Mm", "8 Mm"] },
];

export const ZIPPER_POUCH_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "widthMm", label: "Width (mm)", type: "number" },
  { key: "heightMm", label: "Height (mm)", type: "number" },
  { key: "gussetMm", label: "Gusset (mm)", type: "text" },
  { key: "material", label: "Material", type: "select", options: ["BOPP", "PET/PE", "Foil"] },
  { key: "layers", label: "Layers", type: "select", options: ["2", "3", "4"] },
  { key: "pouchType", label: "Type", type: "select", options: ["With Window", "Without Zipper"] },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Digital", "Rotogravure", "Flexo"] },
  { key: "printType", label: "Print Type", type: "select", options: ["Single", "Multicolour"] },
  { key: "finish", label: "Finish", type: "select", options: ["Matte", "Glossy"] },
  { key: "zipper", label: "Zipper", type: "select", options: ["Yes", "No"] },
  { key: "tearNotch", label: "Tear Notch", type: "select", options: ["Yes", "No"] },
  { key: "foodGrade", label: "Food Grade", type: "select", options: ["Yes", "No"] },
];

export const ZIPPER_POUCH_PLAIN_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "width", label: "Width", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height", type: "text", placeholder: "Custom" },
  { key: "gusset", label: "Gusset", type: "text", placeholder: "Custom" },
  { key: "layers", label: "Layers", type: "select", options: ["2", "3", "4"] },
  { key: "zipperType", label: "Zipper Type", type: "select", options: ["With Zipper", "Without Zipper"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "tearNotch", label: "Tear Notch", type: "select", options: ["Yes", "No"] },
  { key: "pouchColour", label: "Pouch Colour", type: "select", options: ["All Colours", "Custom"], allowCustom: true, customPlaceholder: "Enter custom colour" },
  { key: "printingType", label: "Printing Type", type: "select", options: ["Single", "Double", "Multicolour"] },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Screen Printing", "Digital", "Rotogravure", "Flexo"] },
  { key: "printingSides", label: "Printing Sides", type: "select", options: ["Front Only", "Back", "Front & Back"] },
  { key: "foodGrade", label: "Food Grade", type: "select", options: ["Yes", "No"] },
];

export const BOTH_SIDE_TRANSPARENT_POUCH_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "width", label: "Width", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height", type: "text", placeholder: "Custom" },
  { key: "gusset", label: "Gusset", type: "text", placeholder: "Custom" },
  { key: "layers", label: "Layers", type: "select", options: ["2", "3", "4"] },
  { key: "zipperType", label: "Zipper Type", type: "select", options: ["With Zipper", "Without Zipper"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "tearNotch", label: "Tear Notch", type: "select", options: ["Yes", "No"] },
  { key: "foodGrade", label: "Food Grade", type: "select", options: ["Yes", "No"] },
];

export const PRINTING_ZIPPER_POUCH_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "width", label: "Width", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height", type: "text", placeholder: "Custom" },
  { key: "gusset", label: "Gusset", type: "text", placeholder: "Custom" },
  { key: "layers", label: "Layers", type: "select", options: ["2", "3", "4"] },
  { key: "zipperType", label: "Zipper Type", type: "select", options: ["With Zipper", "Without Zipper"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "tearNotch", label: "Tear Notch", type: "select", options: ["Yes", "No"] },
  { key: "printingType", label: "Printing Type", type: "select", options: ["Single", "Double", "Multicolour"] },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Screen Printing", "Digital", "Rotogravure", "Flexo"] },
  { key: "printingSides", label: "Printing Sides", type: "select", options: ["Front Only", "Back", "Front & Back"] },
  { key: "foodGrade", label: "Food Grade", type: "select", options: ["Yes", "No"] },
];

export const ONE_SIDE_SILVER_ONE_SIDE_TRANSPARENT_POUCH_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "width", label: "Width", type: "text", placeholder: "Custom" },
  { key: "height", label: "Height", type: "text", placeholder: "Custom" },
  { key: "gusset", label: "Gusset", type: "text", placeholder: "Custom" },
  { key: "layers", label: "Layers", type: "select", options: ["2", "3", "4"] },
  { key: "zipperType", label: "Zipper Type", type: "select", options: ["With Zipper", "Without Zipper"] },
  { key: "tearNotch", label: "Tear Notch", type: "select", options: ["Yes", "No"] },
  { key: "printingType", label: "Printing Type", type: "select", options: ["Single", "Double", "Multicolour"] },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Screen Printing", "Digital", "Rotogravure", "Flexo"] },
  { key: "foodGrade", label: "Food Grade", type: "select", options: ["Yes", "No"] },
];

export const ENVELOPE_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["DL (110×220 mm)", "C6 (114×162 mm)", "C5 (162×229 mm)", "C4 (229×324 mm)", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "colour", label: "Colour", type: "select", options: ["Single colour", "Multicolour"] },
  { key: "printType", label: "Print Type", type: "select", options: ["Front Only", "Front & Back"] },
];

export const NOTEPAD_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["A4", "A5", "Legal"] },
  { key: "color", label: "Color", type: "select", options: ["Single", "Multi"] },
  { key: "gsm", label: "GSM", type: "select", options: ["70 Gsm", "80 Gsm", "100 Gsm"] },
  { key: "requirementDetails", label: "Requirement Details", type: "text", placeholder: "Enter requirement details" },
];

export const DAIRY_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["Small (5×7 inch)", "Medium (7×10 inch)", "Large (8.5×11 inch)", "A5 (5.8×8.3 inch)", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "dairyType", label: "Dairy Type", type: "select", options: ["Readymade", "Customize"] },
  { key: "customize", label: "Customize", type: "select", options: ["Inner Detail", "Outer Details"] },
  { key: "dairyOuterType", label: "Dairy Outer Type", type: "select", options: ["Leather", "Art Paper"] },
  { key: "colour", label: "Colour", type: "select", options: ["Single colour", "Multicolour"] },
];

export const DAILY_CALENDAR_FIELDS = [
  { key: "variant", label: "Variant", type: "select", options: ["Normal", "Dye Cut", "Gold Foil"] },
  { key: "size", label: "Calendar Size", type: "select", options: ["6 x 9", "10 x 15", "12 x 18", "5 x 20", "11 x 17", "14 x 24", "20 x 30", "23 x 36", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "cakeSize", label: "Cake Size", type: "select", options: ["4 No", "5 No", "6 No", "7 No", "20 No", "Mega"] },
  { key: "colour", label: "Colour", type: "select", options: ["Single", "Double", "Multi"] },
];

export const MONTHLY_CALENDAR_FIELDS = [
  { key: "paperVariant", label: "Paper Variant", type: "select", options: ["Maplitho Paper", "Art Paper"] },
  { key: "gsm", label: "GSM", type: "select", options: ["70 Gsm", "80 Gsm", "100 Gsm", "120 Gsm", "180 Gsm"] },
  { key: "size", label: "Size", type: "select", options: ["15 x 20", "17 x 27", "20 x 29", "20 x 30", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "sheet", label: "Sheet", type: "select", options: ["6 Sheet", "12 Sheet"] },
  { key: "colour", label: "Colour", type: "select", options: ["Single", "Multi"] },
];

export const POCKET_CALENDAR_FIELDS = [
  { key: "gsm", label: "GSM", type: "text", placeholder: "Enter GSM" },
  { key: "size", label: "Size", type: "select", options: ["3.5 x 5 inch", "4 x 6 inch", "5 x 7 inch", "6 x 8 inch", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matt", "Glossy"] },
];

export const TABLE_TOP_CALENDAR_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["8.25 x 8.75 (Approx)", "9.2 x 6.1 (Approx)", "10 x 5.7 (Approx)", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "colour", label: "Colour", type: "select", options: ["Single", "Multi"] },
  { key: "gsm", label: "GSM", type: "text", placeholder: "Enter GSM" },
  { key: "bottomType", label: "Bottom Type", type: "select", options: ["With Square", "Without Square"] },
];

export const DOCTOR_FILE_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["19.25 x 12.20 (Inches)", "17.72 x 12.44 (Inches)", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "gsm", label: "GSM", type: "select", options: ["300 Gsm", "400 Gsm"] },
  { key: "fileFinishing", label: "File Finishing", type: "select", options: ["Creasing", "Creasing + Punching", "Dye Cut"] },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matt", "Glossy"] },
  { key: "paper", label: "Paper", type: "select", options: ["Synthetic", "Normal"] },
  { key: "innerType", label: "Inner Type", type: "select", options: ["Clip", "Pouch", "Clip & Pouch"] },
  { key: "sides", label: "Sides", type: "text", placeholder: "Enter number of sides" },
];

export const PAMPHLET_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["A4", "A5", "Legal", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "colour", label: "Colour", type: "select", options: ["Single colour", "Multicolour"] },
  { key: "printType", label: "Print Type", type: "select", options: ["Front Only", "Front & Back"] },
];

export const BROCHURE_FIELDS = [
  { key: "size", label: "Size", type: "select", options: ["A4 (210 x 297 mm)", "A5 (148 x 210 mm)", "6 x 9 inch", "8.5 x 11 inch", "Custom"], allowCustom: true, customPlaceholder: "Enter custom size" },
  { key: "paperVariant", label: "Paper Variant", type: "select", options: ["Maplitho Paper", "Art Paper"] },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matt", "Glossy"] },
  { key: "gsm", label: "GSM", type: "select", options: ["70 Gsm", "80 Gsm", "100 Gsm", "120 Gsm", "150 Gsm", "Custom"], allowCustom: true, customPlaceholder: "Enter custom GSM" },
];

export const CORRUGATED_ROLL_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "ply", label: "Ply", type: "select", options: ["2"] },
  { key: "fluteType", label: "Flute Type", type: "select", options: ["E", "B", "C", "BC"] },
  { key: "boardGsm", label: "Board GSM", type: "text", placeholder: "Enter GSM" },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Offset", "Screen Printing"] },
  { key: "printColours", label: "Print Colours", type: "select", options: ["Plain", "1 Colour", "2 Colour", "Multi Colour"] },
];

export const CORRUGATED_SHEET_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "ply", label: "Ply", type: "select", options: ["3", "5", "7"] },
  { key: "fluteType", label: "Flute Type", type: "select", options: ["E", "B", "C", "BC"] },
  { key: "boardGsm", label: "Board GSM", type: "text", placeholder: "Enter GSM" },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Offset", "Screen Printing"] },
  { key: "printColours", label: "Print Colours", type: "select", options: ["Plain", "1 Colour", "2 Colour", "Multi Colour"] },
];

export const CAKE_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Enter width" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "gsm", label: "GSM", type: "text", placeholder: "Enter GSM" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss"] },
  { key: "boxOuterType", label: "Box Outer Type", type: "select", options: ["White", "Readymade Box"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
];

export const JAR_CAKE_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Enter width" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "gsm", label: "GSM", type: "text", placeholder: "Enter GSM" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matte", "Gloss"] },
  { key: "boxOuterType", label: "Box Outer Type", type: "select", options: ["White", "Readymade Box"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "handleType", label: "Handle Type", type: "select", options: ["With Handle", "Without Handle"] },
];

export const SANDWICH_WAFFLE_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Enter width" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "boxType", label: "Box Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
];

export const BURGER_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Enter width" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "boxType", label: "Box Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
  { key: "foldingType", label: "Folding Type", type: "select", options: ["Manual", "Customized"] },
];

export const POPCORN_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Enter width" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
  { key: "shapeType", label: "Shape Type", type: "select", options: ["Round", "Square", "Dye Cut Model"] },
  { key: "boxType", label: "Box Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
];

export const BIRIYANI_BOX_FIELDS = [
  { key: "boxType", label: "Box Type", type: "select", options: ["Plastic", "Board"] },
  { key: "shapeType", label: "Shape Type", type: "select", options: ["Round", "Square"] },
  { key: "handleType", label: "Handle Type", type: "select", options: ["With Handle", "Without Handle"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
  { key: "colour", label: "Colour", type: "select", options: ["Plain", "Readymade", "Customized"] },
  { key: "size", label: "Size", type: "select", options: ["Small", "Medium", "Large"] },
];

export const CUP_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch"] },
  { key: "size", label: "Size", type: "select", options: ["Small", "Medium", "Large"] },
  { key: "boxType", label: "Box Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
  { key: "cupType", label: "Cup Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
];

export const JUICE_CUP_WITH_SPOUT_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch"] },
  { key: "size", label: "Size", type: "select", options: ["Small", "Medium", "Large"] },
  { key: "boxType", label: "Box Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
  { key: "cupType", label: "Cup Type", type: "select", options: ["Plastic", "Organic"] },
];

export const TRAY_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch"] },
  { key: "size", label: "Size", type: "select", options: ["Small", "Medium", "Large"] },
  { key: "boxType", label: "Box Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
  { key: "cupType", label: "Cup Type", type: "select", options: ["Plain", "Readymade", "Customized"] },
];

export const SWEET_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Enter width" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "gsm", label: "Gsm", type: "text", placeholder: "Enter GSM" },
  { key: "lamination", label: "Lamination", type: "select", options: ["Matt", "Gloss"] },
  { key: "boxOuterType", label: "Box Outer Type", type: "select", options: ["White", "Readymade Box"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "partition", label: "Partition", type: "select", options: ["With Partition", "Without Partition"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
];

export const CAKE_BASE_FIELDS = [
  createCustomSizeField(["Small (6 inch)", "Medium (8 inch)", "Large (10 inch)", "Custom"], { unit: "mm" }),
  { key: "colour", label: "Colour", type: "select", options: ["Gold", "Silver"] },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["With Printing", "Without Printing"] },
  { key: "shapeType", label: "Shape Type", type: "select", options: ["Round", "Square", "Dye Cut Model"] },
];

export const BROWNIE_BOX_FIELDS = [
  createCustomSizeField(["Small (4×4×2 inch)", "Medium (6×6×3 inch)", "Large (8×8×4 inch)", "Custom"], { unit: "mm", dimensions: ["width", "height", "depth"] }),
  { key: "productQty", label: "Product Qty", type: "select", options: ["1 Pcs", "3 Pcs", "4 Pcs", "6 Pcs", "9 Pcs"] },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "gsm", label: "Gsm", type: "text", placeholder: "Enter GSM" },
];

export const CUP_CAKEE_BOX_FIELDS = [
  createCustomSizeField(["Single (3×3×3 inch)", "4 Cavity (8×4×3 inch)", "6 Cavity (8×8×3 inch)", "Custom"], { unit: "mm", dimensions: ["width", "height", "depth"] }),
  { key: "gsm", label: "Gsm", type: "text", placeholder: "Enter GSM" },
  { key: "windowType", label: "Window Type", type: "select", options: ["With Window", "Without Window"] },
  { key: "partition", label: "Partition", type: "select", options: ["With Partition", "Without Partition"] },
  { key: "innerLamination", label: "Inner Lamination", type: "select", options: ["With Lamination", "Without Lamination"] },
];

export const BENTO_BOX_FIELDS = [
  { key: "type", label: "Type", type: "select", options: ["Plastic", "Wood", "Bambo"] },
  createCustomSizeField(["Small (6×4×3 inch)", "Medium (8×6×4 inch)", "Large (10×8×5 inch)", "Custom"], { unit: "mm", dimensions: ["width", "height", "depth"] }),
];

export const SELFLOCK_MAILER_FLAP_BOX_FIELDS = [
  { key: "measurement", label: "Measurement", type: "select", options: ["mm", "cm", "inch", "feet"] },
  { key: "length", label: "Length (Size)", type: "text", placeholder: "Enter length" },
  { key: "width", label: "Width (Size)", type: "text", placeholder: "Enter width" },
  { key: "height", label: "Height (Size)", type: "text", placeholder: "Enter height" },
  { key: "loadCapacity", label: "Load Capacity", type: "select", options: ["Kg", "Gram", "Custom"], allowCustom: true, customPlaceholder: "Enter custom capacity" },
  { key: "boxStyle", label: "Box Style", type: "select", options: ["Rsc", "Dye Cut"] },
  { key: "ply", label: "Ply", type: "select", options: ["3", "5", "7"] },
  { key: "fluteType", label: "Flute Type", type: "select", options: ["E", "B", "C", "BC"] },
  { key: "boardGsm", label: "Board GSM", type: "text", placeholder: "Enter GSM" },
  { key: "printingMethod", label: "Printing Method", type: "select", options: ["Offset", "Screen Printing"] },
  { key: "printColours", label: "Print Colours", type: "select", options: ["Plain", "1 Colour", "2 Colour", "Multi Colour"] },
  { key: "boxInnerColour", label: "Box Inner Colour Type", type: "select", options: ["White", "Golden Brown", "Normal Brown", "Ice Brown"] },
  { key: "boxOuterColour", label: "Box Outer Colour Type", type: "select", options: ["White", "Golden Brown", "Normal Brown", "Ice Brown"] },
  { key: "productType", label: "Product Type", type: "text", placeholder: "Enter product type" },
];

export const PRODUCT_FIELDS = {
  "visiting card": VISITING_CARD_FIELDS,
  "normal visiting card": VISITING_CARD_FIELDS,
  "synthetic visiting card": VISITING_CARD_FIELDS,
  "scent card visiting card": VISITING_CARD_FIELDS,
  "curve cutting visiting card": VISITING_CARD_FIELDS,
  "uv visiting card": VISITING_CARD_FIELDS,
  "flex printing": FLEX_PRINTING_FIELDS,
  "normal flex": FLEX_PRINTING_FIELDS,
  "black media flex": FLEX_PRINTING_FIELDS,
  "star flex": FLEX_PRINTING_FIELDS,
  "reflector flex": REFLECTOR_FLEX_FIELDS,
  "roll up standee": FLEX_WITH_COLOUR_AND_VARIENT_FIELDS,
  "promotional umbrella": FLEX_WITH_COLOUR_AND_VARIENT_FIELDS,
  "black light flex": BLACK_LIGHT_FLEX_FIELDS,
  "led cutting with lighting": LED_CUTTING_WITH_LIGHTING_FIELDS,
  "2d agralic": AGRALIC_2D_FIELDS,
  "3d agralic": AGRALIC_3D_FIELDS,
  "normal paper sticker": CUSTOM_PAPER_STICKER_FIELDS,
  "vinyl sticker": VINYL_STICKER_FIELDS,
  "polycarbonate sticker": POLYCARBONATE_STICKER_FIELDS,
  "dome sticker": CUSTOM_PAPER_STICKER_FIELDS,
  "pvc sticker": CUSTOM_PAPER_STICKER_FIELDS,
  "foam": FOAM_STICKER_FIELDS,
  "sun pack board": CUSTOM_PAPER_STICKER_FIELDS,
  "sticker items": [
    { key: "shape", label: "Shape", type: "select", options: ["Rectangle", "Circle", "Square", "Custom die-cut"] },
    { key: "widthMm", label: "Width (mm)", type: "number" },
    { key: "heightMm", label: "Height (mm)", type: "number" },
    { key: "lamination", label: "Lamination", type: "select", options: ["None", "Matte", "Glossy", "UV"] },
    { key: "adhesive", label: "Adhesive", type: "select", options: ["Permanent", "Removable", "Waterproof"] },
    { key: "printColours", label: "Print Colours", type: "select", options: ["Full colour CMYK", "Single colour", "2 colour"] },
  ],
  "led sign board": [
    { key: "widthFt", label: "Width (ft)", type: "number" },
    { key: "heightFt", label: "Height (ft)", type: "number" },
    { key: "ledColour", label: "LED Colour", type: "select", options: ["White", "Warm white", "RGB multicolour", "Red", "Blue", "Green"] },
    { key: "mounting", label: "Mounting", type: "select", options: ["Wall mount", "Ceiling hang", "Stand alone", "Pole mount"] },
    { key: "powerSupply", label: "Power Supply", type: "select", options: ["Indoor 220V", "Outdoor weatherproof"] },
  ],
  "stationery": [
    { key: "size", label: "Size", type: "select", options: ["A4", "A5", "A6", "DL", "Custom"] },
    { key: "paperGsm", label: "Paper GSM", type: "select", options: ["70", "90", "130", "170", "300"] },
    { key: "pagesSheets", label: "Pages / Sheets", type: "number" },
    { key: "printSides", label: "Print Sides", type: "select", options: ["Single", "Both"] },
    { key: "binding", label: "Binding", type: "select", options: ["None", "Saddle stitch", "Perfect bind", "Spiral"] },
    { key: "coverFinish", label: "Cover Finish", type: "select", options: ["None", "Matte lamination", "Glossy lamination", "UV coating"] },
  ],
  "packaging box": BOX_PACKAGING_FIELDS,
  "fast food box": BOX_PACKAGING_FIELDS,
  "corrugated box": BOX_PACKAGING_FIELDS,
  "frame box": BOX_PACKAGING_FIELDS,
  "food box": BOX_PACKAGING_FIELDS,
  "gift box": BOX_PACKAGING_FIELDS,
  "cake box": CAKE_BOX_FIELDS,
  "sweet box": SWEET_BOX_FIELDS,
  "pastry box": CAKE_BOX_FIELDS,
  "pizza box": CAKE_BOX_FIELDS,
  "tier cake box": CAKE_BOX_FIELDS,
  "plum box": CAKE_BOX_FIELDS,
  "cake base": CAKE_BASE_FIELDS,
  "brownie box": BROWNIE_BOX_FIELDS,
  "cup cake box": CUP_CAKEE_BOX_FIELDS,
  "bento box": BENTO_BOX_FIELDS,
  "candle box": CAKE_BOX_FIELDS,
  "jar cake": JAR_CAKE_FIELDS,
  "sandwich box": SANDWICH_WAFFLE_BOX_FIELDS,
  "sandwich waffle box": SANDWICH_WAFFLE_BOX_FIELDS,
  "dosa": SANDWICH_WAFFLE_BOX_FIELDS,
  "dosa,shawarma": SANDWICH_WAFFLE_BOX_FIELDS,
  "shawarma": SANDWICH_WAFFLE_BOX_FIELDS,
  "burger": BURGER_BOX_FIELDS,
  "popcorn box": POPCORN_BOX_FIELDS,
  "biryani box": BIRIYANI_BOX_FIELDS,
  "biriyani box": BIRIYANI_BOX_FIELDS,
  "cup": CUP_FIELDS,
  "juice cup with spout": JUICE_CUP_WITH_SPOUT_FIELDS,
  "ice cream": ICE_CREAM_FIELDS,
  "tray": TRAY_FIELDS,
  "monocotton box": MONOCOTTON_BOX_FIELDS,
  "branding box": BRANDING_BOX_FIELDS,
  "monocotton box / branding box": MONOCOTTON_BOX_FIELDS,
  "plain and customized box": PLAIN_CUSTOMIZED_BOX_FIELDS,
  knife: ACCESSORY_FIELDS,
  spoon: ACCESSORY_FIELDS,
  "wood spoon": ACCESSORY_FIELDS,
  "plastic spoon": ACCESSORY_FIELDS,
  "wood plastic spoon": WOOD_PLASTIC_SPOON_FIELDS,
  "wood/plastic spoon": WOOD_PLASTIC_SPOON_FIELDS,
  "zipper pouch": ZIPPER_POUCH_FIELDS,
  "zipper pouch plain": ZIPPER_POUCH_PLAIN_FIELDS,
  "both side transparent": BOTH_SIDE_TRANSPARENT_POUCH_FIELDS,
  "printing zipper pouch": PRINTING_ZIPPER_POUCH_FIELDS,
  "one side silver one side transparent": ONE_SIDE_SILVER_ONE_SIDE_TRANSPARENT_POUCH_FIELDS,
  "packaging pouch": ZIPPER_POUCH_FIELDS,
  "envelope": ENVELOPE_FIELDS,
  "notepad": NOTEPAD_FIELDS,
  "note pad": NOTEPAD_FIELDS,
  "dairy": DAIRY_FIELDS,
  "daily calendar": DAILY_CALENDAR_FIELDS,
  "daily calender": DAILY_CALENDAR_FIELDS,
  "monthly calendar": MONTHLY_CALENDAR_FIELDS,
  "monthly calender": MONTHLY_CALENDAR_FIELDS,
  "pocket calendar": POCKET_CALENDAR_FIELDS,
  "pocket calender": POCKET_CALENDAR_FIELDS,
  "table top calendar": TABLE_TOP_CALENDAR_FIELDS,
  "table top calender": TABLE_TOP_CALENDAR_FIELDS,
  "doctor file": DOCTOR_FILE_FIELDS,
  "pamphlet": PAMPHLET_FIELDS,
  "pamplat": PAMPHLET_FIELDS,
  "pamplet": PAMPHLET_FIELDS,
  "brochure": BROCHURE_FIELDS,
  "brochura": BROCHURE_FIELDS,
  "corrugated roll": CORRUGATED_ROLL_FIELDS,
  "corrugated sheet": CORRUGATED_SHEET_FIELDS,
  "corrugated board": CORRUGATED_SHEET_FIELDS,
  "selflock mailer flap box": SELFLOCK_MAILER_FLAP_BOX_FIELDS,
  "selflock mailore flap box": SELFLOCK_MAILER_FLAP_BOX_FIELDS,
};

export const PRINTING_GENERIC_FIELDS = [
  { key: "size", label: "Size", type: "text", placeholder: "e.g. 3.5 x 2 inch, A4, 6 x 4 ft" },
  { key: "materialOrPaper", label: "Material / Paper", type: "text", placeholder: "e.g. 300 GSM art card, vinyl, acrylic" },
  { key: "printSides", label: "Printing Sides", type: "select", options: ["Front only", "Front & Back"] },
  { key: "finish", label: "Finish / Lamination", type: "text", placeholder: "e.g. matte, glossy, UV, none" },
  { key: "requirementDetails", label: "Requirement Details", type: "text", placeholder: "Any important print details" },
];

export const PRODUCT_FIELD_ALIASES = {
  "universal cotton corrugation box": "packaging box",
  "universal box": "packaging box",
  "corrugation box": "packaging box",
  "selflock box": "selflock mailer flap box",
  "self lock box": "selflock mailer flap box",
  "mailer box": "selflock mailer flap box",
  "flap box": "selflock mailer flap box",
  "ice cream hole box": "packaging box",
  "ice cream mustroom holes box": "packaging box",
  "ice cream mushroom holes box": "packaging box",
  "cake box": "cake box",
  "sweet box": "sweet box",
  "pastry box": "cake box",
  "pasry box": "cake box",
  "pizza box": "cake box",
  "tier cake box": "cake box",
  "cake base": "cake base",
  "plum box": "cake box",
  "brownie box": "brownie box",
  "cupcake box": "packaging box",
  "cup cake box": "cup cake box",
  "bento box": "bento box",
  "jar cake": "jar cake",
  "candle box": "cake box",
  "sandwich box": "sandwich waffle box",
  "sandwich waffle box": "sandwich waffle box",
  "burger box": "burger",
  burger: "burger",
  "popcorn box": "popcorn box",
  "biryani box": "biryani box",
  "biriyani box": "biryani box",
  tray: "tray",
  monocarton: "packaging box",
  "monocotton box": "monocotton box",
  "branding box": "branding box",
  "monocotton box / branding box": "monocotton box",
  "monocotton box branding box": "monocotton box",
  "MONOCOTTON BOX / BRANDING BOX": "monocotton box",
  "plain and customized box": "plain and customized box",
  "one side fully close one side open": "zipper pouch",
  "both side transparent": "both side transparent",
  "one side silver one side transparent": "one side silver one side transparent",
  "fully closed": "zipper pouch",
  "without zipper": "zipper pouch",
  "with window": "zipper pouch",
  "zippe pouch plain": "zipper pouch",
  "packaging pouch plain": "zipper pouch plain",
  cylinder: "zipper pouch",
  digital: "zipper pouch",
  flexo: "zipper pouch",
  "screen printing": "zipper pouch",
  "wood plastic spoon": "wood plastic spoon",
  "wood/plastic spoon": "wood plastic spoon",
  "normal flex": "flex printing",
  "black media flex": "flex printing",
  "star flex": "flex printing",
  "reflector flex": "reflector flex",
  "roll up standee": "roll up standee",
  "promotional umbrella": "promotional umbrella",
  "normal paper sticker": "normal paper sticker",
  "paper sticker": "normal paper sticker",
  "normal sticker": "normal paper sticker",
  "vinyl": "vinyl sticker",
  "polycarbonate": "polycarbonate sticker",
  "dome": "dome sticker",
  "pvc": "pvc sticker",
  "visiting card": "visiting card",
  "normal visiting card": "visiting card",
  "synthetic visiting card": "visiting card",
  "scent card visiting card": "visiting card",
  "curve cutting visiting card": "visiting card",
  "uv visiting card": "visiting card",
};

export function normalizeLookupKey(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeFieldConfigKey(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim();
}

const PRODUCT_FIELDS_BY_CONFIG_KEY = Object.entries(PRODUCT_FIELDS).reduce((acc, [key, value]) => {
  acc[normalizeFieldConfigKey(key)] = value;
  return acc;
}, {});

Object.entries(PRODUCT_FIELD_ALIASES).forEach(([alias, canonical]) => {
  const canonicalFields = PRODUCT_FIELDS[canonical];
  if (canonicalFields) {
    PRODUCT_FIELDS_BY_CONFIG_KEY[normalizeFieldConfigKey(alias)] = canonicalFields;
  }
});

function resolveFieldSetByTokens(tokens) {
  if (!tokens.length) return null;
  const has = (word) => tokens.includes(word);
  const hasAny = (words) => words.some((word) => has(word));

  if (has("envelope")) return ENVELOPE_FIELDS;
  if (hasAny(["pouch", "zipper", "zippe"])) return ZIPPER_POUCH_FIELDS;
  if (hasAny(["cup", "spout"])) return FOOD_CUP_FIELDS;
  if (hasAny(["dosa", "shawarma"])) return WRAP_FIELDS;
  if (hasAny(["spoon", "knife"])) return ACCESSORY_FIELDS;
  if (has("box") || hasAny(["corrugated", "corrugation", "monocarton", "tray", "burger", "biryani", "popcorn"])) {
    return BOX_PACKAGING_FIELDS;
  }
  return null;
}

function resolveFieldSetByName(name) {
  if (!name) return null;
  const key = normalizeLookupKey(name);
  const aliasKey = PRODUCT_FIELD_ALIASES[key];
  if (aliasKey && PRODUCT_FIELDS[aliasKey]) return PRODUCT_FIELDS[aliasKey];
  if (PRODUCT_FIELDS[key]) return PRODUCT_FIELDS[key];

  const tokenMatch = resolveFieldSetByTokens(key.split(" ").filter(Boolean));
  if (tokenMatch) return tokenMatch;

  for (const [k, v] of Object.entries(PRODUCT_FIELDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

export function resolveFieldSetByFieldConfigKey(fieldConfigKey) {
  if (!fieldConfigKey) return null;
  return PRODUCT_FIELDS_BY_CONFIG_KEY[normalizeFieldConfigKey(fieldConfigKey)] || null;
}

export function matchProductFields(typeName, subtypeName, typeFieldConfigKey, subtypeFieldConfigKey) {
  const subtypeKeyMatch = resolveFieldSetByFieldConfigKey(subtypeFieldConfigKey);
  if (subtypeKeyMatch) return subtypeKeyMatch;

  const typeKeyMatch = resolveFieldSetByFieldConfigKey(typeFieldConfigKey);
  if (typeKeyMatch) return typeKeyMatch;

  const subtypeMatch = resolveFieldSetByName(subtypeName);
  if (subtypeMatch) return subtypeMatch;

  // Some subtypes are stored as short labels (e.g. "Plain") while the field mapping
  // keys are full phrases (e.g. "zipper pouch plain"). Try combined lookups before
  // falling back to type-only.
  if (typeName && subtypeName) {
    const combined1 = resolveFieldSetByName(`${typeName} ${subtypeName}`);
    if (combined1) return combined1;
    const combined2 = resolveFieldSetByName(`${subtypeName} ${typeName}`);
    if (combined2) return combined2;
  }

  return resolveFieldSetByName(typeName);
}



