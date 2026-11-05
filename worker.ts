// Ponto de entrada do Worker: app Next (OpenNext) + tarefas agendadas.
import type {
  ExecutionContext,
  ScheduledController,
} from "@cloudflare/workers-types";
// .open-next/worker.js só existe depois do build: ts-ignore (expect-error falharia após o build)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore gerado no build (`opennextjs-cloudflare build`)
import { default as handler } from "./.open-next/worker.js";
import { executarCron, type CronEnv } from "./src/server/cron";

export default {
  fetch: handler.fetch,
  async scheduled(
    controller: ScheduledController,
    env: CronEnv,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(executarCron(controller.cron, env));
  },
};
