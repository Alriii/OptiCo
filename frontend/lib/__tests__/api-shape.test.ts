import { describe, expect, it } from "vitest";
import { readList, readNumber, readRecord } from "@/lib/api-shape";

describe("tolerant API shape readers", () => {
  it("reads arrays from common collection keys", () => {
    expect(readList<{ id: string }>([{ id: "a" }])).toHaveLength(1);
    expect(
      readList<{ id: string }>({ appointments: [{ id: "b" }] }, "appointments"),
    ).toEqual([{ id: "b" }]);
    expect(readList<{ id: string }>({ items: [{ id: "c" }] })).toEqual([
      { id: "c" },
    ]);
    expect(readList<{ id: string }>({ rows: [{ id: "d" }] })).toEqual([
      { id: "d" },
    ]);
    expect(readList({ unexpected: true })).toEqual([]);
  });

  it("reads numbers and records without throwing on bad input", () => {
    expect(readNumber({ total: 12 }, "total")).toBe(12);
    expect(readNumber({ count: "7" }, "count")).toBe(7);
    expect(readNumber(null, "total")).toBeUndefined();
    expect(readRecord<{ name: string }>({ data: { name: "OptiCo" } })).toEqual({
      name: "OptiCo",
    });
    expect(readRecord("not-a-record")).toBeNull();
  });
});
