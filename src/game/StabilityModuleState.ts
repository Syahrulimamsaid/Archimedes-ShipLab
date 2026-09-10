// In-memory progress tracking for the Materi/Pilih Aktivitas/Kuis/Simulator
// flow, shared across those scenes for the lifetime of the page (module-level
// singleton, same pattern as BadgeState.ts). Resets on a full reload — no
// save/localStorage layer yet, intentionally session-only.
export interface StabilityModuleProgress {
    materialCompleted: boolean;
    quizCompleted: boolean;
    quizScore: number;
    quizCorrectAnswers: number;
    quizAnswerResults: boolean[];
    simulatorCompleted: boolean;
    simulatorCasesCompleted: number;
}

const progress: StabilityModuleProgress = {
    materialCompleted: false,
    quizCompleted: false,
    quizScore: 0,
    quizCorrectAnswers: 0,
    quizAnswerResults: [],
    simulatorCompleted: false,
    simulatorCasesCompleted: 0,
};

export function getStabilityModuleProgress(): StabilityModuleProgress {
    return progress;
}

export function setMaterialCompleted() {
    progress.materialCompleted = true;
}

export function setQuizResult(correctAnswers: number, answerResults: boolean[]) {
    progress.quizCompleted = true;
    progress.quizCorrectAnswers = correctAnswers;
    progress.quizScore = correctAnswers * 20;
    progress.quizAnswerResults = answerResults;
}

export function setSimulatorProgress(casesCompleted: number) {
    progress.simulatorCasesCompleted = casesCompleted;
    if (casesCompleted >= 3) {
        progress.simulatorCompleted = true;
    }
}
