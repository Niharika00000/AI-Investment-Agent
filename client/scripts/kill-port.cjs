// Kills any process listening on the Next.js dev port before startup.
// Runs automatically via the "predev" npm lifecycle hook.
const { execSync } = require("child_process");

const PORT = process.env.PORT || 3000;

try {
  const out = execSync("netstat -ano", { encoding: "utf8" });

  for (const line of out.split("\n")) {
    if (line.includes(`:${PORT}`) && line.includes("LISTENING")) {
      const pid = line.trim().split(/\s+/).pop();

      if (pid && /^\d+$/.test(pid)) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`[predev] Killed PID ${pid} holding port ${PORT}`);
        } catch {
          // Process already exited.
        }
      }
    }
  }
} catch {
  // netstat failed or port not in use; continue startup.
}
