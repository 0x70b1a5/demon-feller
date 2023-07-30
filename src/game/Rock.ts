import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import Enemy, { EnemyConfig } from './Enemy';
import Feller from './Feller';
import animations from './util/animate';
import Stuff, { StuffConfig } from './Stuff';

export default class Rock extends Stuff {
  scene!: GameScene

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, config, x, y);
    this.scene = scene
    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.setOrigin(0.5, 0.5)
    this.setImmovable(true)

    this.remains = [
      this.scene.add.sprite(this.x + Math.random() * this.width - this.width/2, this.y + Math.random() * this.height - this.height/2, 'tribullet'),
      this.scene.add.sprite(this.x + Math.random() * this.width - this.width/2, this.y + Math.random() * this.height - this.height/2, 'tribullet'),
      this.scene.add.sprite(this.x + Math.random() * this.width - this.width/2, this.y + Math.random() * this.height - this.height/2, 'tribullet'),
    ]

    this.remains.forEach(r => r.setVisible(false).setActive(false))
  }

  fixedUpdate(time: number, delta: number) {
    super.fixedUpdate(time, delta);
  }

  hit(damage: number) {
    super.hit(damage)
    animations.wobbleSprite(this.scene, this, -5, 5, 50, false, false)
  }

  remains!: Phaser.GameObjects.Sprite[]
  onBeforeDie(): void {
    super.onBeforeDie()
    this.setRotation(Math.random())

    const minDepth = Math.min(...this.scene.enemies.map(e => e.depth))

    this.remains.forEach(r => {
      r.setActive(true).setVisible(true)
      .setRotation(Math.random() * 2 * Math.PI)
      .setDepth(minDepth)
    })

    if (Math.random() < 0.1) {
      this.scene.spawnPowerUp(this.room, undefined, this.x, this.y)
    }
  }
}
