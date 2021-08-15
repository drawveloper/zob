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
const INDEX_PATH = "./public/index.html";

async function checkOrReadIndex() {
  const indexExists = await exists(INDEX_PATH);
  if (!indexExists) {
    console.log(
      "Please create a public/index.html file. You can choose any from the templates folder.",
    );
    Deno.exit(1);
  }
  const indexFile = await Deno.readTextFile(INDEX_PATH);
  return indexFile;
}

function extractLayout(indexContent: string) {
  return ["header", "footer"];
}

function buildPostWithLayout(indexContent: string) {
  const [header, footer] = extractLayout(indexContent);
  return async (postFilePath: string) => {
    const postFileContent = await Deno.readTextFile(postFilePath);
    const parsed = await parseFrontmatter(postFileContent) as Record<
      string,
      string
    >;
    console.log("parsed", parsed);
    const postContent = parseMarkdown(parsed.content);
    const postWithLayout = `${header}${postContent}${footer}`;

    console.log(`📖 ${postFilePath}`);
    const postBasename = basename(postFilePath);
    console.log("postBasename:", postBasename);
    const postIndexPath = postFilePath
      .replace(postBasename, "index.html")
      .replace("posts/", "public/");
    await ensureDir(dirname(postIndexPath));
    await Deno.writeTextFile(postIndexPath, postWithLayout);

    console.log(`🔨 ${postIndexPath}`);
    return parsed;
  };
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

async function parallelBuildPosts(indexContent: string, postList: string[]) {
  const buildPost = buildPostWithLayout(indexContent);
  const allPosts = postList.map((p) => limit(buildPost, p));
  await Promise.all(allPosts);
  console.log(`✅ All posts built successfully`);
}

function updateListOnIndex(indexContent: string, postList: string[]) {
  console.log(`✅ Index updated successfully`);
}

export async function build() {
  const indexContent = await checkOrReadIndex();
  const postList = await findAllPosts();
  console.debug(postList);
  await parallelBuildPosts(indexContent, postList);
  await updateListOnIndex(indexContent, postList);
}
