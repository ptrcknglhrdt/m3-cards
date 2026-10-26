---
title: M3 Energy Flow Card
type: m3-energy-flow-card
category: energy
display: Energy Flow
summary: Node diagram of today's solar/grid/home flows
table_order: 3
section_order: 6
---

A node diagram of today's energy flows between solar, grid, battery, and
home, with animated flow dots along the connection lines and a
self-sufficiency bar below.

<img src="docs/images/energy-flow-card.png" alt="Energy Flow Card" width="440">

<details>
<summary>Configuration, examples & options</summary>

```yaml
type: custom:m3-energy-flow-card
source: energy
```

### Data sources

- **`source: energy`** (default): reads solar, grid import/export, and
  battery statistics directly from the HA Energy dashboard.
- **`source: entities`**: `solar_entity`, `grid_import_entity`,
  `grid_export_entity`, `battery_entity` are freely chosen — useful when
  no full Energy dashboard is set up or individual sources need to be
  replaced.

The battery node automatically appears only if a battery source is
configured (`show_battery: auto`, default) — `always`/`never` force its
visibility regardless.

### Individual devices (e.g. Heat Pump, EV charger)

Up to two individual consumers can be displayed in the diagram:
- **`individual`**: List of devices with `entity`, optional `name`, `icon`, and `color`.
  - Heat pumps (detected by "wärmepumpe" / "heat pump") automatically get `mdi:heat-pump` and the theme's heat color.
  - Electric cars / wallboxes automatically get `mdi:car-electric`.
- **`subtract_individual`** (`true`, default): subtracts individual consumer energy from the Home circle to show residual household consumption, matching the behavior of Energy Flow Card Plus.
- In `source: energy`, individual devices configured in the HA Energy Dashboard (`device_consumption`) are auto-discovered if `individual` is not explicitly set.

### Animation

The flow dots run via a CSS animation along the lines
(`flow_speed: slow | normal | fast`) and are omitted entirely (not just
paused) when `animation: "off"` or `prefers-reduced-motion` is active.

### Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `source` | `energy` \| `entities` | `energy` | Data source |
| `solar_entity` / `grid_import_entity` / `grid_export_entity` / `battery_entity` | string | – | Only for `source: entities` |
| `individual` | array | – | List of devices (`entity`, `name`, `icon`, `color`) |
| `subtract_individual` | boolean | `true` | Subtract individual device energy from home total |
| `name` | string | "Energy Flow" | Displayed name |
| `icon` | string | `mdi:transmission-tower` | Icon in the icon tile |
| `show_self_sufficiency` | boolean | `true` | Show the self-sufficiency bar |
| `show_battery` | `auto` \| `always` \| `never` | `auto` | Battery node visibility |
| `flow_speed` | `slow` \| `normal` \| `fast` | `normal` | Flow dot speed |
| `pv_color` / `grid_color` / `home_color` / `battery_color` | string | theme default | Node colors |
| `self_sufficiency_color` | string | `#81c784` | Self-sufficiency bar color |
| `text_color` / `secondary_text_color` | string | theme default | Name / node labels |
| `card_background` | string | glass/solid background | Card background |
| `animation` | `auto` \| `on` \| `off` | `auto` | Flow-dot animation; `auto`/`on` respect `prefers-reduced-motion` |
| `glass_background` | boolean | `true` | Frosted glass background |
| `radius` / `corners` | number / object | `28` | Corner radius, optional per corner |

</details>
