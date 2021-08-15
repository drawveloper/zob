import { cac } from "https://unpkg.com/cac/mod.ts";
import { build } from "./build.ts";
import { live } from "./live.ts";

function main(): void {
  const cli = cac("zob");

  cli
    .command("build", "Build all posts/*.md into a blog in the public/ folder")
    .action(build);

  cli
    .command("live", "Reload changes automatically and serve locally")
    .action(live);

  cli.parse();
}

if (import.meta.main) {
  main();
}
