import { cac } from "https://unpkg.com/cac/mod.ts";

function zob(): void {
  const cli = cac("zob");
  
  cli.option("--type <type>", "Choose a project type", {
    default: "deno",
  });

  const parsed = cli.parse();
  console.log(JSON.stringify(parsed, null, 2));
}

if (import.meta.main) {
  zob();
}
