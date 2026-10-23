// Chess Camera: drive the app with a synthetic camera (a canvas stream showing
// a board drawn in perspective) and check moves are read, rated and checked.
import { test, expect } from "@playwright/test";

// Where the synthetic board's outer corners a1, h1, h8, a8 sit, as fractions
// of the 640x480 frame: a slightly tilted, foreshortened view.
const CORNERS = [[0.18, 0.9], [0.84, 0.86], [0.72, 0.12], [0.3, 0.14]];

async function startFakeCamera(page) {
  await page.evaluate(async (corners) => {
    const { boardToImage, project, FILES } = await import("./vision.js");
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 480;
    const ctx = c.getContext("2d");
    const H = boardToImage(corners.map(([x, y]) => [x * 640, y * 480]));
    const pieces = {};
    const back = "rnbqkbnr";
    for (let f = 0; f < 8; f++) {
      pieces[FILES[f] + "1"] = "w" + back[f];
      pieces[FILES[f] + "2"] = "wp";
      pieces[FILES[f] + "7"] = "bp";
      pieces[FILES[f] + "8"] = "b" + back[f];
    }
    const fake = { pieces, hand: false };
    const draw = () => {
      ctx.fillStyle = "#556";
      ctx.fillRect(0, 0, 640, 480);
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          ctx.beginPath();
          [[f, r], [f + 1, r], [f + 1, r + 1], [f, r + 1]].forEach(([u, v], i) => {
            const [x, y] = project(H, u, v);
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.fillStyle = (f + r) % 2 ? "#8b5a2b" : "#e8d0a0";
          ctx.fill();
          const p = fake.pieces[FILES[f] + (8 - r)];
          if (p) {
            const [x, y] = project(H, f + 0.5, r + 0.5);
            ctx.beginPath();
            ctx.arc(x, y, 17, 0, Math.PI * 2);
            ctx.fillStyle = p[0] === "w" ? "#fafafa" : "#151515";
            ctx.fill();
          }
        }
      }
      if (fake.hand) {
        ctx.fillStyle = "#d9a07a";
        ctx.fillRect(200 + Math.random() * 120, 150 + Math.random() * 120, 160, 120);
      }
      // A little sensor noise.
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.3)`;
        ctx.fillRect(Math.random() * 640, Math.random() * 480, 2, 2);
      }
    };
    draw();
    setInterval(draw, 50);
    window.fake = fake;
    await window.chessCam.useStream(c.captureStream(20));
  }, CORNERS);
}

// Move a piece on the fake board the way a person would: hand in, move, hand out.
async function physicalMove(page, moves) {
  await page.evaluate(async (moves) => {
    fake.hand = true;
    await new Promise((r) => setTimeout(r, 400));
    for (const [from, to] of moves) {
      if (to) fake.pieces[to] = fake.pieces[from];
      delete fake.pieces[from];
    }
    await new Promise((r) => setTimeout(r, 300));
    fake.hand = false;
  }, moves);
}

test("reads moves from the camera, flags illegal ones and rates legal ones", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "camera flow is the same on both; run once");
  await page.goto("chess/");
  await expect(page.getByText("White to move")).toBeVisible();
  await startFakeCamera(page);

  await page.getByRole("button", { name: "Mark corners" }).click();
  await page.locator("#overlay").scrollIntoViewIfNeeded();
  const box = await page.locator("#overlay").boundingBox();
  for (const [x, y] of CORNERS) await page.mouse.click(box.x + x * box.width, box.y + y * box.height);
  await expect(page.locator("#cam-status")).toContainText("Grid placed");
  await page.getByRole("button", { name: "Start tracking" }).click();
  await expect(page.locator("#feedback")).toContainText("Tracking started");

  const feedback = page.locator("#feedback");
  await physicalMove(page, [["e2", "e4"]]);
  await expect(feedback).toContainText("White played e4");
  await expect(page.getByText("Black to move")).toBeVisible();

  // Knights can't go b8 -> b5.
  await physicalMove(page, [["b8", "b5"]]);
  await expect(feedback).toContainText("Illegal move: Black knight b8→b5");
  await expect(feedback).toContainText("Nc6");
  await physicalMove(page, [["b5", "b8"]]);
  await expect(feedback).toContainText("Board is back");

  // Wrong side moving.
  await physicalMove(page, [["d2", "d4"]]);
  await expect(feedback).toContainText("Not White's turn");
  await physicalMove(page, [["d4", "d2"]]);
  await expect(feedback).toContainText("Board is back");

  for (const [from, to, san] of [["e7", "e5", "e5"], ["g1", "f3", "Nf3"], ["b8", "c6", "Nc6"], ["f1", "c4", "Bc4"], ["g8", "f6", "Nf6"]]) {
    await physicalMove(page, [[from, to]]);
    await expect(feedback).toContainText(`played ${san}`);
  }
  // Castling moves two pieces.
  await physicalMove(page, [["e1", "g1"], ["h1", "f1"]]);
  await expect(feedback).toContainText("White played O-O");
  // A capture: Nf6xe4.
  await physicalMove(page, [["f6", "e4"]]);
  await expect(feedback).toContainText("Black played Nxe4");

  await expect(page.locator("#history")).toContainText("O-O");
  await expect(page.locator("#history .badge").first()).toBeVisible();
  await expect(page.locator("#suggest")).toContainText("Suggested for White");
});

test("tap-to-move board shows legal moves and rates the move", async ({ page }) => {
  await page.goto("chess/");
  await page.locator('[data-sq="g1"]').click();
  await expect(page.locator(".sq.target")).toHaveCount(2);
  await page.locator('[data-sq="f3"]').click();
  await expect(page.locator("#feedback")).toContainText("White played Nf3");
  await expect(page.locator("#legal-summary")).toHaveText("Legal moves for Black (20)");
  await expect(page.locator("#history .badge")).toHaveText(/Best move|Good move/);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("White to move")).toBeVisible();
  await expect(page.locator("#suggest")).toContainText("Suggested for White");
});
