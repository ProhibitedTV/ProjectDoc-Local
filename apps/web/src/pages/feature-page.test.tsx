import { render, screen } from "@testing-library/react";

import { FeaturePage } from "./feature-page";

describe("FeaturePage", () => {
  it("renders the planned-surface copy", () => {
    render(
      <FeaturePage
        title="Upload"
        summary="Reserved for the next intake workflow slice."
        nextStep="Connect uploads to the ingestion API."
      />
    );

    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("Planned Surface")).toBeInTheDocument();
    expect(screen.getByText(/Connect uploads to the ingestion API/)).toBeInTheDocument();
  });
});
