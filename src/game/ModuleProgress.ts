export type ModuleId = "anatomi-struktur" | "simulator-stabilitas" | "hasil-umpan-balik";

const STORAGE_KEY = "archimedes_shiplab_unlocked_modules";
const MODULE_ORDER: ModuleId[] = [
    "anatomi-struktur",
    "simulator-stabilitas",
    "hasil-umpan-balik",
];

function getDefaultUnlockedModules(): ModuleId[] {
    return ["anatomi-struktur"];
}

function isBrowser() {
    return typeof window !== "undefined";
}

function parseUnlockedModules(raw: string | null): ModuleId[] {
    if (!raw) {
        return getDefaultUnlockedModules();
    }

    const unlocked = new Set<ModuleId>(getDefaultUnlockedModules());
    raw.split(",")
        .map((value) => value.trim())
        .forEach((value) => {
            if (MODULE_ORDER.includes(value as ModuleId)) {
                unlocked.add(value as ModuleId);
            }
        });

    return MODULE_ORDER.filter((moduleId) => unlocked.has(moduleId));
}

function serializeUnlockedModules(modules: ModuleId[]) {
    return MODULE_ORDER.filter((moduleId) => modules.includes(moduleId)).join(",");
}

function readStorageValue(key: string) {
    if (!isBrowser()) {
        return null;
    }

    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorageValue(key: string, value: string) {
    if (!isBrowser()) {
        return;
    }

    try {
        window.localStorage.setItem(key, value);
    } catch {
        // localStorage unavailable (e.g. disabled by user); progress won't persist.
    }
}

export function getUnlockedModules(): ModuleId[] {
    const modules = parseUnlockedModules(readStorageValue(STORAGE_KEY));
    writeStorageValue(STORAGE_KEY, serializeUnlockedModules(modules));
    return modules;
}

export function isModuleUnlocked(moduleId: ModuleId) {
    return getUnlockedModules().includes(moduleId);
}

export function unlockModule(moduleId: ModuleId) {
    const unlocked = new Set<ModuleId>(getUnlockedModules());
    unlocked.add(moduleId);
    const normalized = MODULE_ORDER.filter((id) => unlocked.has(id));
    writeStorageValue(STORAGE_KEY, serializeUnlockedModules(normalized));
}

export function unlockNextModuleAfter(moduleId: ModuleId) {
    const currentIndex = MODULE_ORDER.indexOf(moduleId);
    if (currentIndex === -1) {
        return;
    }

    const nextModule = MODULE_ORDER[currentIndex + 1];
    if (nextModule) {
        unlockModule(nextModule);
    }
}

export function resetModuleProgress() {
    writeStorageValue(STORAGE_KEY, serializeUnlockedModules(getDefaultUnlockedModules()));
}

/** True for the last module in the unlock chain — completing it means
 * every module has now been finished. */
export function isFinalModule(moduleId: ModuleId) {
    return MODULE_ORDER[MODULE_ORDER.length - 1] === moduleId;
}
