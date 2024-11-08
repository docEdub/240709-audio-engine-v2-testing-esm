import * as StaticSoundTests from "./tests/staticSound";
import * as StreamingSoundTests from "./tests/streamingSound";
import { afterAllTests, afterEachGroup, beforeAllTests, beforeEachGroup } from "./testUtils";

// prettier-ignore
const groups = [
    StaticSoundTests,
    StreamingSoundTests
];

(async () => {
    await beforeAllTests();

    for (const group of groups) {
        beforeEachGroup();

        await group.run();

        afterEachGroup();
    }

    await afterAllTests();
})();
