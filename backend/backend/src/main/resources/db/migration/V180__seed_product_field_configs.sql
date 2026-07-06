-- ============================================================
-- V180__seed_product_field_configs.sql
-- Seeds all product field configs using exact service_type IDs
-- from the service_types table (verified against DB on 2026-04-15)
--
-- ID reference:
--   1   = Visiting card
--   2   = Flex Printing
--   3   = Sticker Items
--   4   = LED Sign Board
--   5   = ENVELOPE
--   6   = NOTE PAD
--   7   = DAIRY
--   8   = CALENDER (parent)
--   9   = DOCTOR FILE
--   10  = PAMPLET
--   11  = BROCHURE
--   53  = Normal visiting card        (parent: 1)
--   54  = Synthatic fornt & back      (parent: 1)
--   62  = sent card front & back      (parent: 1)
--   63  = curve cutting front& back   (parent: 1)
--   64  = UV visiting card front&back (parent: 1)
--   65  = CORRUGATED / BOX PACKAGING  (parent)
--   66  = FAST FOOD BOX               (parent)
--   67  = ZIPPER POUCH                (parent)
--   68  = CORRUGATED ROLL             (parent: 65)
--   69  = CORRUGATED SHEET            (parent: 65)
--   70  = UNIVERSAL/COTTON/CORRUGATION BOX (parent: 65)
--   71  = SELFLOCK / MAILER / FLAP BOX     (parent: 65)
--   72  = FRAME BOX                   (parent: 65)
--   73  = ICE CREAM / MUSHROOM HOLES BOX   (parent: 65)
--   74  = CAKE BOX                    (parent: 65)
--   75  = SWEET BOX                   (parent: 65)
--   76  = PASTRY BOX                  (parent: 65)
--   77  = PIZZA BOX                   (parent: 65)
--   78  = TIER CAKE BOX               (parent: 65)
--   79  = CAKE BASE                   (parent: 65)
--   80  = PLUM BOX                    (parent: 65)
--   81  = BROWNIE BOX                 (parent: 65)
--   82  = CANDLE BOX                  (parent: 65)
--   83  = KNIFE                       (parent: 65)
--   84  = CUP CAKE BOX                (parent: 65)
--   85  = BENTO BOX                   (parent: 65)
--   86  = JAR CAKE                    (parent: 65)
--   87  = SANDWICH / WAFFLE BOX       (parent: 66)
--   88  = DOSA , SHAWARMA             (parent: 66)
--   89  = BURGER                      (parent: 66)
--   90  = POPCORN BOX                 (parent: 66)
--   91  = CUP                         (parent: 66)
--   92  = JUICE CUP WITH SPOUT        (parent: 66)
--   93  = TRAY                        (parent: 66)
--   94  = BIRIYANI BOX                (parent: 66)
--   95  = WOOD / PLASTIC SPOON        (parent: 66)
--   96  = ICE CREAM                   (parent: 66)
--   97  = MONOCOTTON BOX / BRANDING BOX (parent: 66)
--   98  = ZIPPER POUCH PLAIN          (parent: 67)
--   99  = FULLY CLOSED                (parent: 67)
--   100 = WITH WINDOW                 (parent: 67)
--   101 = ONE SIDE FULLY CLOSE ONE SIDE OPEN (parent: 67)
--   102 = BOTH SIDE TRANSPARENT       (parent: 67)
--   103 = WITHOUT ZIPPER              (parent: 67)
--   105 = Normal Flex                 (parent: 2)
--   106 = Black Media Flex            (parent: 2)
--   107 = Star Flex                   (parent: 2)
--   108 = Reflector Flex              (parent: 2)
--   109 = Roll Up Standee             (parent: 2)
--   110 = Promotional Umbrella        (parent: 2)
--   111 = Normal Paper Sticker        (parent: 3)
--   112 = Vinyl Sticker               (parent: 3)
--   113 = Polycarbonate Sticker       (parent: 3)
--   114 = Dome Sticker                (parent: 3)
--   115 = Pvc Sticker                 (parent: 3)
--   116 = Foam                        (parent: 3)
--   117 = Sun Pack Board              (parent: 3)
--   118 = BLACK LIGHT FLEX            (parent: 4)
--   119 = LED CUTTING WITH LIGHTING   (parent: 4)
--   120 = 2D AGRALIC                  (parent: 4)
--   121 = 3D AGRALIC                  (parent: 4)
--   122 = Daily Calender              (parent: 8)
--   123 = Monthly Calender            (parent: 8)
--   124 = Pocket Calender             (parent: 8)
--   125 = Table Top Calender          (parent: 8)
--   126 = PRINTING ZIPPER POUCH       (parent: 67)
--   127 = ONE SIDE SILVER ONE SIDE TRANSPARENT (parent: 67)
-- ============================================================


