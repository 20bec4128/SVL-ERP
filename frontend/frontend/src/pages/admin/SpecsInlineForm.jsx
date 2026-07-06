// frontend/frontend/src/pages/admin/SpecsInlineForm.jsx
import React from "react";
import { getConfiguredSizeDimensions, getDimensionStorageKey } from "../../utils/customSizeUtils";
import {
  ACCESSORY_FIELDS,
  AGRALIC_2D_FIELDS,
  AGRALIC_3D_FIELDS,
  BENTO_BOX_FIELDS,
  BIRIYANI_BOX_FIELDS,
  BLACK_LIGHT_FLEX_FIELDS,
  BOTH_SIDE_TRANSPARENT_POUCH_FIELDS,
  BOX_PACKAGING_FIELDS,
  BRANDING_BOX_FIELDS,
  BROCHURE_FIELDS,
  BROWNIE_BOX_FIELDS,
  BURGER_BOX_FIELDS,
  CAKE_BASE_FIELDS,
  CAKE_BOX_FIELDS,
  CORRUGATED_ROLL_FIELDS,
  CORRUGATED_SHEET_FIELDS,
  CUP_CAKEE_BOX_FIELDS,
  CUP_FIELDS,
  CUSTOM_PAPER_STICKER_FIELDS,
  DAILY_CALENDAR_FIELDS,
  DAIRY_FIELDS,
  DOCTOR_FILE_FIELDS,
  ENVELOPE_FIELDS,
  FLEX_PRINTING_FIELDS,
  FLEX_WITH_COLOUR_AND_VARIENT_FIELDS,
  FLEX_WITH_COLOUR_FIELDS,
  FOAM_STICKER_FIELDS,
  FOOD_CUP_FIELDS,
  ICE_CREAM_FIELDS,
  JAR_CAKE_FIELDS,
  JUICE_CUP_WITH_SPOUT_FIELDS,
  LED_CUTTING_WITH_LIGHTING_FIELDS,
  MONOCOTTON_BOX_FIELDS,
  MONTHLY_CALENDAR_FIELDS,
  NOTEPAD_FIELDS,
  ONE_SIDE_SILVER_ONE_SIDE_TRANSPARENT_POUCH_FIELDS,
  PAMPHLET_FIELDS,
  PLAIN_CUSTOMIZED_BOX_FIELDS,
  POCKET_CALENDAR_FIELDS,
  POLYCARBONATE_STICKER_FIELDS,
  POPCORN_BOX_FIELDS,
  PRINTING_ZIPPER_POUCH_FIELDS,
  REFLECTOR_FLEX_FIELDS,
  SANDWICH_WAFFLE_BOX_FIELDS,
  SELFLOCK_MAILER_FLAP_BOX_FIELDS,
  SWEET_BOX_FIELDS,
  TABLE_TOP_CALENDAR_FIELDS,
  TRAY_FIELDS,
  VINYL_STICKER_FIELDS,
  VISITING_CARD_FIELDS,
  WOOD_PLASTIC_SPOON_FIELDS,
  WRAP_FIELDS,
  ZIPPER_POUCH_FIELDS,
  ZIPPER_POUCH_PLAIN_FIELDS,
} from "../../utils/productFieldConfigs";

const LEGACY_CUSTOM_SIZE_FIELD_KEYS = new Set(["customWidth", "customHeight", "customDepth"]);

