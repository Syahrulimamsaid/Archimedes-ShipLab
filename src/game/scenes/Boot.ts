import { Scene } from "phaser";

export class Boot extends Scene {
    constructor() {
        super("Boot");
    }

    preload() {
        this.load.image("background", "assets/bg.png");
        this.load.image("logo", "assets/logo.png");
        this.load.image("profile.human", "assets/profile.png");
        this.load.image("btn.touch", "assets/btn_touch.png");
        
        this.load.image("background.home", "assets/home/bg.png");
        this.load.image(
            "home.card.anatomi",
            "assets/home/card-anatomi-struktur.png",
        );
        this.load.image(
            "home.card.stabilitas",
            "assets/home/card-simulator-stablitas.png",
        );
        this.load.image("home.card.profile", "assets/home/card_profile.png");
        this.load.image("home.bar.info", "assets/home/bar_info.png");
        this.load.image("home.btn.panduan", "assets/home/btn_panduan.png");
        this.load.image("home.btn.tentang", "assets/home/btn_tentang.png");
        this.load.image("home.btn.settings", "assets/home/btn_settings.png");
        this.load.image(
            "home.btn.achievements",
            "assets/home/btn_achievements.png",
        );
        this.load.image("home.btn.power", "assets/home/btn_power.png");
        this.load.image("home.btn.mulai", "assets/home/btn-mulai_modul.png");
        this.load.image("home.btn.exit", "assets/home/btn_exit.png");
    }

    create() {
        this.scene.start("Preloader");
    }
}
