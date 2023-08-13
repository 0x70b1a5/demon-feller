import { PowerUpType } from "./PowerUpType";
import { GameScene } from "./scenes/GameScene";
import animations from "./util/animate";

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  powerupType: PowerUpType;
  bg!: Phaser.Physics.Arcade.Sprite
  iframes = 1000
  scene!: GameScene

  constructor(scene: GameScene, x: number, y: number, powerupType: PowerUpType) {
    console.log({ powerupType })
    const bg = scene.physics.add.sprite(x, y, 'powerupBG')
    super(scene, x, y, 'powerup'+powerupType);
    this.powerupType = powerupType;
    this.scene = scene
    this.scene.physics.world.enable(this);
    this.scene.add.existing(this);
    this.bg = bg

    this.gfx = this.scene.add.graphics({ fillStyle: { color: 0xffffff, alpha: 0.5, } })
    // animations.enshadow(this.bg)
    animations.wobbleSprite(this.scene, this, -20, 20)
    animations.wobbleSprite(this.scene, this.bg, -720, 720, 6000)
  }

  destroy(fromScene?: boolean | undefined): void {
    this.bg.destroy()
    super.destroy()
  }

  gfx: Phaser.GameObjects.Graphics
  fixedUpdate(time: number, delta: number) {
    if (this.iframes > 0) { 
      this.gfx.clear()
      this.gfx.fillCircle(this.x, this.y, this.iframes)
      this.iframes -= delta
    } else {
      this.gfx.clear()
    }
  }
}