// Keys must match the typeName values returned by the backend price list API.
// If a typeName has no entry here, SpecsInlineForm renders nothing — which is fine.
const TYPE_FIELD_MAP = {
  "Box Packaging": BOX_PACKAGING_FIELDS,
  "Food Cup": FOOD_CUP_FIELDS,
  "Wrap": WRAP_FIELDS,
  "Accessory": ACCESSORY_FIELDS,
  "Wood Plastic Spoon": WOOD_PLASTIC_SPOON_FIELDS,
  "Ice Cream": ICE_CREAM_FIELDS,
  "Monocotton Box": MONOCOTTON_BOX_FIELDS,
  "Branding Box": BRANDING_BOX_FIELDS,
  "Plain Customized Box": PLAIN_CUSTOMIZED_BOX_FIELDS,
  "Flex Printing": FLEX_PRINTING_FIELDS,
  "Flex With Colour": FLEX_WITH_COLOUR_FIELDS,
  "Flex With Colour And Varient": FLEX_WITH_COLOUR_AND_VARIENT_FIELDS,
  "Visiting Card": VISITING_CARD_FIELDS,
  "Reflector Flex": REFLECTOR_FLEX_FIELDS,
  "Black Light Flex": BLACK_LIGHT_FLEX_FIELDS,
  "LED Cutting With Lighting": LED_CUTTING_WITH_LIGHTING_FIELDS,
  "Agralic 2D": AGRALIC_2D_FIELDS,
  "Agralic 3D": AGRALIC_3D_FIELDS,
  "Custom Paper Sticker": CUSTOM_PAPER_STICKER_FIELDS,
  "Vinyl Sticker": VINYL_STICKER_FIELDS,
  "Polycarbonate Sticker": POLYCARBONATE_STICKER_FIELDS,
  "Foam Sticker": FOAM_STICKER_FIELDS,
  "Zipper Pouch": ZIPPER_POUCH_FIELDS,
  "Zipper Pouch Plain": ZIPPER_POUCH_PLAIN_FIELDS,
  "Both Side Transparent Pouch": BOTH_SIDE_TRANSPARENT_POUCH_FIELDS,
  "Printing Zipper Pouch": PRINTING_ZIPPER_POUCH_FIELDS,
  "One Side Silver One Side Transparent Pouch": ONE_SIDE_SILVER_ONE_SIDE_TRANSPARENT_POUCH_FIELDS,
  "Envelope": ENVELOPE_FIELDS,
  "Notepad": NOTEPAD_FIELDS,
  "Dairy": DAIRY_FIELDS,
  "Daily Calendar": DAILY_CALENDAR_FIELDS,
  "Monthly Calendar": MONTHLY_CALENDAR_FIELDS,
  "Pocket Calendar": POCKET_CALENDAR_FIELDS,
  "Table Top Calendar": TABLE_TOP_CALENDAR_FIELDS,
  "Doctor File": DOCTOR_FILE_FIELDS,
  "Pamphlet": PAMPHLET_FIELDS,
  "Brochure": BROCHURE_FIELDS,
  "Corrugated Roll": CORRUGATED_ROLL_FIELDS,
  "Corrugated Sheet": CORRUGATED_SHEET_FIELDS,
  "Cake Box": CAKE_BOX_FIELDS,
  "Jar Cake": JAR_CAKE_FIELDS,
  "Sandwich Waffle Box": SANDWICH_WAFFLE_BOX_FIELDS,
  "Burger Box": BURGER_BOX_FIELDS,
  "Popcorn Box": POPCORN_BOX_FIELDS,
  "Biriyani Box": BIRIYANI_BOX_FIELDS,
  "Cup": CUP_FIELDS,
  "Juice Cup With Spout": JUICE_CUP_WITH_SPOUT_FIELDS,
  "Tray": TRAY_FIELDS,
  "Sweet Box": SWEET_BOX_FIELDS,
  "Cake Base": CAKE_BASE_FIELDS,
  "Brownie Box": BROWNIE_BOX_FIELDS,
  "Cup Cake Box": CUP_CAKEE_BOX_FIELDS,
  "Bento Box": BENTO_BOX_FIELDS,
  "Selflock Mailer Flap Box": SELFLOCK_MAILER_FLAP_BOX_FIELDS,
};

export default function SpecsInlineForm({ typeName, specs, onChange }) {
  const fields = TYPE_FIELD_MAP[typeName] ?? [];
  if (!fields.length) return null;

  function handleChange(key, value) {
    onChange({ ...specs, [key]: value });
  }

  function handleFieldValueChange(field, value) {
    const next = { ...specs, [field.key]: value };

    if (field.key === "size") {
      if (value !== "Custom") {
        getConfiguredSizeDimensions(field).forEach((dimension) => {
          delete next[getDimensionStorageKey(dimension)];
        });
        delete next.customUnit;
        delete next.sizeCustom;
      } else if (field.customDimensionUnit) {
        next.customUnit = field.customDimensionUnit;
      }
    }

    onChange(next);
  }

  // Build parent-key map for hidden fields before rendering.
  // Hidden fields are only visible when their preceding allowCustom field === "Custom".
  const hiddenParentMap = {};
  let lastAllowCustomKey = null;
  for (const field of fields) {
    if (field.allowCustom) lastAllowCustomKey = field.key;
    if (field.hidden) hiddenParentMap[field.key] = lastAllowCustomKey;
  }

  const rendered = [];
  for (const field of fields) {
    if (LEGACY_CUSTOM_SIZE_FIELD_KEYS.has(field.key)) {
      continue;
    }

    if (field.hidden) {
      const parentKey = hiddenParentMap[field.key];
      if (!parentKey || specs[parentKey] !== "Custom") continue;
    }

    rendered.push(
      <div key={field.key} className="col-md-4">
        <label className="form-label small mb-1">{field.label}</label>
        {field.type === "select" ? (
          <>
            <select
              className="form-select form-select-sm"
              value={specs[field.key] ?? ""}
              onChange={(e) => handleFieldValueChange(field, e.target.value)}
            >
              <option value="">--</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {field.allowCustom && specs[field.key] === "Custom" && field.customSizeMode === "text" && (
              <input
                type="text"
                className="form-control form-control-sm mt-1"
                placeholder={field.customPlaceholder ?? "Enter custom value"}
                value={specs[`${field.key}Custom`] ?? ""}
                onChange={(e) => handleChange(`${field.key}Custom`, e.target.value)}
              />
            )}
            {field.key === "size" && specs[field.key] === "Custom" && field.customSizeMode !== "text" && getConfiguredSizeDimensions(field).length > 0 && (
              <div className="mt-2">
                {getConfiguredSizeDimensions(field).map((dimension) => {
                  const storageKey = getDimensionStorageKey(dimension);
                  return (
                    <input
                      key={storageKey}
                      type="number"
                      className="form-control form-control-sm mt-1"
                      placeholder={`Enter ${dimension}${field.customDimensionUnit ? ` in ${field.customDimensionUnit}` : ""}`}
                      value={specs[storageKey] ?? ""}
                      onChange={(e) => onChange({
                        ...specs,
                        [field.key]: "Custom",
                        customUnit: field.customDimensionUnit || specs.customUnit || "",
                        [storageKey]: e.target.value,
                      })}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <input
            type={field.type === "number" ? "number" : "text"}
            className="form-control form-control-sm"
            placeholder={field.placeholder ?? ""}
            value={specs[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
        )}
      </div>
    );
  }

  return <div className="row g-2">{rendered}</div>;
}
