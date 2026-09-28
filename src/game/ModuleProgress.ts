export type ModuleId = "anatomi-struktur" | "simulator-stabilitas" | "hasil-umpan-balik";

const MODULE_ORDER: ModuleId[] = [
    "anatomi-struktur",
    "simulator-stabilitas",
    "hasil-umpan-balik",
];

function getDefaultUnlockedModules(): ModuleId[] {
    return ["anatomi-struktur"];
}

// Kept only in memory (module-level state), not persisted to localStorage/cookies:
// unlock progress must reset to the initial state on every page reload, and only
// advance while the user completes steps within the same session.
let unlockedModules: ModuleId[] = getDefaultUnlockedModules();

export function getUnlockedModules(): ModuleId[] {
    return MODULE_ORDER.filter((moduleId) => unlockedModules.includes(moduleId));
}

export function isModuleUnlocked(moduleId: ModuleId) {
    return getUnlockedModules().includes(moduleId);
}

export function unlockModule(moduleId: ModuleId) {
    const unlocked = new Set<ModuleId>(unlockedModules);
    unlocked.add(moduleId);
    unlockedModules = MODULE_ORDER.filter((id) => unlocked.has(id));
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
    unlockedModules = getDefaultUnlockedModules();
}

/** True for the last module in the unlock chain — completing it means
 * every module has now been finished. */
export function isFinalModule(moduleId: ModuleId) {
    return MODULE_ORDER[MODULE_ORDER.length - 1] === moduleId;
}
