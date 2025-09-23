import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders the provided content", () => {
    render(<Button>Добавить ссылку</Button>);

    expect(screen.getByRole("button", { name: "Добавить ссылку" })).toBeVisible();
  });

  it("calls provided handlers", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Сохранить</Button>);

    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
