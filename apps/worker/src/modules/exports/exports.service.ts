import { Injectable } from "@nestjs/common";

@Injectable()
export class ExportsService {
  describeStage() {
    return {
      stage: "exports",
      mode: "stub",
      formats: ["csv"]
    } as const;
  }
}
