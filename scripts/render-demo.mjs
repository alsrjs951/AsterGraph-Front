import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { resolve } from "node:path";
import assert from "node:assert/strict";

// Capture the running application, using its existing R shortcut and timeline.
// Advance the browser clock one frame at a time so expensive 4K captures cannot
// skip typing, loading, or transitions. No business state or pixels are mocked.
const url = new URL(process.env.DEMO_URL ?? "http://127.0.0.1:4173");
url.searchParams.set("demo", "logistics");
const output = resolve(process.env.DEMO_OUTPUT ?? "artifacts/videos");
const fps = 30;
const duration = 30;
await mkdir(output, { recursive: true });
const master = resolve(output, "AsterGraph-Light-4K.mp4");
const browser = await chromium.launch({ channel: "chrome", headless: true });
let encoder;
let encoding;
try {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => localStorage.setItem("astergraph-theme", "light"));
  const external = [];
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== new URL(url).origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url.href);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "장면 1: 문제", exact: true }).click();
  await page.getByRole("button", { name: "녹화 모드", exact: true }).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  const epoch = new Date("2026-11-01T12:00:00+09:00");
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.keyboard.press("r");
  await page.evaluate(() => {
    window.__captureAnimations = new WeakMap();
  });

  encoder = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "warning", "-y",
    "-f", "image2pipe", "-framerate", String(fps), "-vcodec", "png", "-i", "pipe:0",
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "16",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-metadata", "title=AsterGraph — Operations Intelligence / Light",
    "-metadata", "comment=Actual local prototype, simulated data. 1920x1080 layout rendered at 2x. No audio.",
    master,
  ], { stdio: ["pipe", "ignore", "inherit"] });
  encoding = once(encoder, "close");
  const checkpoints = new Map([
    [0, "01-problem"], [135, "02-connected"], [240, "03-question"],
    [375, "04-impact"], [450, "05-evidence"], [600, "06-response"],
    [855, "07-ontology"],
  ]);
  const samples = [];
  let previousTime = 0;
  for (let frame = 0; frame < duration * fps; frame++) {
    const time = Math.round(frame * 1000 / fps);
    if (frame) await page.clock.runFor(time - previousTime);
    previousTime = time;
    // CSS animations otherwise follow wall time, unlike requestAnimationFrame.
    // Keep their original keyframes/easing, but sample at the same film clock.
    await page.evaluate((time) => {
      for (const animation of document.getAnimations()) {
        const starts = window.__captureAnimations;
        if (!starts.has(animation)) {
          starts.set(animation, time);
          animation.pause();
        }
        animation.currentTime = time - starts.get(animation);
      }
    }, time);
    const pixels = await page.screenshot({ type: "png", scale: "device" });
    assert.equal(pixels.readUInt32BE(16), 3840);
    assert.equal(pixels.readUInt32BE(20), 2160);
    if (!encoder.stdin.write(pixels)) await once(encoder.stdin, "drain");
    if (checkpoints.has(frame)) {
      const label = checkpoints.get(frame);
      await writeFile(resolve(output, `${label}.png`), pixels);
      const sample = await page.evaluate(() => ({
        page: document.querySelector('[data-testid="app"]').dataset.page,
        scene: document.querySelector('[data-testid="app"]').dataset.scene,
        playing: document.querySelector('[data-testid="app"]').dataset.playing,
        theme: document.documentElement.dataset.theme,
        caption: document.querySelector(".demo-caption").textContent,
        kpis: ["impacted", "reroutable", "risk"].map((id) =>
          document.querySelector(`[data-testid="kpi-${id}"]`)?.textContent ?? null),
        evidence: document.querySelector('[data-testid="evidence-verdict"]')?.textContent,
        plan: document.querySelector('[data-testid="plan-preview"]')?.textContent,
        ontologyNodes: document.querySelectorAll(".foundation-end .ontology-node").length,
        demoVisible: !!document.querySelector(".demo-badge")?.checkVisibility(),
        controlsHidden: !document.querySelector(".demo-dock"),
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      }));
      assert.equal(sample.theme, "light");
      assert.equal(sample.playing, "true");
      assert.equal(sample.demoVisible, true);
      assert.equal(sample.controlsHidden, true);
      assert.deepEqual(sample.scroll, [1920, 1080]);
      if ([375, 450, 600].includes(frame)) assert.deepEqual(sample.kpis, ["38건", "26건", "12건"]);
      if (frame === 450) assert.match(sample.evidence, /가용 26개 중 이 주문 1개 배정 가능/);
      if (frame === 600) assert.match(sample.plan, /26건 대체 출고 제안/);
      if (frame === 855) assert.equal(sample.ontologyNodes, 6);
      samples.push({ frame, seconds: time / 1000, ...sample });
    }
    if (frame % 90 === 0) console.log(`Captured ${frame}/${duration * fps} frames (${(time / 1000).toFixed(1)}s)`);
  }
  await page.clock.runFor(100);
  assert.equal(await page.getByTestId("app").getAttribute("data-playing"), "false");
  assert.equal(await page.getByTestId("app").getAttribute("data-page"), "end");
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  encoder.stdin.end();
  const [code] = await encoding;
  assert.equal(code, 0, "Video encoding failed");
  const share = resolve(output, "AsterGraph-Light-1080p.mp4");
  const downsample = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "warning", "-y", "-i", master,
    "-vf", "scale=1920:1080:flags=lanczos", "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", "17",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", share,
  ], { stdio: ["ignore", "ignore", "inherit"] });
  const [shareCode] = await once(downsample, "close");
  assert.equal(shareCode, 0, "Full HD encoding failed");
  await writeFile(resolve(output, "capture-report.json"), JSON.stringify({
    master, share, viewport: [1920, 1080], output: [3840, 2160], fps,
    frames: duration * fps, duration, audio: false,
    capture: "Actual Chrome render; frame-stepped application clock and CSS animations",
    errors, externalRequests: external, samples,
  }, null, 2));
  console.log(`Finished: ${master}`);
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill("SIGTERM");
  await browser.close();
}
