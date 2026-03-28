import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";

import { workerEnv } from "../../config/worker-env";

@Injectable()
export class IngestionService implements OnModuleDestroy {
  private readonly logger = new Logger(IngestionService.name);
  private pollTimer?: NodeJS.Timeout;

  startWatching() {
    if (this.pollTimer) {
      return;
    }

    // Uploads and watched folders should converge on the same processing command shape.
    this.pollTimer = setInterval(() => {
      this.logger.debug(`watched-folder poll tick against ${workerEnv.WATCH_ROOT}`);
    }, workerEnv.WORKER_POLL_INTERVAL_MS);
  }

  describeStage() {
    return {
      stage: "ingestion",
      mode: "stub",
      watchRoot: workerEnv.WATCH_ROOT
    } as const;
  }

  onModuleDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
}
