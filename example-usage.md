# Enhanced orb-entity-avatar Component Usage Examples

The `orb-entity-avatar` component has been enhanced to support custom display names and tooltips from nested object properties.

## Usage with your data structure

### Original data:
```json
[
    {
        "id": 1,
        "name": "Shampoo Profesional",
        "description": null,
        "status": "activo",
        "currentPrice": "25.00",
        "createdAt": "2025-09-11T16:30:40.317Z",
        "updatedAt": "2025-09-11T16:30:40.317Z",
        "owner": {
            "id": 1,
            "fullName": "Admin Glamour"
        }
    }
]
```

### Component Usage Examples:

#### 1. Using displayNamePath to extract owner.fullName
```html
<orb-entity-avatar
    [entity]="product"
    [displayNamePath]="'owner.fullName'"
    [entityType]="'product'">
</orb-entity-avatar>
```
- **Result**: Tooltip and initials will show "Admin Glamour" (from `owner.fullName`)
- **Initials**: "AG"

#### 2. Using customDisplayName for direct override
```html
<orb-entity-avatar
    [entity]="product"
    [customDisplayName]="'Custom Name'"
    [entityType]="'product'">
</orb-entity-avatar>
```
- **Result**: Tooltip and initials will show "Custom Name"
- **Initials**: "CN"

#### 3. Using customTooltipText for complete control
```html
<orb-entity-avatar
    [entity]="product"
    [displayNamePath]="'owner.fullName'"
    [customTooltipText]="true"
    [tooltipText]="'Created by Admin Glamour'"
    [entityType]="'product'">
</orb-entity-avatar>
```
- **Result**: Initials from "Admin Glamour" (AG), but custom tooltip text
- **Tooltip**: "Created by Admin Glamour"

#### 4. Fallback behavior (existing functionality preserved)
```html
<orb-entity-avatar
    [entity]="product"
    [entityType]="'product'">
</orb-entity-avatar>
```
- **Result**: Uses standard behavior - product name
- **Tooltip**: "Shampoo Profesional"
- **Initials**: "SH"

## New Input Properties

- `displayNamePath?: string` - Dot notation path to extract display name (e.g., "owner.fullName")
- `customDisplayName?: string` - Direct override for display name

## Priority Order

1. **customDisplayName** (if provided and not empty)
2. **displayNamePath** (if provided and path exists in entity)
3. **Standard behavior** (existing getEntityDisplayName logic)

## Tooltip Logic

- If `customTooltipText = true`: Uses the provided `tooltipText`
- If `customTooltipText = false` (default): Uses the resolved display name from the priority order above

This enhancement maintains full backward compatibility while adding the flexibility to show names from nested objects like your `owner.fullName` scenario.