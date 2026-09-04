import { Actions, GameObjects, Scene } from "phaser";

import { BadgeId, isBadgeUnlocked } from "../../BadgeState";

interface BadgeConfig {
    icon: string;
    color: number;
    locked?: boolean;
    /** When set, the badge's locked state is looked up from BadgeState
     * instead of the static `locked` flag, so it unlocks live once earned
     * (e.g. by passing the watertight-door quiz in AnatomiStruktur). */
    id?: BadgeId;
}

export class ProfileCard {
    // Shared width for the profile / score / badge panels so they line up as
    // one consistent vertical stack. To add or remove a badge, just edit the
    // `badges` list below — the panel lays them out automatically.
    readonly width = 320;
    private readonly profilePanelHeight = 342;
    // The profile panel's background isn't centered on the container origin
    // (see createProfilePanel), so layout() needs this offset to align its
    // top edge precisely with the other panels.
    private readonly profilePanelBgOffsetY = -17;
    private readonly scoreCardHeight = 210;
    private readonly badgePanelHeight = 170;

    private readonly badges: BadgeConfig[] = [
        { icon: "⚙", color: 0xcc7a1d },
        { icon: "▣", color: 0xb5becb },
        { icon: "⚖", color: 0xd39d1f },
        { icon: "🔍", color: 0x2f68d8, id: "ship-construction-surveyor" },
        { icon: "🔒", color: 0xdfe8f2, locked: true },
    ];

    private scene: Scene;
    private profilePanel: GameObjects.Container;
    private scoreCard: GameObjects.Container;
    private scoreRing: GameObjects.Graphics;
    private scoreTitle: GameObjects.Text;
    private scoreText: GameObjects.Text;
    private scoreSubText: GameObjects.Text;
    private badgePanel: GameObjects.Container;

    constructor(scene: Scene) {
        this.scene = scene;

        this.profilePanel = this.createProfilePanel();

        const score = this.createScoreCard();
        this.scoreCard = score.panel;
        this.scoreRing = score.ring;
        this.scoreTitle = score.title;
        this.scoreText = score.scoreText;
        this.scoreSubText = score.scoreSubText;

        this.badgePanel = this.createBadgePanel();
    }

    /** Total unscaled height of the profile + score + badge stack. */
    get totalHeight() {
        return this.profilePanelHeight + this.scoreCardHeight + this.badgePanelHeight;
    }

    /**
     * Positions the profile / score / badge panels as one vertical stack
     * starting at `bandTop`, each flush against the previous panel's bottom
     * edge, scaled uniformly by `scale`.
     */
    layout(centerX: number, bandTop: number, scale: number) {
        const profilePanelScale = Math.max(0.76, scale * 0.92);
        const profilePanelTopLocal =
            this.profilePanelBgOffsetY - this.profilePanelHeight / 2;
        this.profilePanel.setPosition(
            centerX,
            bandTop - profilePanelTopLocal * profilePanelScale,
        );
        this.profilePanel.setScale(profilePanelScale);

        const profilePanelBottomY =
            bandTop + this.profilePanelHeight * profilePanelScale;

        const scoreCardScale = Math.max(0.76, scale * 0.92);
        this.scoreCard.setPosition(
            centerX,
            profilePanelBottomY + (this.scoreCardHeight / 2) * scoreCardScale,
        );
        this.scoreCard.setScale(scoreCardScale);

        const scoreCenterX = this.scoreCard.x;
        const scoreCenterY = this.scoreCard.y + 18 * this.scoreCard.scaleY;
        this.drawScoreRing(scoreCenterX, scoreCenterY, 48 * scale * 0.92, 0.78);
        this.scoreTitle.setPosition(-this.width / 2 + 26, -66);
        this.scoreText.setPosition(0, 8);
        this.scoreText.setFontSize(Math.max(24, 36 * scale));
        this.scoreSubText.setPosition(0, 38);
        this.scoreSubText.setFontSize(Math.max(13, 19 * scale));

        // Badge panel sits flush against the score card's bottom edge (no gap).
        const scoreCardBottomY =
            this.scoreCard.y + (this.scoreCardHeight / 2) * scoreCardScale;
        const badgePanelScale = Math.max(0.72, scale * 0.92);
        this.badgePanel.setPosition(
            centerX,
            scoreCardBottomY + (this.badgePanelHeight / 2) * badgePanelScale,
        );
        this.badgePanel.setScale(badgePanelScale);
    }

    playIntroAnimation(baseDelay: number) {
        const items: Array<
            GameObjects.GameObject & {
                alpha: number;
                y: number;
                scaleX: number;
                scaleY: number;
            }
        > = [this.profilePanel, this.scoreCard, this.badgePanel];

        items.forEach((item, index) => {
            item.alpha = 0;
            item.y += 18;
            item.scaleX *= 0.96;
            item.scaleY *= 0.96;

            this.scene.tweens.add({
                targets: item,
                alpha: 1,
                y: item.y - 18,
                scaleX: item.scaleX / 0.96,
                scaleY: item.scaleY / 0.96,
                duration: 500,
                delay: baseDelay + index * 80,
                ease: "Back.Out",
            });
        });
    }

