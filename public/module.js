class ModuleClass {

  locateFile(baseName, _) {
    return `build/${baseName}`;
  }

  instantiateWasm(imports, callback) {
    return new Promise(resolve => {
      instantiateCachedURL(this.locateFile('cv-wasm.wasm'), imports)
        .then(instance => {
          callback(instance)
          resolve()
        }).catch(e => console.error(e));
    })
  }

  onInit(cb) {
    this._initCb = cb;
  }

  onRuntimeInitialized() {
    if (this._initCb) {
      return this._initCb(this);
    }
  }
}

self.Module = new ModuleClass();
