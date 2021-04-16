class ModuleClass {
  locateFile(baseName: string): string

  instantiateWasm(imports: Object, callback: () => void) : undefined

  onInit(cb: () => void): void

  onRuntimeInitialized(): void
}
declare var Module: ModuleClass