    private drawScoreRing(
        centerX: number,
        centerY: number,
        radius: number,
        value: number,
    ) {
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
            ((-90 + 360 * value) * Math.PI) / 180,
        );
        this.scoreRing.strokePath();
    }

    private createProfilePanel() {
        const width = this.width;
        const avatarRadius = 66;
        const titleY = -158;
        const avatarY = -50;
        const nameY = 46;
        const majorY = 78;
        const idY = 116;

        const panel = this.scene.add.container(0, 0);
        const bg = this.scene.add
            .rectangle(0, -17, width, this.profilePanelHeight, 0xf8fbff, 0.96)
            .setStrokeStyle(3, 0xb8d4f4, 1)
            .setOrigin(0.5);

        const title = this.scene.add
            .text(0, titleY, "PROFIL TARUNA", {
                fontFamily: "Arial Black",
                fontSize: 19,
                color: "#1d4b97",
            })
            .setOrigin(0.5);

        const profileArea = this.scene.add
            .circle(0, avatarY, avatarRadius, 0xe8f2ff, 1)
            .setStrokeStyle(3, 0xb8d4f4, 1);

        const avatar = this.scene.add
            .image(0, avatarY, "profile.human")
            .setOrigin(0.5)
            .setDisplaySize(avatarRadius * 2, avatarRadius * 2);

        // Crop the (square) source image to the circle so it fills the
        // avatar area edge-to-edge with no square corners poking out.
        Actions.AddMaskShape(avatar, { shape: "circle", useInternal: true });

        const name = this.scene.add
            .text(0, nameY, "Raka Samudra", {
                fontFamily: "Arial Black",
                fontSize: 24,
                color: "#1d4b97",
            })
            .setOrigin(0.5);

        const major = this.scene.add
            .text(0, majorY, "Cadet Nautika", {
                fontFamily: "Arial",
                fontSize: 17,
                color: "#2b5ca8",
            })
            .setOrigin(0.5);

        const idBg = this.scene.add
            .rectangle(0, idY, 200, 36, 0xe6f0ff, 1)
            .setStrokeStyle(2, 0xc7daf7, 1)
            .setOrigin(0.5);

        const idText = this.scene.add
            .text(0, idY, "NTP. 123456789012", {
                fontFamily: "Arial Black",
                fontSize: 16,
                color: "#1d4b97",
            })
            .setOrigin(0.5);

        panel.add([bg, title, profileArea, avatar, name, major, idBg, idText]);

        return panel;
    }

    private createScoreCard() {
        const width = this.width;
        const halfW = width / 2;
        const paddingX = 26;

        const panel = this.scene.add.container(0, 0);
        const bg = this.scene.add
            .rectangle(0, 0, width, this.scoreCardHeight, 0xf8fbff, 0.96)
            .setStrokeStyle(3, 0xb8d4f4, 1)
            .setOrigin(0.5);

        const title = this.scene.add
            .text(-halfW + paddingX, -66, "GREEN SCORE", {
                fontFamily: "Arial Black",
                fontSize: 19,
                color: "#1f8d52",
            })
            .setOrigin(0, 0.5);

        const ring = this.scene.add.graphics();
        const scoreText = this.scene.add
            .text(0, 8, "78", {
                fontFamily: "Arial Black",
                fontSize: 36,
                color: "#1f8d52",
            })
            .setOrigin(0.5);

        const scoreSubText = this.scene.add
            .text(0, 38, "/100", {
                fontFamily: "Arial",
                fontSize: 19,
                color: "#1f8d52",
            })
            .setOrigin(0.5);

        panel.add([bg, title, ring, scoreText, scoreSubText]);

        return { panel, title, ring, scoreText, scoreSubText };
    }

    private createBadgePanel() {
        const width = this.width;
        const halfW = width / 2;
        const paddingX = 26;
        const height = this.badgePanelHeight;
        const titleY = -58;
        const badgeY = 32;
        const badgeRadius = 24;
        const maxBadgeGap = 62;

        const panel = this.scene.add.container(0, 0);
        const bg = this.scene.add
            .rectangle(0, 0, width, height, 0xf6fbff, 0.95)
            .setStrokeStyle(3, 0xb8d4f4, 1)
            .setOrigin(0.5);

        const title = this.scene.add
            .text(-halfW + paddingX, titleY, "KOLEKSI LENCANA", {
                fontFamily: "Arial Black",
                fontSize: 19,
                color: "#1d4b97",
            })
            .setOrigin(0, 0.5);

        panel.add([bg, title]);

        // Badge slots are generated from `this.badges`, evenly spaced and
        // shrunk to fit if the list grows past the panel width.
        const slotCount = this.badges.length;
        const innerWidth = width - paddingX * 2;
        const badgeGap =
            slotCount > 1 ? Math.min(maxBadgeGap, innerWidth / (slotCount - 1)) : 0;
        const rowWidth = (slotCount - 1) * badgeGap;
        const startX = -rowWidth / 2;

        this.badges.forEach((badgeConfig, index) => {
            const locked = badgeConfig.id ? !isBadgeUnlocked(badgeConfig.id) : (badgeConfig.locked ?? false);
            const x = startX + index * badgeGap;
            const badge = this.scene.add
                .circle(x, badgeY, badgeRadius, locked ? 0xdfe8f2 : badgeConfig.color, 1)
                .setStrokeStyle(3, 0x8ea9c5, 0.9);
            const text = this.scene.add
                .text(x, badgeY, locked ? "🔒" : badgeConfig.icon, {
                    fontFamily: "Arial Black",
                    fontSize: 24,
                    color: locked ? "#91a4bc" : "#ffffff",
                })
                .setOrigin(0.5);
            panel.add([badge, text]);
        });

        return panel;
    }
}
