import { readFile } from "fs/promises";
import path from "path";
import { createWorker } from "tesseract.js";

async function recognize(file: Buffer | string) {
  const worker = createWorker({
    logger: console.log,
  });

  await worker.load();
  await worker.loadLanguage("eng+chi_tra");
  await worker.initialize("eng+chi_tra");

  const result = await worker.recognize(file);

  await worker.terminate();

  return result;
}

function transform(char: string) {
  if (char === "﹣") return "-";
  if (char === "﹕") return ":";

  return char;
}

function processChinese(text: string) {
  return Array.from(text).map(transform).join("").replace(/\s/g, "");
}

function processEnglish(text: string) {
  return Array.from(text).map(transform).join("").trim();
}

async function main() {
  const filepath = path.resolve(__dirname, "../image.png");
  const file = await readFile(filepath);

  const {
    data: { lines },
  } = await recognize(file);

  lines
    .map(({ text }) => text)
    .map((text) => text.replace(/[，,].*/g, ""))
    .map((text) => /(.*)[\(﹙](.*)[\)﹚]/g.exec(text))
    .map(
      (result) =>
        result && [
          processChinese(result[1]),
          processEnglish(result[2]),
          //
        ]
    )
    .filter(Boolean)
    .forEach((text) => console.log(text));
}

main();
