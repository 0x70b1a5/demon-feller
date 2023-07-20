import { GameScene, RoomWithEnemies } from './scenes/GameScene'

export interface StuffConfig {
  health: number,
  damage?: number,
  texture: string,
  room: RoomWithEnemies
}

export default class Stuff extends Phaser.Physics.Arcade.Sprite {
  debug = true
  
  gfx!: Phaser.GameObjects.Graphics;
  scene!: GameScene
  health: number;
  damage?: number;
  room!: RoomWithEnemies

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, x, y, config.texture)
    this.scene = scene
    this.health = config.health || 3;
    this.damage = config.damage || 1;
    this.room = config.room
    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x00ff00 }, fillStyle: { color: 0x00ff00, alpha: 0.5 } })
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setX(scene.map.tileToWorldX(x)!)
    this.setY(scene.map.tileToWorldY(y)!)

    this.gfx.strokeCircle(this.x, this.y, this.height/2)
  }

  hit(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }

  die() {
    if (this.debug) {
      this.gfx.clear()
    }
    this.setVisible(false)
    this.setActive(false)
    this.body!.destroy()
  }
}