import { Playground } from "./playground";
import { Engine } from "@babylonjs/core/Engines/engine";

(() => {
    const canvas = <HTMLCanvasElement> document.getElementById("renderCanvas");
    const engine = new Engine(canvas, true);
    const scene = Playground.CreateScene(engine, canvas);

    window.addEventListener('resize', () => {
        engine.resize();
    });

    engine.runRenderLoop(() => {
       scene.render(true);
    });
})();
