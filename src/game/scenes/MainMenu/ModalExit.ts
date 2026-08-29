import { GameObjects, Geom, Scene } from 'phaser';

export class ModalExit
{
    private scene: Scene;
    private container: GameObjects.Container;

    constructor (scene: Scene, onConfirm: () => void)
    {
        this.scene = scene;

        const overlay = scene.add.rectangle(0, 0, 100, 100, 0x081a33, 0.48).setOrigin(0.5);
        const panelBg = scene.add.rectangle(0, 0, 420, 220, 0xffffff, 0.98)
            .setStrokeStyle(3, 0xb8d4f4, 1)
            .setOrigin(0.5);
        const title = scene.add.text(0, -54, 'Konfirmasi Keluar', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#143a84'
        }).setOrigin(0.5);
        const message = scene.add.text(0, -6, 'Apakah Anda yakin ingin keluar?', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#28466d',
            align: 'center'
        }).setOrigin(0.5);
        const noButton = this.createTextButton('Tidak', 120, 46, 0x7d8da8);
        const yesButton = this.createTextButton('Iya', 120, 46, 0xd9534f);

        noButton.setPosition(-72, 64);
        yesButton.setPosition(72, 64);

        noButton.on('pointerdown', () => this.close());
        yesButton.on('pointerdown', () => onConfirm());

        this.attachHoverEffect(noButton);
        this.attachHoverEffect(yesButton);

        this.container = scene.add.container(0, 0, [overlay, panelBg, title, message, noButton, yesButton]).setDepth(100);
        this.container.setData('overlay', overlay);
        this.container.setVisible(false);
    }

    get view ()
    {
        return this.container;
    }

    open ()
    {
        this.container.setVisible(true);
        this.container.alpha = 0;
        this.container.setScale(0.96);

        this.scene.tweens.killTweensOf(this.container);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 180,
            ease: 'Quad.Out'
        });
    }

    close ()
    {
        this.scene.tweens.killTweensOf(this.container);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            scaleX: 0.96,
            scaleY: 0.96,
            duration: 160,
            ease: 'Quad.Out',
            onComplete: () => {
                this.container.setVisible(false);
            }
        });
    }

    layout (centerX: number, centerY: number, width: number, height: number)
    {
        this.container.setPosition(centerX, centerY);
        this.container.setSize(width, height);

        const overlay = this.container.getData('overlay') as GameObjects.Rectangle;
        overlay.setSize(width, height);
    }

    private createTextButton (label: string, width: number, height: number, fillColor: number)
    {
        const container = this.scene.add.container(0, 0);
        const bg = this.scene.add.graphics();
        const text = this.scene.add.text(0, 0, label, {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5);

        bg.fillStyle(fillColor, 1);
        bg.lineStyle(2, 0xffffff, 0.24);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

        container.add([bg, text]);
        container.setSize(width, height);
        container.setData('baseScaleX', 1);
        container.setData('baseScaleY', 1);
        container.setInteractive(new Geom.Rectangle(-width / 2, -height / 2, width, height), Geom.Rectangle.Contains);

        return container;
    }

    private attachHoverEffect (button: GameObjects.Container)
    {
        button.on('pointerover', () => this.showHover(button));
        button.on('pointerout', () => this.hideHover(button));
    }

    private showHover (button: GameObjects.Container)
    {
        const baseScaleX = (button.getData('baseScaleX') as number) ?? 1;
        const baseScaleY = (button.getData('baseScaleY') as number) ?? 1;

        this.scene.tweens.killTweensOf(button);
        this.scene.tweens.add({
            targets: button,
            scaleX: baseScaleX * 1.04,
            scaleY: baseScaleY * 1.04,
            duration: 140,
            ease: 'Quad.Out'
        });
    }

    private hideHover (button: GameObjects.Container)
    {
        const baseScaleX = (button.getData('baseScaleX') as number) ?? 1;
        const baseScaleY = (button.getData('baseScaleY') as number) ?? 1;

        this.scene.tweens.killTweensOf(button);
        this.scene.tweens.add({
            targets: button,
            scaleX: baseScaleX,
            scaleY: baseScaleY,
            duration: 140,
            ease: 'Quad.Out'
        });
    }
}
