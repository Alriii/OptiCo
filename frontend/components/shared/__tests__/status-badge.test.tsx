import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/shared/status-badge";

describe("StatusBadge", () => {
  it("renders an accessible pending label instead of a confirmed one", () => {
    render(<StatusBadge kind="appointment" status="PENDING" />);

    expect(screen.getByText("Awaiting approval")).toBeInTheDocument();
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
  });
});
