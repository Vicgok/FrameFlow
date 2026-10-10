import { test, expect } from "@playwright/test";
const bookingId = "00000000-0000-4000-8000-000000000101";
const projectId = "00000000-0000-4000-8000-000000000201";
const clientId = "00000000-0000-4000-8000-000000000001";
test("the complete photographer journey persists across refreshes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Pending payments/ }),
  ).toContainText("₹1,25,000");
  await page.goto("/bookings");
  const card = page
    .locator(".booking-card")
    .filter({ hasText: "Vignesh & Karthiga" });
  const handle = card.getByRole("button", { name: "Drag Vignesh & Karthiga" });
  const from = await handle.boundingBox();
  const column = page.locator(".kanban-column").filter({
    has: page.getByRole("heading", { name: "Confirmed", exact: true }),
  });
  const to = await column.boundingBox();
  expect(from).toBeTruthy();
  expect(to).toBeTruthy();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + 90, to!.y + 110, { steps: 20 });
  await page.mouse.up();
  await expect(
    column.locator(".booking-card").filter({ hasText: "Vignesh & Karthiga" }),
  ).toHaveCount(1);
  await card.locator(".card-open").click();
  await expect(page).toHaveURL(new RegExp(bookingId));
  await page
    .getByRole("button", { name: "Add Payment", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Record ₹25,000 Payment/ }).click();
  await expect(page.locator(".payment-summary-numbers")).toContainText(
    "₹85,000",
  );
  await expect(page.locator(".payment-summary-progress")).toContainText(
    "100% paid",
  );
  await page.goto("/calendar");
  await expect(
    page.locator(".month-cell").filter({
      has: page.getByRole("button", {
        name: "Block time on 14 Oct 2026",
        exact: true,
      }),
    }),
  ).toContainText("Vignesh & Karthiga");
  await page.locator(".top-create").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Client name").fill("Test conflict client");
  await dialog.getByLabel("Phone number").fill("9840098765");
  await dialog.getByLabel("Venue / location").fill("ITC Grand Chola");
  await dialog
    .getByRole("button", { name: "Create Booking", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Schedule conflict" }),
  ).toBeVisible();
  await expect(dialog.locator(".conflict-item")).toContainText(
    "Vignesh & Karthiga",
  );
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.goto(`/bookings/${bookingId}`);
  await page
    .getByLabel("Booking status", { exact: true })
    .selectOption("Shoot Completed");
  await page.getByRole("button", { name: /Open editing workspace/ }).click();
  await expect(page).toHaveURL(new RegExp(projectId));
  await expect(page.locator(".detail-heading")).toContainText("Editing");
  await page.getByRole("checkbox", { name: "Photo Selection" }).check();
  await page.getByRole("button", { name: "Add Request", exact: true }).click();
  await page
    .getByPlaceholder("e.g. Include more candid photos of grandparents.")
    .fill("Include more candid photos of grandparents.");
  await page.getByRole("button", { name: "Save request", exact: true }).click();
  await expect(page.locator(".requests-list")).toContainText(
    "Include more candid photos of grandparents.",
  );
  await page
    .getByRole("button", { name: "Edit Wedding highlight film", exact: true })
    .click();
  await page
    .getByLabel("Assigned to", { exact: true })
    .selectOption({ label: "Siddharth Rao · Editor" });
  await page.getByLabel("Status", { exact: true }).selectOption("In Progress");
  await page
    .getByRole("button", { name: "Save deliverable", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ready for Delivery", exact: true })
    .click();
  await expect(page.locator(".detail-heading")).toContainText(
    "Ready for Delivery",
  );
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Photo Selection" }),
  ).toBeChecked();
  await expect(page.locator(".requests-list")).toContainText(
    "Include more candid photos of grandparents.",
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Pending payments/ }),
  ).toContainText("₹1,00,000");
  await page.keyboard.press("Control+k");
  await page
    .getByPlaceholder("Search clients, events, phone numbers...")
    .fill("Vignesh");
  await expect(page.locator(".search-results")).toContainText(
    "Vignesh & Karthiga",
  );
  expect(errors).toEqual([]);
});
test("booking creation, calendar range blocking, and payment milestones are linked", async ({
  page,
}) => {
  await page.goto("/calendar");
  const start = page.getByRole("button", {
    name: "Block time on 21 Oct 2026",
    exact: true,
  });
  const end = page.getByRole("button", {
    name: "Block time on 22 Oct 2026",
    exact: true,
  });
  const a = await start.boundingBox(),
    z = await end.boundingBox();
  await page.mouse.move(a!.x + 30, a!.y + 30);
  await page.mouse.down();
  await page.mouse.move(z!.x + 30, z!.y + 30, { steps: 12 });
  await page.mouse.up();
  await expect(
    page.getByRole("dialog", { name: "Make room for yourself" }),
  ).toBeVisible();
  await page.getByLabel("Reason", { exact: true }).selectOption("Travel");
  await page
    .getByRole("button", { name: "Block Time", exact: true })
    .last()
    .click();
  await expect(
    page.locator(".calendar-event.block").filter({ hasText: "Travel" }),
  ).toHaveCount(3);
  await page.reload();
  await expect(
    page.locator(".calendar-event.block").filter({ hasText: "Travel" }),
  ).toHaveCount(3);
  await page.locator(".top-create").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Client name").fill("Isha & Rohan");
  await dialog.getByLabel("Phone number").fill("9840022222");
  await dialog.getByLabel("Email", { exact: true }).fill("isha@example.com");
  await dialog.getByLabel("Event date").fill("2026-10-21");
  await dialog.getByLabel("Venue / location").fill("ECR, Chennai");
  await dialog.getByLabel("Advance received (₹)").fill("25500");
  await dialog
    .getByRole("button", { name: "Create Booking", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Schedule conflict" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Continue Anyway" }).click();
  await expect(page.locator(".detail-heading")).toContainText("Isha & Rohan");
  await expect(page.locator(".milestone-list")).toContainText(
    "Booking advance",
  );
  await expect(page.locator(".payment-summary-numbers")).toContainText(
    "₹59,500",
  );
  await page.getByRole("button", { name: "Open editing workspace" }).click();
  await expect(page.locator(".deliverable-list")).toContainText(
    "Highlight film",
  );
  await page
    .getByRole("button", { name: "Add Deliverable", exact: true })
    .click();
  await page.getByLabel("Deliverable name").fill("30-second Instagram teaser");
  await page
    .getByRole("button", { name: "Add Deliverable", exact: true })
    .last()
    .click();
  await expect(page.locator(".deliverable-list")).toContainText(
    "30-second Instagram teaser",
  );
  await page.goto("/clients");
  await expect(page.locator("tbody")).toContainText("Isha & Rohan");
});
test("keyboard board interaction and week time-slot selection work", async ({
  page,
}) => {
  await page.goto("/bookings");
  const drag = page.getByRole("button", { name: "Drag Vignesh & Karthiga" });
  await drag.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(
    page.locator(".kanban-column").filter({
      has: page.getByRole("heading", { name: "Confirmed", exact: true }),
    }),
  ).toContainText("Vignesh & Karthiga");
  await page.goto("/calendar");
  await page.getByRole("button", { name: "Week", exact: true }).click();
  const slot = page.locator(".time-column").nth(1).locator(".time-slot").nth(3);
  await slot.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("All-day block")).not.toBeChecked();
  await page
    .getByRole("button", { name: "Block Time", exact: true })
    .last()
    .click();
  await expect(
    page.locator(".calendar-event.block").filter({ hasText: "Personal" }),
  ).toBeVisible();
});
for (const size of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${size.name}: every page and dialog fits the viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of [
      "/",
      "/bookings",
      "/calendar",
      "/payments",
      "/clients",
      "/projects",
      "/deliverables",
      "/settings",
      `/bookings/${bookingId}`,
      `/projects/${projectId}`,
      `/clients/${clientId}`,
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await page.waitForTimeout(150);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Overflow on ${path} at ${size.width}`,
      ).toBe(true);
      if (size.width > 600) {
        const sidebarBox = await page.locator(".sidebar").boundingBox();
        const mainBox = await page.locator(".app-main").boundingBox();
        expect(
          sidebarBox!.x + sidebarBox!.width,
          "Sidebar must not cover content",
        ).toBeLessThanOrEqual(mainBox!.x + 1);
      }
      if (
        [
          "/",
          "/bookings",
          "/calendar",
          "/payments",
          `/projects/${projectId}`,
        ].includes(path)
      )
        await page.screenshot({
          path: `artifacts/${size.name}-${path === "/" ? "overview" : path.includes(projectId) ? "editing" : path.slice(1)}.png`,
          fullPage: true,
        });
    }
    await page.locator(".top-create").click();
    const box = await page.getByRole("dialog").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1);
    expect(box!.height).toBeLessThanOrEqual(size.height);
    await page.screenshot({
      path: `artifacts/${size.name}-booking-drawer.png`,
    });
    expect(errors).toEqual([]);
    if (size.name === "laptop") {
      await page.getByRole("button", { name: "Close dialog" }).click();
      await expect(page.locator(".sidebar .profile")).toBeInViewport();
    }
  });
}
test("onboarding, notes, notifications, and the final handoff are functional", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".studio-switch").click();
  await page.getByRole("button", { name: "Set up my studio" }).click();
  await page.getByLabel("Studio name").fill("Light & Story Studio");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Booking advance (%)").fill("25");
  await page.getByLabel("Before event (%)").fill("50");
  await page.getByLabel("Before delivery (%)").fill("25");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Go to Dashboard" }).click();
  await page.reload();
  await expect(page.locator(".studio-switch")).toContainText(
    "Light & Story Studio",
  );
  await page.goto(`/bookings/${bookingId}?tab=Notes`);
  await page.getByLabel("Add a note").fill("Venue access opens at 6:30 AM.");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await page.getByRole("button", { name: "Timeline", exact: true }).click();
  await expect(page.locator(".activity-timeline")).toContainText(
    "Venue access opens at 6:30 AM.",
  );
  await page.getByRole("button", { name: "Open notifications" }).click();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.locator(".notification-toolbar")).toContainText("0 unread");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto(`/projects/${projectId}`);
  await page
    .getByRole("button", { name: "Ready for Delivery", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Prepare handoff", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delivery", exact: true })
    .click();
  await expect(page.locator(".detail-heading")).toContainText("Delivered");
  await expect(page.locator(".project-detail-summary")).toContainText("100%");
  await page.reload();
  await expect(
    page.locator(".deliverable-list .badge").filter({ hasText: "Delivered" }),
  ).toHaveCount(7);
});
test("recurring blocks protect availability while allowing non-overlapping bookings", async ({
  page,
}) => {
  await page.goto("/bookings");
  await page.locator(".top-create").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Client name").fill("Leena & Varun");
  await dialog.getByLabel("Phone number").fill("9840044444");
  await dialog.getByLabel("Venue / location").fill("ECR Beach");
  await dialog.getByLabel("Event date").fill("2026-11-10");
  await dialog.getByLabel("Start time").fill("11:00");
  await dialog.getByLabel("End time").fill("13:00");
  await dialog
    .getByRole("button", { name: "Create Booking", exact: true })
    .click();
  await expect(dialog.locator(".conflict-item")).toContainText(
    "Editing · Focus time",
  );
  await dialog.getByRole("button", { name: "Cancel override" }).click();
  await dialog.getByLabel("Start time").fill("16:00");
  await dialog.getByLabel("End time").fill("18:00");
  await dialog
    .getByRole("button", { name: "Create Booking", exact: true })
    .click();
  await expect(page.locator(".detail-heading")).toContainText("Leena & Varun");
});
test("mobile navigation and direct payment actions remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Payments", exact: true }).click();
  await expect(page.locator(".sidebar")).not.toBeInViewport();
  const card = page
    .locator(".mobile-payment-card")
    .filter({ hasText: "Vignesh & Karthiga" });
  await card
    .getByRole("button", { name: "Record Payment", exact: true })
    .click();
  await page.getByRole("button", { name: /Record ₹25,000 Payment/ }).click();
  await expect(card).toContainText("Paid");
  await page.getByRole("button", { name: "Search workspace" }).click();
  await page
    .getByPlaceholder("Search clients, events, phone numbers...")
    .fill("Vignesh");
  await expect(page.locator(".search-results")).toContainText(
    "Vignesh & Karthiga",
  );
});
