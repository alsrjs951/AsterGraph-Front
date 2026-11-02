// Frame-step the real recording UI so rendering speed cannot change the story.
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { once } from "node:events";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
const output = resolve(
  process.env.DEMO_OUTPUT ?? "artifacts/videos/batch-review",
);
await mkdir(output, { recursive: true });
const temp = await mkdtemp(join(output, ".capture-"));
const name = (size) => "AsterGraph-Batch-" + size + ".mp4";
const master = join(temp, name("4K"));
const browser = await chromium.launch({ channel: "chrome" });
let encoder;
try {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  await page.addInitScript(() =>
    localStorage.setItem("astergraph-theme", "light"),
  );
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.DEMO_URL ?? "http://127.0.0.1:4173");
  await page.evaluate(() => document.fonts.ready);
  await page
    .getByRole("button", { name: "장면 1: 지식 구축", exact: true })
    .click();
  await page.getByRole("button", { name: "녹화 모드", exact: true }).click();
  await page.mouse.move(0, 0);
  const epoch = new Date("2026-11-02T08:00:00+09:00");
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(new Date(epoch.getTime() + 1000));
  await page.keyboard.press("r");
  await page.evaluate(() => {
    window.captureChanged = true;
    new MutationObserver(() => (window.captureChanged = true)).observe(
      document.querySelector(".kg"),
      { subtree: true, childList: true, characterData: true, attributes: true },
    );
  });
  encoder = spawn(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      "30",
      "-vcodec",
      "png",
      "-i",
      "pipe:0",
      "-an",
      "-vf",
      "scale=in_range=full:out_range=tv:out_color_matrix=bt709",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-colorspace",
      "bt709",
      "-color_trc",
      "bt709",
      "-color_primaries",
      "bt709",
      "-movflags",
      "+faststart",
      master,
    ],
    { stdio: ["pipe", "ignore", "inherit"] },
  );
  const encoding = once(encoder, "close");
  let pixels,
    previous = 0;
  for (let frame = 0; frame < 1800; frame++) {
    const time = Math.round((frame * 1000) / 30);
    if (frame) await page.clock.runFor(time - previous);
    previous = time;
    const dirty = await page.evaluate(() => {
      const signature = document.querySelector(".kg-form input")?.value;
      const changed =
        window.captureChanged ||
        window.lastInput !== signature ||
        document.getAnimations().some((a) => a.playState === "running");
      window.captureChanged = false;
      window.lastInput = signature;
      return changed;
    });
    if (dirty || !pixels) {
      pixels = await page.screenshot();
      assert.equal(pixels.readUInt32BE(16), 3840);
    }
    if (!encoder.stdin.write(pixels)) await once(encoder.stdin, "drain");
    if ([0, 450, 750, 1350, 1799].includes(frame)) {
      assert.equal(
        await page.locator(".kg").getAttribute("data-scene"),
        String(frame < 450 ? 0 : frame < 750 ? 1 : frame < 1350 ? 2 : 3),
      );
      console.log("Captured frame", frame);
    }
  }
  await page.clock.runFor(100);
  assert.equal(await page.locator(".kg").getAttribute("data-playing"), "false");
  assert.match(
    await page.locator(".kg-next").innerText(),
    /재고 확인 후 행사 물량 조정/,
  );
  assert.deepEqual(errors, []);
  encoder.stdin.end();
  assert.equal((await encoding)[0], 0);
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    master,
    "-vf",
    "scale=1920:1080:flags=lanczos",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "17",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    join(temp, name("1080p")),
  ]);
  for (const [size, width, height] of [
    ["1080p", 1920, 1080],
    ["4K", 3840, 2160],
  ]) {
    const file = join(temp, name(size));
    const info = JSON.parse(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        file,
      ]),
    );
    const [stream] = info.streams;
    assert.equal(info.streams.length, 1);
    assert.deepEqual(
      [
        stream.codec_name,
        stream.width,
        stream.height,
        stream.nb_frames,
        stream.avg_frame_rate,
        Number(info.format.duration),
      ],
      ["h264", width, height, "1800", "30/1", 60],
    );
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-xerror",
      "-i",
      file,
      "-f",
      "null",
      "-",
    ]);
  }
  for (const size of ["1080p", "4K"])
    await rename(join(temp, name(size)), join(output, name(size)));
  console.log("Verified both films:", output);
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill();
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
