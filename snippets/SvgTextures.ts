
class SvgTexture {
    static Create(name: string, svg: string) {
        const texture = BABYLON.Texture.LoadFromDataString(name, 'data:image/svg+xml;base64,' + window.btoa(svg), BABYLON.Engine.LastCreatedScene!)
        texture.onLoadObservable.addOnce(() => {
            texture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE)
        })
        return texture
    }
}
