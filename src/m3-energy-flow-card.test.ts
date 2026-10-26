import { describe, it, expect } from "vitest";
import { M3EnergyFlowCard } from "./m3-energy-flow-card";
import { FLOW_NODE_HEAT_PUMP_COLOR } from "./const";
import type { HomeAssistant } from "./types";

function mockHass(states: Record<string, { state: string; attributes?: Record<string, unknown> }> = {}): HomeAssistant {
  return {
    states,
    language: "de",
    locale: { language: "de" },
  } as unknown as HomeAssistant;
}

describe("M3EnergyFlowCard individual devices & heat pump", () => {
  it("defaults to 250px height when no battery and no individual devices", () => {
    const card = new M3EnergyFlowCard();
    card.hass = mockHass();
    card.setConfig({
      type: "custom:m3-energy-flow-card",
      source: "entities",
    });

    const diagram = (card as unknown as {
      _buildDiagram: (colors: Record<string, string>, showBattery: boolean) => {
        nodes: Array<{ key: string; x: number; y: number; value: number }>;
        flows: Array<{ key: string; path: string; value: number }>;
        viewHeight: number;
      };
    })._buildDiagram(
      { pv: "#ffd54f", grid: "#4fc3f7", home: "#b39ddb", battery: "#81c784" },
      false,
    );

    expect(diagram.viewHeight).toBe(250);
    expect(diagram.nodes.some((n) => n.key === "battery")).toBe(false);
    expect(diagram.nodes.some((n) => n.key.startsWith("individual"))).toBe(false);
  });

  it("places battery below home (268, 280) when no individual devices are present", () => {
    const card = new M3EnergyFlowCard();
    card.hass = mockHass();
    card.setConfig({
      type: "custom:m3-energy-flow-card",
      source: "entities",
    });

    const diagram = (card as unknown as {
      _buildDiagram: (colors: Record<string, string>, showBattery: boolean) => {
        nodes: Array<{ key: string; x: number; y: number; value: number }>;
        flows: Array<{ key: string; path: string; value: number }>;
        viewHeight: number;
      };
    })._buildDiagram(
      { pv: "#ffd54f", grid: "#4fc3f7", home: "#b39ddb", battery: "#81c784" },
      true,
    );

    expect(diagram.viewHeight).toBe(350);
    const batt = diagram.nodes.find((n) => n.key === "battery");
    expect(batt).toBeDefined();
    expect(batt?.x).toBe(268);
    expect(batt?.y).toBe(280);
  });

  it("places single individual device (e.g. heat pump) at (268, 280) and shifts battery to (160, 280)", () => {
    const card = new M3EnergyFlowCard();
    card.hass = mockHass({
      "sensor.heat_pump_energy": {
        state: "12.5",
        attributes: { friendly_name: "Wärmepumpe", unit_of_measurement: "kWh" },
      },
    });
    card.setConfig({
      type: "custom:m3-energy-flow-card",
      source: "entities",
      individual: [
        {
          entity: "sensor.heat_pump_energy",
          name: "Wärmepumpe",
        },
      ],
    });

    // Simulate loaded values
    (card as unknown as {
      _individualValues: Array<{ config: { entity: string; name: string }; value: number }>;
    })._individualValues = [{ config: { entity: "sensor.heat_pump_energy", name: "Wärmepumpe" }, value: 12.5 }];

    const diagram = (card as unknown as {
      _buildDiagram: (colors: Record<string, string>, showBattery: boolean) => {
        nodes: Array<{ key: string; x: number; y: number; value: number; icon: string; color: string }>;
        flows: Array<{ key: string; path: string; value: number }>;
        viewHeight: number;
      };
    })._buildDiagram(
      { pv: "#ffd54f", grid: "#4fc3f7", home: "#b39ddb", battery: "#81c784" },
      true,
    );

    expect(diagram.viewHeight).toBe(350);

    // Battery should shift to middle column (160, 280)
    const batt = diagram.nodes.find((n) => n.key === "battery");
    expect(batt).toBeDefined();
    expect(batt?.x).toBe(160);
    expect(batt?.y).toBe(280);

    // Heat pump sits under home (268, 280)
    const ind1 = diagram.nodes.find((n) => n.key === "individual-1");
    expect(ind1).toBeDefined();
    expect(ind1?.x).toBe(268);
    expect(ind1?.y).toBe(280);
    expect(ind1?.value).toBe(12.5);
    expect(ind1?.icon).toBe("mdi:heat-pump");
    expect(ind1?.color).toBe(FLOW_NODE_HEAT_PUMP_COLOR);

    // Flow from home to heat pump
    const flowHp = diagram.flows.find((f) => f.key === "home-individual-1");
    expect(flowHp).toBeDefined();
    expect(flowHp?.value).toBe(12.5);
  });

  it("places two individual devices (WP + Wallbox) with battery in the 3-column layout", () => {
    const card = new M3EnergyFlowCard();
    card.hass = mockHass();
    card.setConfig({
      type: "custom:m3-energy-flow-card",
      source: "entities",
      individual: [
        { name: "Wärmepumpe", entity: "sensor.wp" },
        { name: "Wallbox", entity: "sensor.ev", icon: "mdi:car-electric" },
      ],
    });

    (card as unknown as {
      _individualValues: Array<{ config: { entity: string; name: string }; value: number }>;
    })._individualValues = [
      { config: { entity: "sensor.wp", name: "Wärmepumpe" }, value: 10 },
      { config: { entity: "sensor.ev", name: "Wallbox" }, value: 15 },
    ];

    const diagram = (card as unknown as {
      _buildDiagram: (colors: Record<string, string>, showBattery: boolean) => {
        nodes: Array<{ key: string; x: number; y: number; value: number }>;
        flows: Array<{ key: string; path: string; value: number }>;
        viewHeight: number;
      };
    })._buildDiagram(
      { pv: "#ffd54f", grid: "#4fc3f7", home: "#b39ddb", battery: "#81c784" },
      true,
    );

    // Device 1 under home
    const ind1 = diagram.nodes.find((n) => n.key === "individual-1");
    expect(ind1?.x).toBe(268);
    expect(ind1?.y).toBe(280);

    // Battery in center
    const batt = diagram.nodes.find((n) => n.key === "battery");
    expect(batt?.x).toBe(160);
    expect(batt?.y).toBe(280);

    // Device 2 under grid
    const ind2 = diagram.nodes.find((n) => n.key === "individual-2");
    expect(ind2?.x).toBe(52);
    expect(ind2?.y).toBe(280);

    // Both flows exist
    expect(diagram.flows.some((f) => f.key === "home-individual-1")).toBe(true);
    expect(diagram.flows.some((f) => f.key === "home-individual-2")).toBe(true);
  });

  it("subtracts individual consumption from home when subtract_individual is true (default)", () => {
    const card = new M3EnergyFlowCard();
    card.hass = mockHass();
    card.setConfig({
      type: "custom:m3-energy-flow-card",
      source: "entities",
      subtract_individual: true,
    });

    (card as unknown as {
      _solarTotal: number;
      _gridImport: number;
      _gridExport: number;
      _batteryCharge: number;
      _batteryDischarge: number;
      _individualValues: Array<{ config: { entity: string }; value: number }>;
    })._solarTotal = 20;
    (card as unknown as { _gridImport: number })._gridImport = 10;
    (card as unknown as { _gridExport: number })._gridExport = 5;
    (card as unknown as { _batteryCharge: number })._batteryCharge = 0;
    (card as unknown as { _batteryDischarge: number })._batteryDischarge = 0;
    // Total raw home = 20 + 10 - 5 = 25 kWh
    // Individual WP = 8 kWh
    (card as unknown as {
      _individualValues: Array<{ config: { entity: string }; value: number }>;
    })._individualValues = [{ config: { entity: "sensor.wp" }, value: 8 }];

    const diagram = (card as unknown as {
      _buildDiagram: (colors: Record<string, string>, showBattery: boolean) => {
        nodes: Array<{ key: string; value: number }>;
      };
    })._buildDiagram(
      { pv: "#ffd54f", grid: "#4fc3f7", home: "#b39ddb", battery: "#81c784" },
      false,
    );

    const homeNode = diagram.nodes.find((n) => n.key === "home");
    // Expected: 25 - 8 = 17 kWh
    expect(homeNode?.value).toBe(17);
  });

  it("does not subtract individual consumption when subtract_individual is false", () => {
    const card = new M3EnergyFlowCard();
    card.hass = mockHass();
    card.setConfig({
      type: "custom:m3-energy-flow-card",
      source: "entities",
      subtract_individual: false,
    });

    (card as unknown as {
      _solarTotal: number;
      _gridImport: number;
      _gridExport: number;
      _batteryCharge: number;
      _batteryDischarge: number;
      _individualValues: Array<{ config: { entity: string }; value: number }>;
    })._solarTotal = 20;
    (card as unknown as { _gridImport: number })._gridImport = 10;
    (card as unknown as { _gridExport: number })._gridExport = 5;
    (card as unknown as { _batteryCharge: number })._batteryCharge = 0;
    (card as unknown as { _batteryDischarge: number })._batteryDischarge = 0;
    (card as unknown as {
      _individualValues: Array<{ config: { entity: string }; value: number }>;
    })._individualValues = [{ config: { entity: "sensor.wp" }, value: 8 }];

    const diagram = (card as unknown as {
      _buildDiagram: (colors: Record<string, string>, showBattery: boolean) => {
        nodes: Array<{ key: string; value: number }>;
      };
    })._buildDiagram(
      { pv: "#ffd54f", grid: "#4fc3f7", home: "#b39ddb", battery: "#81c784" },
      false,
    );

    const homeNode = diagram.nodes.find((n) => n.key === "home");
    // Expected: unchanged total 25 kWh
    expect(homeNode?.value).toBe(25);
  });
});
