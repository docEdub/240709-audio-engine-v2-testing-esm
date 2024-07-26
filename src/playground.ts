import { WebAudioEngine, Sound } from "@babylonjs/core/Audio/v2/logical";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Logger } from "@babylonjs/core/Misc/logger";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Materials/standardMaterial";

import { runMultichannelRnD } from "./r+d/multichannel";

class Playground {
    public static CreateScene(engine: Engine, canvas: HTMLCanvasElement): Scene {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new Scene(engine);

        // This creates and positions an arc-rotate camera (non-mesh)
        var camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape. Params: name, options, scene
        var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape. Params: name, options, scene
        var ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

        // Setup GUI.
        let canvasZone = document.getElementById("canvasZone")!;
        canvasZone.style.position = "relative";

        const oldGui = document.getElementById("datGui");
        if (oldGui) {
            canvasZone.removeChild(oldGui);
        }

        const gui = new dat.GUI({ autoPlace: false });
        canvasZone.appendChild(gui.domElement);
        gui.domElement.id = "datGui";
        gui.domElement.style.position = "absolute";
        gui.domElement.style.top = "0";
        gui.domElement.style.left = "0";

        const cameraGui = gui.addFolder("camera");
        cameraGui.add(camera, "alpha", -Math.PI, Math.PI, 0.01).listen();
        cameraGui.add(camera, "beta", 0.01, Math.PI - 0.01, 0.01).listen();
        cameraGui.add(camera, "radius", 5, 100, 0.01).listen();
        cameraGui.open();

        camera.onViewMatrixChangedObservable.add(() => {
            while (camera.alpha < -Math.PI) camera.alpha += 2 * Math.PI;
            while (Math.PI < camera.alpha) camera.alpha -= 2 * Math.PI;
            camera.radius = Math.min(Math.max(5, camera.radius), 100);
        });

        // const audioEngine = new WebAudioEngine();

        // const sound1 = new Sound("Sound 1", {
        //     sourceUrl: "https://amf-ms.github.io/AudioAssets/testing/mp3.mp3",
        //     priority: 1
        // });

        // const sound2 = new Sound("Sound 2", {
        //     sourceUrl: "https://amf-ms.github.io/AudioAssets/testing/ogg.ogg",
        //     priority: 2
        // });

        // const sound3 = new Sound("Sound 3",{
        //     sourceUrl: "https://amf-ms.github.io/AudioAssets/testing/ac3.ac3",
        //     priority: 3
        // });

        // const sound4 = new Sound("Sound 4", {
        //     sourceUrl: "https://amf-ms.github.io/AudioAssets/testing/3-count.mp3",
        //     priority: 4
        // });

        // sound1.play();
        // sound2.play();
        // sound3.play();
        // sound4.play();

        // audioEngine.update();

        // setTimeout(() => {
        //     sound4.stop();
        //     audioEngine.update();
        // }, 100);

        runMultichannelRnD();

        return scene;
    }
}

declare var dat: any;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
