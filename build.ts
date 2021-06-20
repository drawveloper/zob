import { indexFilePath, indexHtmlFileContent } from "./index.html.ts";
import { ensureDir, exists } from "https://deno.land/std@0.99.0/fs/mod.ts";
import { pLimit } from "https://deno.land/x/p_limit@v1.0.0/mod.ts";
import {
  basename,
  dirname,
  posix,
} from "https://deno.land/std@0.99.0/path/mod.ts";
import { parseMarkdown } from "https://deno.land/x/markdown_wasm@1.1.3/mod.ts";
import { parseFrontmatter } from "https://raw.githubusercontent.com/lumeland/lume/4a3e3877da4cea5f031234b10f541bded752824c/loaders/yaml.js";

// Turns out it's hard to get this in Deno.
const limit = pLimit(8);

async function checkOrCreateIndex() {
  const indexExists = await exists(indexFilePath);
  if (!indexExists) {
    console.log("Creating default index.html");
    await Deno.writeTextFile(indexFilePath, indexHtmlFileContent);
    console.log(`🔨 ${indexFilePath}`);
  }
}

async function buildPost(postFilePath: string) {
  const postFileContent = await Deno.readTextFile(postFilePath);
  const parsed = await parseFrontmatter(postFileContent) as Record<
    string,
    string
  >;
  console.log("parsed", parsed);
  const postContent = parseMarkdown(parsed.content);
  console.log(`📖 ${postFilePath}`);
  const postBasename = basename(postFilePath);
  console.log("postBasename:", postBasename);
  const postIndexPath = postFilePath
    .replace(postBasename, "index.html")
    .replace("posts/", "public/");
  await ensureDir(dirname(postIndexPath));
  await Deno.writeTextFile(postIndexPath, postContent);
  console.log(`🔨 ${postIndexPath}`);
  return parsed;
}

async function findAllPosts(): Promise<string[]> {
  const posts: string[] = [];
  for await (const dirEntry of Deno.readDir(posix.resolve("posts/"))) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".md")) {
      posts.push(posix.resolve("posts/", dirEntry.name));
    }
    if (dirEntry.isDirectory) {
      const sameNameInMd = `${dirEntry.name}/${dirEntry.name}.md`;
      if (exists(sameNameInMd)) {
        posts.push(
          posix.resolve("posts/", `${dirEntry.name}/${dirEntry.name}.md`),
        );
      }
    }
  }
  return posts;
}

async function parallelBuildPosts() {
  const postList = await findAllPosts();
  console.debug(postList);
  const allPosts = postList.map((p) => limit(buildPost, p));
  await Promise.all(allPosts);
  console.log(`✅ All posts built successfully`);
  // Update index <main/>
  console.log(`✅ Index updated successfully`);
}

export async function build() {
  await checkOrCreateIndex();
  await parallelBuildPosts();
}
