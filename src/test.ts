import * as StaticSoundTests from "./tests/staticSound";
import * as StreamingSoundTests from "./tests/streamingSound";
import { beforeAllTests, afterAllTests } from "./testUtils";

(async () => {
    await beforeAllTests();

    // await StaticSoundTests.run();
    await StreamingSoundTests.run();

    await afterAllTests();
})();
