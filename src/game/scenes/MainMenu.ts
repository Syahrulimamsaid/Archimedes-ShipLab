import { GameObjects, Scale, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    private background!: GameObjects.Image;
    private topBar!: GameObjects.Rectangle;
    private logo!: GameObjects.Image;
    private welcomeTitle!: GameObjects.Text;
    private welcomeSubtitle!: GameObjects.Text;

    private anatomiCard!: GameObjects.Image;
    private stabilitasCard!: GameObjects.Image;
    private leftInfoPanel!: GameObjects.Container;
    private rightInfoPanel!: GameObjects.Container;

    private profilePanel!: GameObjects.Container;
    private profileArea!: GameObjects.Arc;
    private profileAvatar!: GameObjects.Text;
    private scoreCard!: GameObjects.Container;
    private scoreRing!: GameObjects.Graphics;
    private scoreTitle!: GameObjects.Text;
    private scoreText!: GameObjects.Text;
    private scoreSubText!: GameObjects.Text;
    private badgePanel!: GameObjects.Container;
    private bottomInfoBar!: GameObjects.Image;

    private topButtons: GameObjects.Container[] = [];
    private bottomButtons: GameObjects.Container[] = [];
    private hasPlayedIntro = false;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(0, 0, 'background.home');
        this.topBar = this.add.rectangle(0, 0, 100, 100, 0x0d4fa3, 0.92).setOrigin(0);
        this.logo = this.add.image(0, 0, 'logo').setOrigin(0, 0.5).setDepth(20);

        this.welcomeTitle = this.add.text(0, 0, 'Selamat Datang, Taruna!', {
            fontFamily: 'Arial Black',
            fontSize: 34,
            color: '#143a84'
        }).setOrigin(0.5);

        this.welcomeSubtitle = this.add.text(0, 0, 'Pilih modul untuk memulai pembelajaran interaktifmu.', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#244f89'
        }).setOrigin(0.5);

        this.anatomiCard = this.add.image(0, 0, 'home.card.anatomi').setInteractive({ useHandCursor: true });
        this.stabilitasCard = this.add.image(0, 0, 'home.card.stabilitas').setInteractive({ useHandCursor: true });
        this.anatomiCard.on('pointerdown', () => this.changeScene());
        this.stabilitasCard.on('pointerdown', () => this.changeScene());

        this.leftInfoPanel = this.createInfoPanel(
            'DESKRIPSI MODUL',
            'Kompetensi Dasar:\nMemahami bagian utama kapal niaga, dimensi pokok, bentuk profil, dasar bangun kapal, kulit kapal, sekat, dan pintu kedap air.',
            'Prasyarat:\nTidak ada',
            'Waktu: ± 45 menit\nLevel: Dasar',
            0x2f68d8
        );

        this.rightInfoPanel = this.createInfoPanel(
            'DESKRIPSI MODUL',
            'Kompetensi Dasar:\nMenghitung dan menganalisis stabilitas kapal meliputi efek pemuatan, pergeseran beban, titik GM, dan momen penegak.',
            'Prasyarat:\nTidak ada',
            'Waktu: ± 60 menit\nLevel: Menengah',
            0x4aa96c
        );

        this.leftInfoPanel.setVisible(false);
        this.rightInfoPanel.setVisible(false);

        this.anatomiCard.on('pointerover', () => {
            this.leftInfoPanel.setVisible(true);
        });
        this.anatomiCard.on('pointerout', () => {
            this.leftInfoPanel.setVisible(false);
        });

        this.stabilitasCard.on('pointerover', () => {
            this.rightInfoPanel.setVisible(true);
        });
        this.stabilitasCard.on('pointerout', () => {
            this.rightInfoPanel.setVisible(false);
        });

        const profile = this.createProfilePanel();
        this.profilePanel = profile.panel;
        this.profileArea = profile.profileArea;
        this.profileAvatar = profile.avatar;

        const score = this.createScoreCard();
        this.scoreCard = score.panel;
        this.scoreTitle = score.title;
        this.scoreText = score.scoreText;
        this.scoreSubText = score.scoreSubText;
        this.scoreRing = score.ring;

        this.badgePanel = this.createBadgePanel();
        this.bottomInfoBar = this.add.image(0, 0, 'home.bar.info');

        this.topButtons = [
            this.createImageButton('home.btn.settings'),
            this.createImageButton('home.btn.achievements'),
            this.createImageButton('home.btn.power')
        ];

        this.bottomButtons = [
            this.createImageButton('home.btn.panduan'),
            this.createImageButton('home.btn.tentang')
        ];

        this.layout(this.scale.width, this.scale.height);
        this.scale.on(Scale.Events.RESIZE, this.handleResize, this);

        this.playIntroAnimation();

        EventBus.emit('current-scene-ready', this);

        this.events.once('shutdown', () => {
            this.scale.off(Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    changeScene ()
    {
        this.scene.start('Game');
    }

    moveLogo (callback: ({ x, y }: { x: number, y: number }) => void)
    {
        if (callback)
        {
            callback({
                x: Math.floor(this.logo.x),
                y: Math.floor(this.logo.y)
            });
        }
    }

    private createInfoPanel (title: string, desc: string, requirement: string, meta: string, accentColor: number)
    {
        const panel = this.add.container(0, 0);
        const bg = this.add.rectangle(0, 0, 248, 208, 0xffffff, 0.96)
            .setStrokeStyle(3, accentColor, 0.95)
            .setOrigin(0.5)
            .setDepth(15);

        const titleText = this.add.text(-100, -76, title, {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: `#${accentColor.toString(16).padStart(6, '0')}`
        }).setOrigin(0, 0.5).setDepth(16);

        const descText = this.add.text(-100, -48, desc, {
            fontFamily: 'Arial',
            fontSize: 11,
            color: '#28466d',
            wordWrap: { width: 195 },
            lineSpacing: 4
        }).setDepth(16);

        const reqText = this.add.text(-100, 42, requirement, {
            fontFamily: 'Arial',
            fontSize: 11,
            color: '#28466d',
            wordWrap: { width: 195 },
            lineSpacing: 4
        }).setDepth(16);

        const metaText = this.add.text(-100, 90, meta, {
            fontFamily: 'Arial Bold',
            fontSize: 11,
            color: '#143a84',
            lineSpacing: 8
        }).setDepth(16);

        panel.add([bg, titleText, descText, reqText, metaText]);

        return panel;
    }

    private createProfilePanel ()
    {
        const panel = this.add.container(0, 0);
        const bg = this.add.rectangle(0, 0, 280, 378, 0xf8fbff, 0.96)
            .setStrokeStyle(3, 0xb8d4f4, 1)
            .setOrigin(0.5);

        const title = this.add.text(-104, -154, 'PROFIL TARUNA', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#1d4b97'
        }).setOrigin(0, 0.5);

        const profileArea = this.add.circle(0, -76, 58, 0xe8f2ff, 1)
            .setStrokeStyle(3, 0xb8d4f4, 1);

        const avatar = this.add.text(0, -76, 'Foto', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#84a2ca'
        }).setOrigin(0.5);

        const name = this.add.text(0, 12, 'Raka Samudra', {
            fontFamily: 'Arial Black',
            fontSize: 22,
            color: '#1d4b97'
        }).setOrigin(0.5);

        const major = this.add.text(0, 42, 'Cadet Nautika', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#2b5ca8'
        }).setOrigin(0.5);

        const idBg = this.add.rectangle(0, 78, 180, 34, 0xe6f0ff, 1)
            .setStrokeStyle(2, 0xc7daf7, 1)
            .setOrigin(0.5);

        const idText = this.add.text(0, 78, 'NTP. 123456789012', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#1d4b97'
        }).setOrigin(0.5);

        panel.add([bg, title, profileArea, avatar, name, major, idBg, idText]);

        return { panel, profileArea, avatar };
    }

    private createScoreCard ()
    {
        const panel = this.add.container(0, 0);
        const bg = this.add.rectangle(0, 0, 280, 186, 0xf8fbff, 0.96)
            .setStrokeStyle(3, 0xb8d4f4, 1)
            .setOrigin(0.5);

        const title = this.add.text(-102, -58, 'GREEN SCORE', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#1f8d52'
        }).setOrigin(0, 0.5);

        const ring = this.add.graphics();
        const scoreText = this.add.text(0, 6, '78', {
            fontFamily: 'Arial Black',
            fontSize: 34,
            color: '#1f8d52'
        }).setOrigin(0.5);

        const scoreSubText = this.add.text(0, 34, '/100', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#1f8d52'
        }).setOrigin(0.5);

        panel.add([bg, title, ring, scoreText, scoreSubText]);

        return { panel, title, ring, scoreText, scoreSubText };
    }

    private createBadgePanel ()
    {
        const panel = this.add.container(0, 0);
        const bg = this.add.rectangle(0, 0, 330, 106, 0xf6fbff, 0.95)
            .setStrokeStyle(3, 0xb8d4f4, 1)
            .setOrigin(0.5);

        const title = this.add.text(-138, -34, 'KOLEKSI LENCANA', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#1d4b97'
        }).setOrigin(0, 0.5);

        panel.add([bg, title]);

        const colors = [0xcc7a1d, 0xb5becb, 0xd39d1f, 0xdfe8f2, 0xdfe8f2];
        const labels = ['⚙', '▣', '⚖', '🔒', '🔒'];

        colors.forEach((color, index) => {
            const x = -112 + (index * 56);
            const badge = this.add.circle(x, 16, 22, color, 1).setStrokeStyle(3, 0x8ea9c5, 0.9);
            const text = this.add.text(x, 16, labels[index], {
                fontFamily: 'Arial Black',
                fontSize: 22,
                color: index >= 3 ? '#91a4bc' : '#ffffff'
            }).setOrigin(0.5);
            panel.add([badge, text]);
        });

        return panel;
    }

    private createImageButton (texture: string)
    {
        const container = this.add.container(0, 0);
        const image = this.add.image(0, 0, texture).setOrigin(0.5);
        container.add(image);
        container.setSize(image.width, image.height);
        return container;
    }

    private handleResize (gameSize: Phaser.Structs.Size)
    {
        this.layout(gameSize.width, gameSize.height);
    }

    private playIntroAnimation ()
    {
        if (this.hasPlayedIntro)
        {
            return;
        }

        this.hasPlayedIntro = true;

        const animatedItems: Array<GameObjects.GameObject & { alpha: number, y: number, scaleX: number, scaleY: number }> = [
            this.logo,
            this.welcomeTitle,
            this.welcomeSubtitle,
            this.anatomiCard,
            this.stabilitasCard,
            this.profilePanel,
            this.scoreCard,
            this.badgePanel
        ];

        animatedItems.forEach((item, index) => {
            item.alpha = 0;
            item.y += 18;
            item.scaleX *= 0.96;
            item.scaleY *= 0.96;

            this.tweens.add({
                targets: item,
                alpha: 1,
                y: item.y - 18,
                scaleX: item.scaleX / 0.96,
                scaleY: item.scaleY / 0.96,
                duration: 500,
                delay: index * 80,
                ease: 'Back.Out'
            });
        });
    }

    private drawScoreRing (centerX: number, centerY: number, radius: number, value: number)
    {
        this.scoreRing.clear();
        this.scoreRing.lineStyle(12, 0xd9f0df, 1);
        this.scoreRing.beginPath();
        this.scoreRing.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.scoreRing.strokePath();

        this.scoreRing.lineStyle(12, 0x2aa658, 1);
        this.scoreRing.beginPath();
        this.scoreRing.arc(
            centerX,
            centerY,
            radius,
            (-90 * Math.PI) / 180,
            ((-90 + (360 * value)) * Math.PI) / 180
        );
        this.scoreRing.strokePath();
    }

    private layout (width: number, height: number)
    {
        const centerX = width / 2;
        const centerY = height / 2;
        const topPadding = Math.max(18, height * 0.022);
        const contentTop = topPadding + 92;
        const cardScale = Math.min(width / 1850, height / 1120, 0.82);
        const rightScale = Math.min(width / 1500, height / 960, 1);

        this.background.setPosition(centerX, centerY);
        this.background.setDisplaySize(width, height);

        this.topBar.setPosition(0, 0);
        this.topBar.setSize(width, Math.max(72, height * 0.115));

        this.logo.setPosition(42, this.topBar.height / 2 + 4);
        this.logo.setDisplaySize(300 * cardScale, 78 * cardScale);

        this.topButtons.forEach((button, index) => {
            button.setPosition(width - 58 - ((2 - index) * 58), this.topBar.height / 2 + 2);
            button.setScale(Math.min(cardScale, 1));
        });

        this.welcomeTitle.setPosition(width * 0.43, contentTop + 36);
        this.welcomeTitle.setFontSize(Math.max(22, 34 * cardScale));

        this.welcomeSubtitle.setPosition(width * 0.43, contentTop + 80);
        this.welcomeSubtitle.setFontSize(Math.max(14, 18 * cardScale));

        const cardY = centerY + 30;
        const cardWidth = 420 * cardScale;
        const cardHeight = 570 * cardScale;

        this.anatomiCard.setPosition(width * 0.315, cardY);
        this.anatomiCard.setDisplaySize(cardWidth, cardHeight);

        this.stabilitasCard.setPosition(width * 0.49, cardY);
        this.stabilitasCard.setDisplaySize(cardWidth, cardHeight);

        this.leftInfoPanel.setPosition(width * 0.12, cardY + 6);
        this.leftInfoPanel.setScale(Math.max(0.68, cardScale * 0.88));

        this.rightInfoPanel.setPosition(width * 0.62, cardY + 52);
        this.rightInfoPanel.setScale(Math.max(0.68, cardScale * 0.88));

        this.profilePanel.setPosition(width * 0.865, centerY - 76);
        this.profilePanel.setScale(Math.max(0.76, rightScale * 0.92));

        this.scoreCard.setPosition(width * 0.865, centerY + 146);
        this.scoreCard.setScale(Math.max(0.76, rightScale * 0.92));

        const scoreCenterX = this.scoreCard.x;
        const scoreCenterY = this.scoreCard.y + (18 * this.scoreCard.scaleY);
        this.drawScoreRing(scoreCenterX, scoreCenterY, 48 * rightScale * 0.92, 0.78);
        this.scoreTitle.setPosition(-102, -58);
        this.scoreText.setPosition(0, 8);
        this.scoreText.setFontSize(Math.max(24, 34 * rightScale));
        this.scoreSubText.setPosition(0, 34);
        this.scoreSubText.setFontSize(Math.max(13, 18 * rightScale));

        this.badgePanel.setPosition(width * 0.80, height - 112);
        this.badgePanel.setScale(Math.max(0.72, rightScale * 0.92));

        this.bottomInfoBar.setPosition(width * 0.47, height - 42);
        this.bottomInfoBar.setDisplaySize(Math.min(width * 0.42, 640), Math.max(52, height * 0.07));

        this.bottomButtons[0].setPosition(92, height - 48);
        this.bottomButtons[1].setPosition(width - 92, height - 48);

        this.bottomButtons.forEach((button) => {
            button.setScale(Math.max(0.82, cardScale * 0.92));
        });

        this.profileArea.setRadius(58);
        this.profileAvatar.setFontSize(20);
    }
}
