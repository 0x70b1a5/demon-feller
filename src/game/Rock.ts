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
    // Set up physics
    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.setOrigin(0.5, 0.5)
    this.setImmovable(true)
    this.setSize(this.scene.map.tileWidth - 20, this.scene.map.tileHeight - 20)
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    if (this.health <= 0) {
      this.die()
      const remains = [
        this.scene.add.sprite(this.x + Math.random() * 20 - this.width / 2, this.y + Math.random() * 20 - this.height/2, 'tribullet'),
        this.scene.add.sprite(this.x + Math.random() * 20 - this.width / 2, this.y + Math.random() * 20 - this.height/2, 'tribullet'),
        this.scene.add.sprite(this.x + Math.random() * 20 - this.width / 2, this.y + Math.random() * 20 - this.height/2, 'tribullet'),
      ]

      remains.forEach(r => r.setRotation(Math.random() * 2 * Math.PI))
    }
  }
}