-- ============================================================
-- ID 1 — Visiting card
-- IDs 53, 54, 62, 63, 64 — subtypes (same fields)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(1,'size','Card Size','select','["3.5x2 inches","Custom"]'::jsonb,false,null,true,false,1,false,true),
(1,'orientation','Orientation','select','["Horizontal","Vertical"]'::jsonb,false,null,false,false,2,false,true),
(1,'cornerType','Corner Type','select','["Normal","Round"]'::jsonb,false,null,false,false,3,false,true),
(1,'paperGsm','Paper GSM','select','["300","350","400"]'::jsonb,false,null,false,false,4,false,true),
(1,'printType','Print Type','select','["Front Only","Front & Back"]'::jsonb,false,null,false,false,5,false,true),
(1,'color','Color','select','["Single","Multi"]'::jsonb,false,null,false,false,6,false,true),
(1,'lamination','Lamination','select','["Matte","Gloss","Velvet"]'::jsonb,false,null,false,false,7,false,true),
(1,'foilingType','Foiling Type','select','["Gold Foil","Silver Foil"]'::jsonb,false,null,false,false,8,false,true),
(1,'embossingType','Embossing Type','select','["With Embossing","Without Embossing"]'::jsonb,false,null,false,false,9,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- Subtypes 53, 54, 62, 63, 64 — same visiting card fields
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT s.id,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f
CROSS JOIN (SELECT unnest(ARRAY[53,54,62,63,64]) AS id) s
WHERE f.service_type_id = 1;


-- ============================================================
-- ID 2 — Flex Printing (parent — same fields as subtypes below)
-- IDs 105, 106, 107 — Normal Flex, Black Media Flex, Star Flex
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(2,'size','Size','select','["Small (2x1 ft)","Medium (4x2 ft)","Large (6x3 ft)","Extra Large (8x4 ft)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(2,'customWidth','Width (ft)','number',null,false,null,false,true,2,false,true),
(2,'customHeight','Height (ft)','number',null,false,null,false,true,3,false,true),
(2,'orientation','Orientation','select','["Horizontal","Vertical"]'::jsonb,false,null,false,false,4,false,true),
(2,'required','Required','select','["Flex Only","Flex with Frame"]'::jsonb,false,null,false,false,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- 105, 106, 107 — same as Flex Printing
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT s.id,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f
CROSS JOIN (SELECT unnest(ARRAY[105,106,107]) AS id) s
WHERE f.service_type_id = 2;


-- ============================================================
-- ID 108 — Reflector Flex
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(108,'size','Size','select','["Custom"]'::jsonb,false,null,true,false,1,false,true),
(108,'orientation','Orientation','select','["Horizontal","Vertical"]'::jsonb,false,null,false,false,2,false,true),
(108,'colour','Colour','select','["All Colours","Custom"]'::jsonb,false,null,true,false,3,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 109 — Roll Up Standee
-- ID 110 — Promotional Umbrella
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(109,'size','Size','select','["Small (2x1 ft)","Medium (4x2 ft)","Large (6x3 ft)","Extra Large (8x4 ft)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(109,'customWidth','Width (ft)','number',null,false,null,false,true,2,false,true),
(109,'customHeight','Height (ft)','number',null,false,null,false,true,3,false,true),
(109,'orientation','Orientation','select','["Horizontal","Vertical"]'::jsonb,false,null,false,false,4,false,true),
(109,'required','Required','select','["Flex Only","Flex with Frame"]'::jsonb,false,null,false,false,5,false,true),
(109,'colour','Colour','select','["Red","Blue","Green","Yellow","Custom"]'::jsonb,false,null,true,false,6,false,true),
(109,'bottomVarient','Bottom Varient','select','["Stand","Flat"]'::jsonb,false,null,false,false,7,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT 110,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f WHERE f.service_type_id = 109;


-- ============================================================
-- ID 118 — BLACK LIGHT FLEX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(118,'size','Size','select','["Custom"]'::jsonb,false,null,true,false,1,false,true),
(118,'customWidth','Width (ft)','number',null,false,null,false,true,2,false,true),
(118,'customHeight','Height (ft)','number',null,false,null,false,true,3,false,true),
(118,'ledType','Led Type','select','["Box","Flex","Back Side Led Tubelight"]'::jsonb,false,null,false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 119 — LED CUTTING WITH LIGHTING
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(119,'size','Size','select','["Mock Small (2x1 ft)","Mock Medium (4x2 ft)","Mock Large (6x3 ft)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(119,'customWidth','Width (ft)','number',null,false,null,false,true,2,false,true),
(119,'customHeight','Height (ft)','number',null,false,null,false,true,3,false,true),
(119,'ledType','Led Type','select','["Box","Flex","Back Side Led Tubelight"]'::jsonb,false,null,false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 120 — 2D AGRALIC
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(120,'size','Size','select','["Small (2x1 ft)","Medium (4x2 ft)","Large (6x3 ft)","Extra Large (8x4 ft)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(120,'customWidth','Width (ft)','number',null,false,null,false,true,2,false,true),
(120,'customHeight','Height (ft)','number',null,false,null,false,true,3,false,true),
(120,'requirementDetails','Requirement Details','text',null,false,'Enter requirement details',false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 121 — 3D AGRALIC
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(121,'size','Size','select','["Small (2x1x1 ft)","Medium (4x2x1.5 ft)","Large (6x3x2 ft)","Extra Large (8x4x2.5 ft)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(121,'customWidth','Width (ft)','number',null,false,null,false,true,2,false,true),
(121,'customHeight','Height (ft)','number',null,false,null,false,true,3,false,true),
(121,'customDepth','Depth (ft)','number',null,false,null,false,true,4,false,true),
(121,'requirementDetails','Requirement Details','text',null,false,'Enter requirement details',false,false,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 4 — LED Sign Board
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(4,'widthFt','Width (ft)','number',null,false,null,false,false,1,false,true),
(4,'heightFt','Height (ft)','number',null,false,null,false,false,2,false,true),
(4,'ledColour','LED Colour','select','["White","Warm white","RGB multicolour","Red","Blue","Green"]'::jsonb,false,null,false,false,3,false,true),
(4,'mounting','Mounting','select','["Wall mount","Ceiling hang","Stand alone","Pole mount"]'::jsonb,false,null,false,false,4,false,true),
(4,'powerSupply','Power Supply','select','["Indoor 220V","Outdoor weatherproof"]'::jsonb,false,null,false,false,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 3 — Sticker Items
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(3,'shape','Shape','select','["Rectangle","Circle","Square","Custom die-cut"]'::jsonb,false,null,false,false,1,false,true),
(3,'widthMm','Width (mm)','number',null,false,null,false,false,2,false,true),
(3,'heightMm','Height (mm)','number',null,false,null,false,false,3,false,true),
(3,'lamination','Lamination','select','["None","Matte","Glossy","UV"]'::jsonb,false,null,false,false,4,false,true),
(3,'adhesive','Adhesive','select','["Permanent","Removable","Waterproof"]'::jsonb,false,null,false,false,5,false,true),
(3,'printColours','Print Colours','select','["Full colour CMYK","Single colour","2 colour"]'::jsonb,false,null,false,false,6,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- IDs 111,114,115,117 — Normal Paper Sticker, Dome, PVC, Sun Pack
-- (same fields)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(111,'size','Size','select','["Small (2x1 inch)","Medium (3x2 inch)","Large (4x3 inch)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(111,'stickerShape','Sticker Shape','select','["Square","Round","Custom"]'::jsonb,false,null,true,false,2,false,true),
(111,'pastingType','Pasting Type (Product)','select','["Custom"]'::jsonb,false,null,true,false,3,false,true),
(111,'lamination','Lamination','select','["Matte","Gloss"]'::jsonb,false,null,false,false,4,false,true),
(111,'stickerType','Sticker Type','select','["Roll","Sheet"]'::jsonb,false,null,false,false,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT s.id,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f
CROSS JOIN (SELECT unnest(ARRAY[114,115,117]) AS id) s
WHERE f.service_type_id = 111;


-- ============================================================
-- IDs 112, 113 — Vinyl Sticker, Polycarbonate Sticker
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(112,'size','Size','select','["Small (2x1 inch)","Medium (3x2 inch)","Large (4x3 inch)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(112,'stickerShape','Sticker Shape','select','["Square","Round","Custom"]'::jsonb,false,null,true,false,2,false,true),
(112,'pastingType','Pasting Type (Product)','select','["Custom"]'::jsonb,false,null,true,false,3,false,true),
(112,'lamination','Lamination','select','["Matte","Gloss","Transparent"]'::jsonb,false,null,false,false,4,false,true),
(112,'stickerType','Sticker Type','select','["Roll","Sheet"]'::jsonb,false,null,false,false,5,false,true),
(112,'gummingType','Gumming Type','select','["Normal Gum","SunSui Gum"]'::jsonb,false,null,false,false,6,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT 113,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f WHERE f.service_type_id = 112;


-- ============================================================
-- ID 116 — Foam
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(116,'foamThickness','Foam Thickness','select','["3 Mm","4 Mm","5 Mm","8 Mm"]'::jsonb,false,null,false,false,1,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 5 — ENVELOPE
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(5,'size','Size','select','["DL (110x220 mm)","C6 (114x162 mm)","C5 (162x229 mm)","C4 (229x324 mm)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(5,'colour','Colour','select','["Single colour","Multicolour"]'::jsonb,false,null,false,false,2,false,true),
(5,'printType','Print Type','select','["Front Only","Front & Back"]'::jsonb,false,null,false,false,3,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 6 — NOTE PAD
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(6,'size','Size','select','["A4","A5","Legal"]'::jsonb,false,null,false,false,1,false,true),
(6,'color','Color','select','["Single","Multi"]'::jsonb,false,null,false,false,2,false,true),
(6,'gsm','GSM','select','["70 Gsm","80 Gsm","100 Gsm"]'::jsonb,false,null,false,false,3,false,true),
(6,'requirementDetails','Requirement Details','text',null,false,'Enter requirement details',false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 7 — DAIRY
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(7,'size','Size','select','["Small (5x7 inch)","Medium (7x10 inch)","Large (8.5x11 inch)","A5 (5.8x8.3 inch)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(7,'dairyType','Dairy Type','select','["Readymade","Customize"]'::jsonb,false,null,false,false,2,false,true),
(7,'customize','Customize','select','["Inner Detail","Outer Details"]'::jsonb,false,null,false,false,3,false,true),
(7,'dairyOuterType','Dairy Outer Type','select','["Leather","Art Paper"]'::jsonb,false,null,false,false,4,false,true),
(7,'colour','Colour','select','["Single colour","Multicolour"]'::jsonb,false,null,false,false,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 122 — Daily Calender
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(122,'variant','Variant','select','["Normal","Dye Cut","Gold Foil"]'::jsonb,false,null,true,false,1,false,true),
(122,'size','Calendar Size','select','["6 x 9","10 x 15","12 x 18","5 x 20","11 x 17","14 x 24","20 x 30","23 x 36","Custom"]'::jsonb,false,null,true,false,2,false,true),
(122,'cakeSize','Cake Size','select','["4 No","5 No","6 No","7 No","20 No","Mega"]'::jsonb,false,null,false,false,3,false,true),
(122,'colour','Colour','select','["Single","Double","Multi"]'::jsonb,false,null,false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 123 — Monthly Calender
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(123,'paperVariant','Paper Variant','select','["Maplitho Paper","Art Paper"]'::jsonb,false,null,false,false,1,false,true),
(123,'gsm','GSM','select','["70 Gsm","80 Gsm","100 Gsm","120 Gsm","180 Gsm"]'::jsonb,false,null,false,false,2,false,true),
(123,'size','Size','select','["15 x 20","17 x 27","20 x 29","20 x 30","Custom"]'::jsonb,false,null,true,false,3,false,true),
(123,'sheet','Sheet','select','["6 Sheet","12 Sheet"]'::jsonb,false,null,false,false,4,false,true),
(123,'colour','Colour','select','["Single","Multi"]'::jsonb,false,null,false,false,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 124 — Pocket Calender
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(124,'gsm','GSM','text',null,false,'Enter GSM',false,false,1,false,true),
(124,'size','Size','select','["3.5 x 5 inch","4 x 6 inch","5 x 7 inch","6 x 8 inch","Custom"]'::jsonb,false,null,true,false,2,false,true),
(124,'lamination','Lamination','select','["Matt","Glossy"]'::jsonb,false,null,false,false,3,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 125 — Table Top Calender
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(125,'size','Size','select','["8.25 x 8.75 (Approx)","9.2 x 6.1 (Approx)","10 x 5.7 (Approx)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(125,'colour','Colour','select','["Single","Multi"]'::jsonb,false,null,false,false,2,false,true),
(125,'gsm','GSM','text',null,false,'Enter GSM',false,false,3,false,true),
(125,'bottomType','Bottom Type','select','["With Square","Without Square"]'::jsonb,false,null,false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 9 — DOCTOR FILE (has trailing space in DB — using ID)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(9,'size','Size','select','["19.25 x 12.20 (Inches)","17.72 x 12.44 (Inches)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(9,'gsm','GSM','select','["300 Gsm","400 Gsm"]'::jsonb,false,null,false,false,2,false,true),
(9,'fileFinishing','File Finishing','select','["Creasing","Creasing + Punching","Dye Cut"]'::jsonb,false,null,false,false,3,false,true),
(9,'lamination','Lamination','select','["Matt","Glossy"]'::jsonb,false,null,false,false,4,false,true),
(9,'paper','Paper','select','["Synthetic","Normal"]'::jsonb,false,null,false,false,5,false,true),
(9,'innerType','Inner Type','select','["Clip","Pouch","Clip & Pouch"]'::jsonb,false,null,false,false,6,false,true),
(9,'sides','Sides','text',null,false,'Enter number of sides',false,false,7,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 10 — PAMPLET
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(10,'size','Size','select','["A4","A5","Legal","Custom"]'::jsonb,false,null,true,false,1,false,true),
(10,'colour','Colour','select','["Single colour","Multicolour"]'::jsonb,false,null,false,false,2,false,true),
(10,'printType','Print Type','select','["Front Only","Front & Back"]'::jsonb,false,null,false,false,3,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 11 — BROCHURE
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(11,'size','Size','select','["A4 (210 x 297 mm)","A5 (148 x 210 mm)","6 x 9 inch","8.5 x 11 inch","Custom"]'::jsonb,false,null,true,false,1,false,true),
(11,'paperVariant','Paper Variant','select','["Maplitho Paper","Art Paper"]'::jsonb,false,null,false,false,2,false,true),
(11,'lamination','Lamination','select','["Matt","Glossy"]'::jsonb,false,null,false,false,3,false,true),
(11,'gsm','GSM','select','["70 Gsm","80 Gsm","100 Gsm","120 Gsm","150 Gsm","Custom"]'::jsonb,false,null,true,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 65 — CORRUGATED / BOX PACKAGING (parent)
-- Fields: BOX_PACKAGING_FIELDS
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(65,'lengthCm','Length (cm)','number',null,false,null,false,false,1,false,true),
(65,'widthCm','Width (cm)','number',null,false,null,false,false,2,false,true),
(65,'heightCm','Height (cm)','number',null,false,null,false,false,3,false,true),
(65,'loadCapacityKg','Load Capacity (kg)','number',null,false,null,false,false,4,false,true),
(65,'boxStyle','Box Style','select','["RSC","Die-cut","Mailer","Flap"]'::jsonb,false,null,false,false,5,false,true),
(65,'ply','Ply','select','["Single","3","5","7"]'::jsonb,false,null,false,false,6,false,true),
(65,'fluteType','Flute Type','select','["E","B","C","BC"]'::jsonb,false,null,false,false,7,false,true),
(65,'boardGsm','Board GSM','text',null,false,'e.g. 150, 200, 300',false,false,8,false,true),
(65,'printingMethod','Printing Method','select','["Flexo","Offset","Digital"]'::jsonb,false,null,false,false,9,false,true),
(65,'printColours','Print Colours','select','["Plain","1 colour","2 colour","CMYK"]'::jsonb,false,null,false,false,10,false,true),
(65,'finish','Finish','select','["Matte","Glossy","UV","Emboss"]'::jsonb,false,null,false,false,11,false,true),
(65,'usageType','Usage Type','select','["Food","Retail","E-commerce","Industrial"]'::jsonb,false,null,false,false,12,false,true),
(65,'addons','Add-ons','text',null,false,'e.g. Partition, Handle, Window',false,false,13,false,true),
(65,'dielineAvailable','Dieline Available','select','["Yes","No"]'::jsonb,false,null,false,false,14,false,true),
(65,'foodSafe','Food Safe','select','["Yes","No"]'::jsonb,false,null,false,false,15,false,true),
(65,'greaseProof','Grease Proof','select','["Yes","No"]'::jsonb,false,null,false,false,16,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ID 72 — FRAME BOX — same as 65
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT 72,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f WHERE f.service_type_id = 65;

-- ID 66 — FAST FOOD BOX — same as 65
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT 66,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f WHERE f.service_type_id = 65;


-- ============================================================
-- ID 68 — CORRUGATED ROLL
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(68,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(68,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(68,'height','Height (Size)','text',null,false,'Enter height',false,false,3,false,true),
(68,'ply','Ply','select','["2"]'::jsonb,false,null,false,false,4,false,true),
(68,'fluteType','Flute Type','select','["E","B","C","BC"]'::jsonb,false,null,false,false,5,false,true),
(68,'boardGsm','Board GSM','text',null,false,'Enter GSM',false,false,6,false,true),
(68,'printingMethod','Printing Method','select','["Offset","Screen Printing"]'::jsonb,false,null,false,false,7,false,true),
(68,'printColours','Print Colours','select','["Plain","1 Colour","2 Colour","Multi Colour"]'::jsonb,false,null,false,false,8,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 69 — CORRUGATED SHEET
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(69,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(69,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(69,'height','Height (Size)','text',null,false,'Enter height',false,false,3,false,true),
(69,'ply','Ply','select','["3","5","7"]'::jsonb,false,null,false,false,4,false,true),
(69,'fluteType','Flute Type','select','["E","B","C","BC"]'::jsonb,false,null,false,false,5,false,true),
(69,'boardGsm','Board GSM','text',null,false,'Enter GSM',false,false,6,false,true),
(69,'printingMethod','Printing Method','select','["Offset","Screen Printing"]'::jsonb,false,null,false,false,7,false,true),
(69,'printColours','Print Colours','select','["Plain","1 Colour","2 Colour","Multi Colour"]'::jsonb,false,null,false,false,8,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 70 — UNIVERSAL / COTTON / CORRUGATION BOX (same as 65)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT 70,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f WHERE f.service_type_id = 65;


-- ============================================================
-- ID 71 — SELFLOCK / MAILER / FLAP BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(71,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(71,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(71,'width','Width (Size)','text',null,false,'Enter width',false,false,3,false,true),
(71,'height','Height (Size)','text',null,false,'Enter height',false,false,4,false,true),
(71,'loadCapacity','Load Capacity','select','["Kg","Gram","Custom"]'::jsonb,false,null,true,false,5,false,true),
(71,'boxStyle','Box Style','select','["Rsc","Dye Cut"]'::jsonb,false,null,false,false,6,false,true),
(71,'ply','Ply','select','["3","5","7"]'::jsonb,false,null,false,false,7,false,true),
(71,'fluteType','Flute Type','select','["E","B","C","BC"]'::jsonb,false,null,false,false,8,false,true),
(71,'boardGsm','Board GSM','text',null,false,'Enter GSM',false,false,9,false,true),
(71,'printingMethod','Printing Method','select','["Offset","Screen Printing"]'::jsonb,false,null,false,false,10,false,true),
(71,'printColours','Print Colours','select','["Plain","1 Colour","2 Colour","Multi Colour"]'::jsonb,false,null,false,false,11,false,true),
(71,'boxInnerColour','Box Inner Colour Type','select','["White","Golden Brown","Normal Brown","Ice Brown"]'::jsonb,false,null,false,false,12,false,true),
(71,'boxOuterColour','Box Outer Colour Type','select','["White","Golden Brown","Normal Brown","Ice Brown"]'::jsonb,false,null,false,false,13,false,true),
(71,'productType','Product Type','text',null,false,'Enter product type',false,false,14,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 73 — ICE CREAM / MUSHROOM HOLES BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(73,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(73,'length','Length (Size)','text',null,false,'Custom',false,false,2,false,true),
(73,'width','Width (Size)','text',null,false,'Custom',false,false,3,false,true),
(73,'height','Height (Size)','text',null,false,'Custom',false,false,4,false,true),
(73,'gsm','GSM','text',null,false,'Custom',false,false,5,false,true),
(73,'lamination','Lamination','select','["Matte","Glossy"]'::jsonb,false,null,false,false,6,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- IDs 74,76,77,78,80,82 — CAKE BOX, PASTRY, PIZZA, TIER, PLUM, CANDLE
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(74,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(74,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(74,'width','Width (Size)','text',null,false,'Enter width',false,false,3,false,true),
(74,'height','Height (Size)','text',null,false,'Enter height',false,false,4,false,true),
(74,'gsm','GSM','text',null,false,'Enter GSM',false,false,5,false,true),
(74,'lamination','Lamination','select','["Matte","Gloss"]'::jsonb,false,null,false,false,6,false,true),
(74,'boxOuterType','Box Outer Type','select','["White","Readymade Box"]'::jsonb,false,null,false,false,7,false,true),
(74,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,8,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT s.id,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f
CROSS JOIN (SELECT unnest(ARRAY[76,77,78,80,82]) AS id) s
WHERE f.service_type_id = 74;


-- ============================================================
-- ID 75 — SWEET BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(75,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(75,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(75,'width','Width (Size)','text',null,false,'Enter width',false,false,3,false,true),
(75,'height','Height (Size)','text',null,false,'Enter height',false,false,4,false,true),
(75,'gsm','Gsm','text',null,false,'Enter GSM',false,false,5,false,true),
(75,'lamination','Lamination','select','["Matt","Gloss"]'::jsonb,false,null,false,false,6,false,true),
(75,'boxOuterType','Box Outer Type','select','["White","Readymade Box"]'::jsonb,false,null,false,false,7,false,true),
(75,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,8,false,true),
(75,'partition','Partition','select','["With Partition","Without Partition"]'::jsonb,false,null,false,false,9,false,true),
(75,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,10,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 79 — CAKE BASE
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(79,'size','Size','select','["Small (6 inch)","Medium (8 inch)","Large (10 inch)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(79,'customWidth','Width (mm)','number',null,false,null,false,true,2,false,true),
(79,'customHeight','Height (mm)','number',null,false,null,false,true,3,false,true),
(79,'colour','Colour','select','["Gold","Silver"]'::jsonb,false,null,false,false,4,false,true),
(79,'printingMethod','Printing Method','select','["With Printing","Without Printing"]'::jsonb,false,null,false,false,5,false,true),
(79,'shapeType','Shape Type','select','["Round","Square","Dye Cut Model"]'::jsonb,false,null,false,false,6,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 81 — BROWNIE BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(81,'size','Size','select','["Small (4x4x2 inch)","Medium (6x6x3 inch)","Large (8x8x4 inch)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(81,'customWidth','Width (mm)','number',null,false,null,false,true,2,false,true),
(81,'customHeight','Height (mm)','number',null,false,null,false,true,3,false,true),
(81,'customDepth','Depth (mm)','number',null,false,null,false,true,4,false,true),
(81,'productQty','Product Qty','select','["1 Pcs","3 Pcs","4 Pcs","6 Pcs","9 Pcs"]'::jsonb,false,null,false,false,5,false,true),
(81,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,6,false,true),
(81,'gsm','Gsm','text',null,false,'Enter GSM',false,false,7,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 83 — KNIFE (accessory fields)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(83,'material','Material','select','["Wood","Plastic"]'::jsonb,false,null,false,false,1,false,true),
(83,'size','Size','text',null,false,null,false,false,2,false,true),
(83,'accessoryType','Type','select','["Disposable","Re-usable"]'::jsonb,false,null,false,false,3,false,true),
(83,'foodGrade','Food Grade','select','["Yes","No"]'::jsonb,false,null,false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 84 — CUP CAKE BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(84,'size','Size','select','["Single (3x3x3 inch)","4 Cavity (8x4x3 inch)","6 Cavity (8x8x3 inch)","Custom"]'::jsonb,false,null,true,false,1,false,true),
(84,'customWidth','Width (mm)','number',null,false,null,false,true,2,false,true),
(84,'customHeight','Height (mm)','number',null,false,null,false,true,3,false,true),
(84,'customDepth','Depth (mm)','number',null,false,null,false,true,4,false,true),
(84,'gsm','Gsm','text',null,false,'Enter GSM',false,false,5,false,true),
(84,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,6,false,true),
(84,'partition','Partition','select','["With Partition","Without Partition"]'::jsonb,false,null,false,false,7,false,true),
(84,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,8,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 85 — BENTO BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(85,'type','Type','select','["Plastic","Wood","Bambo"]'::jsonb,false,null,false,false,1,false,true),
(85,'size','Size','select','["Small (6x4x3 inch)","Medium (8x6x4 inch)","Large (10x8x5 inch)","Custom"]'::jsonb,false,null,true,false,2,false,true),
(85,'customWidth','Width (mm)','number',null,false,null,false,true,3,false,true),
(85,'customHeight','Height (mm)','number',null,false,null,false,true,4,false,true),
(85,'customDepth','Depth (mm)','number',null,false,null,false,true,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 86 — JAR CAKE
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(86,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(86,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(86,'width','Width (Size)','text',null,false,'Enter width',false,false,3,false,true),
(86,'height','Height (Size)','text',null,false,'Enter height',false,false,4,false,true),
(86,'gsm','GSM','text',null,false,'Enter GSM',false,false,5,false,true),
(86,'lamination','Lamination','select','["Matte","Gloss"]'::jsonb,false,null,false,false,6,false,true),
(86,'boxOuterType','Box Outer Type','select','["White","Readymade Box"]'::jsonb,false,null,false,false,7,false,true),
(86,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,8,false,true),
(86,'handleType','Handle Type','select','["With Handle","Without Handle"]'::jsonb,false,null,false,false,9,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 87 — SANDWICH / WAFFLE BOX
-- ID 88 — DOSA , SHAWARMA (same fields)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(87,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(87,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(87,'width','Width (Size)','text',null,false,'Enter width',false,false,3,false,true),
(87,'height','Height (Size)','text',null,false,'Enter height',false,false,4,false,true),
(87,'boxType','Box Type','select','["Plain","Readymade","Customized"]'::jsonb,false,null,false,false,5,false,true),
(87,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,6,false,true),
(87,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,7,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT 88,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f WHERE f.service_type_id = 87;


-- ============================================================
-- ID 89 — BURGER
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(89,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(89,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(89,'width','Width (Size)','text',null,false,'Enter width',false,false,3,false,true),
(89,'height','Height (Size)','text',null,false,'Enter height',false,false,4,false,true),
(89,'boxType','Box Type','select','["Plain","Readymade","Customized"]'::jsonb,false,null,false,false,5,false,true),
(89,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,6,false,true),
(89,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,7,false,true),
(89,'foldingType','Folding Type','select','["Manual","Customized"]'::jsonb,false,null,false,false,8,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 90 — POPCORN BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(90,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(90,'length','Length (Size)','text',null,false,'Enter length',false,false,2,false,true),
(90,'width','Width (Size)','text',null,false,'Enter width',false,false,3,false,true),
(90,'height','Height (Size)','text',null,false,'Enter height',false,false,4,false,true),
(90,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,5,false,true),
(90,'shapeType','Shape Type','select','["Round","Square","Dye Cut Model"]'::jsonb,false,null,false,false,6,false,true),
(90,'boxType','Box Type','select','["Plain","Readymade","Customized"]'::jsonb,false,null,false,false,7,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 91 — CUP
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(91,'capacityMl','Capacity (ml)','number',null,false,null,false,false,1,false,true),
(91,'material','Material','select','["Paper","Plastic","Bagasse"]'::jsonb,false,null,false,false,2,false,true),
(91,'gsm','GSM','text',null,false,null,false,false,3,false,true),
(91,'printingMethod','Printing Method','select','["Screen","Digital","Flexo","Offset"]'::jsonb,false,null,false,false,4,false,true),
(91,'printType','Print Type','select','["Single colour","Multicolour"]'::jsonb,false,null,false,false,5,false,true),
(91,'lamination','Lamination','select','["None","Matte","Glossy"]'::jsonb,false,null,false,false,6,false,true),
(91,'lidType','Lid Type','select','["Flat","Dome","Spout"]'::jsonb,false,null,false,false,7,false,true),
(91,'foodSafe','Food Safe','select','["Yes","No"]'::jsonb,false,null,false,false,8,false,true),
(91,'leakProof','Leak Proof','select','["Yes","No"]'::jsonb,false,null,false,false,9,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 92 — JUICE CUP WITH SPOUT
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(92,'measurement','Measurement','select','["mm","cm","inch"]'::jsonb,false,null,false,false,1,false,true),
(92,'size','Size','select','["Small","Medium","Large"]'::jsonb,false,null,false,false,2,false,true),
(92,'boxType','Box Type','select','["Plain","Readymade","Customized"]'::jsonb,false,null,false,false,3,false,true),
(92,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,4,false,true),
(92,'cupType','Cup Type','select','["Plastic","Organic"]'::jsonb,false,null,false,false,5,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 93 — TRAY
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(93,'measurement','Measurement','select','["mm","cm","inch"]'::jsonb,false,null,false,false,1,false,true),
(93,'size','Size','select','["Small","Medium","Large"]'::jsonb,false,null,false,false,2,false,true),
(93,'boxType','Box Type','select','["Plain","Readymade","Customized"]'::jsonb,false,null,false,false,3,false,true),
(93,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,4,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 94 — BIRIYANI BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(94,'boxType','Box Type','select','["Plastic","Board"]'::jsonb,false,null,false,false,1,false,true),
(94,'shapeType','Shape Type','select','["Round","Square"]'::jsonb,false,null,false,false,2,false,true),
(94,'handleType','Handle Type','select','["With Handle","Without Handle"]'::jsonb,false,null,false,false,3,false,true),
(94,'innerLamination','Inner Lamination','select','["With Lamination","Without Lamination"]'::jsonb,false,null,false,false,4,false,true),
(94,'colour','Colour','select','["Plain","Readymade","Customized"]'::jsonb,false,null,false,false,5,false,true),
(94,'size','Size','select','["Small","Medium","Large"]'::jsonb,false,null,false,false,6,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 95 — WOOD / PLASTIC SPOON
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(95,'type','Type','select','["Wood","Plastic"]'::jsonb,false,null,false,false,1,false,true),
(95,'size','Size','text',null,false,'Custom size',false,false,2,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 96 — ICE CREAM
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(96,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(96,'length','Length (Size)','text',null,false,'Custom',false,false,2,false,true),
(96,'width','Width (Size)','text',null,false,'Custom',false,false,3,false,true),
(96,'height','Height (Size)','text',null,false,'Custom',false,false,4,false,true),
(96,'gsm','GSM','text',null,false,'Custom',false,false,5,false,true),
(96,'lamination','Lamination','select','["Matte","Gloss"]'::jsonb,false,null,false,false,6,false,true),
(96,'boxOuterType','Box Outer Type','select','["White","Readymade Box"]'::jsonb,false,null,false,false,7,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 97 — MONOCOTTON BOX / BRANDING BOX
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(97,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(97,'length','Length (Size)','text',null,false,'Custom',false,false,2,false,true),
(97,'width','Width (Size)','text',null,false,'Custom',false,false,3,false,true),
(97,'height','Height (Size)','text',null,false,'Custom',false,false,4,false,true),
(97,'gsm','GSM','text',null,false,'Custom',false,false,5,false,true),
(97,'lamination','Lamination','select','["Matte","Glossy"]'::jsonb,false,null,false,false,6,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 67 — ZIPPER POUCH (parent)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(67,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(67,'widthMm','Width (mm)','number',null,false,null,false,false,2,false,true),
(67,'heightMm','Height (mm)','number',null,false,null,false,false,3,false,true),
(67,'gussetMm','Gusset (mm)','text',null,false,null,false,false,4,false,true),
(67,'material','Material','select','["BOPP","PET/PE","Foil"]'::jsonb,false,null,false,false,5,false,true),
(67,'layers','Layers','select','["2","3","4"]'::jsonb,false,null,false,false,6,false,true),
(67,'pouchType','Type','select','["With Window","Without Zipper"]'::jsonb,false,null,false,false,7,false,true),
(67,'printingMethod','Printing Method','select','["Digital","Rotogravure","Flexo"]'::jsonb,false,null,false,false,8,false,true),
(67,'printType','Print Type','select','["Single","Multicolour"]'::jsonb,false,null,false,false,9,false,true),
(67,'finish','Finish','select','["Matte","Glossy"]'::jsonb,false,null,false,false,10,false,true),
(67,'zipper','Zipper','select','["Yes","No"]'::jsonb,false,null,false,false,11,false,true),
(67,'tearNotch','Tear Notch','select','["Yes","No"]'::jsonb,false,null,false,false,12,false,true),
(67,'foodGrade','Food Grade','select','["Yes","No"]'::jsonb,false,null,false,false,13,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 98 — ZIPPER POUCH PLAIN
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(98,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(98,'width','Width','text',null,false,'Custom',false,false,2,false,true),
(98,'height','Height','text',null,false,'Custom',false,false,3,false,true),
(98,'gusset','Gusset','text',null,false,'Custom',false,false,4,false,true),
(98,'layers','Layers','select','["2","3","4"]'::jsonb,false,null,false,false,5,false,true),
(98,'zipperType','Zipper Type','select','["With Zipper","Without Zipper"]'::jsonb,false,null,false,false,6,false,true),
(98,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,7,false,true),
(98,'tearNotch','Tear Notch','select','["Yes","No"]'::jsonb,false,null,false,false,8,false,true),
(98,'pouchColour','Pouch Colour','select','["All Colours","Custom"]'::jsonb,false,null,true,false,9,false,true),
(98,'printingType','Printing Type','select','["Single","Double","Multicolour"]'::jsonb,false,null,false,false,10,false,true),
(98,'printingMethod','Printing Method','select','["Screen Printing","Digital","Rotogravure","Flexo"]'::jsonb,false,null,false,false,11,false,true),
(98,'printingSides','Printing Sides','select','["Front Only","Back","Front & Back"]'::jsonb,false,null,false,false,12,false,true),
(98,'foodGrade','Food Grade','select','["Yes","No"]'::jsonb,false,null,false,false,13,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- IDs 99,100,101,103 — FULLY CLOSED, WITH WINDOW,
--                       ONE SIDE FULLY CLOSE, WITHOUT ZIPPER
-- (same base fields as zipper pouch plain minus printing fields)
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(99,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(99,'width','Width','text',null,false,'Custom',false,false,2,false,true),
(99,'height','Height','text',null,false,'Custom',false,false,3,false,true),
(99,'gusset','Gusset','text',null,false,'Custom',false,false,4,false,true),
(99,'layers','Layers','select','["2","3","4"]'::jsonb,false,null,false,false,5,false,true),
(99,'zipperType','Zipper Type','select','["With Zipper","Without Zipper"]'::jsonb,false,null,false,false,6,false,true),
(99,'tearNotch','Tear Notch','select','["Yes","No"]'::jsonb,false,null,false,false,7,false,true),
(99,'foodGrade','Food Grade','select','["Yes","No"]'::jsonb,false,null,false,false,8,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT s.id,f.field_key,f.label,f.field_type,f.options,f.is_required,f.placeholder,f.allow_custom,f.is_hidden,f.display_order,f.has_unit,f.is_active
FROM product_field_configs f
CROSS JOIN (SELECT unnest(ARRAY[100,101,103]) AS id) s
WHERE f.service_type_id = 99;


-- ============================================================
-- ID 102 — BOTH SIDE TRANSPARENT
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(102,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(102,'width','Width','text',null,false,'Custom',false,false,2,false,true),
(102,'height','Height','text',null,false,'Custom',false,false,3,false,true),
(102,'gusset','Gusset','text',null,false,'Custom',false,false,4,false,true),
(102,'layers','Layers','select','["2","3","4"]'::jsonb,false,null,false,false,5,false,true),
(102,'zipperType','Zipper Type','select','["With Zipper","Without Zipper"]'::jsonb,false,null,false,false,6,false,true),
(102,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,7,false,true),
(102,'tearNotch','Tear Notch','select','["Yes","No"]'::jsonb,false,null,false,false,8,false,true),
(102,'foodGrade','Food Grade','select','["Yes","No"]'::jsonb,false,null,false,false,9,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 126 — PRINTING ZIPPER POUCH
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(126,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(126,'width','Width','text',null,false,'Custom',false,false,2,false,true),
(126,'height','Height','text',null,false,'Custom',false,false,3,false,true),
(126,'gusset','Gusset','text',null,false,'Custom',false,false,4,false,true),
(126,'layers','Layers','select','["2","3","4"]'::jsonb,false,null,false,false,5,false,true),
(126,'zipperType','Zipper Type','select','["With Zipper","Without Zipper"]'::jsonb,false,null,false,false,6,false,true),
(126,'windowType','Window Type','select','["With Window","Without Window"]'::jsonb,false,null,false,false,7,false,true),
(126,'tearNotch','Tear Notch','select','["Yes","No"]'::jsonb,false,null,false,false,8,false,true),
(126,'printingType','Printing Type','select','["Single","Double","Multicolour"]'::jsonb,false,null,false,false,9,false,true),
(126,'printingMethod','Printing Method','select','["Screen Printing","Digital","Rotogravure","Flexo"]'::jsonb,false,null,false,false,10,false,true),
(126,'printingSides','Printing Sides','select','["Front Only","Back","Front & Back"]'::jsonb,false,null,false,false,11,false,true),
(126,'foodGrade','Food Grade','select','["Yes","No"]'::jsonb,false,null,false,false,12,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
-- ============================================================
-- ID 127 — ONE SIDE SILVER ONE SIDE TRANSPARENT
-- ============================================================
INSERT INTO product_field_configs (service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
SELECT v.service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active FROM (VALUES
(127,'measurement','Measurement','select','["mm","cm","inch","feet"]'::jsonb,false,null,false,false,1,false,true),
(127,'width','Width','text',null,false,'Custom',false,false,2,false,true),
(127,'height','Height','text',null,false,'Custom',false,false,3,false,true),
(127,'gusset','Gusset','text',null,false,'Custom',false,false,4,false,true),
(127,'layers','Layers','select','["2","3","4"]'::jsonb,false,null,false,false,5,false,true),
(127,'zipperType','Zipper Type','select','["With Zipper","Without Zipper"]'::jsonb,false,null,false,false,6,false,true),
(127,'tearNotch','Tear Notch','select','["Yes","No"]'::jsonb,false,null,false,false,7,false,true),
(127,'printingType','Printing Type','select','["Single","Double","Multicolour"]'::jsonb,false,null,false,false,8,false,true),
(127,'printingMethod','Printing Method','select','["Screen Printing","Digital","Rotogravure","Flexo"]'::jsonb,false,null,false,false,9,false,true),
(127,'foodGrade','Food Grade','select','["Yes","No"]'::jsonb,false,null,false,false,10,false,true)
) AS v(service_type_id,field_key,label,field_type,options,is_required,placeholder,allow_custom,is_hidden,display_order,has_unit,is_active)
JOIN service_types st ON st.id = v.service_type_id;
