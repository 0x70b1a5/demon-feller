import { Scene } from "phaser";
import EventEmitter from "./EventEmitter";
import { GameScene, RoomWithEnemies } from "./scenes/GameScene";
export type NESW = 'N' | 'E' | 'S' | 'W'
export default class Door extends Phaser.Physics.Arcade.Sprite {
  room!: RoomWithEnemies;
  scene!: GameScene;
  spawned = false
  nesw!: NESW

  constructor(scene: GameScene, room: RoomWithEnemies, nesw: NESW, x:number, y:number, texture:string='door') {
    super(scene, x, y, texture)
    this.scene = scene
    this.room = room;
    this.nesw = nesw;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.5)
    this.setImmovable(true)
    this.setSize(200, 200)

    this.setX(x + this.width / 2)
    this.setY(y + this.width / 2)

    switch(nesw) {
      case 'E':
        this.setRotation(Math.PI/2)
        break
      case 'W':
        this.setRotation(-Math.PI/2)
        break
      case 'S':
        this.setRotation(-Math.PI)
        break
      case 'N':
        // this.setRotation(-Math.PI)
        break
      default:
        break
    }

    this.setVisible(false)

    let overlapper = scene.physics.add.overlap(this, scene.feller.sprite, (me, feller) => {
      // when feller enters a room for the first time, push him in and lock
      scene.feller.sprite.setVelocity(0)
      const push = [0,0]
      const pushFactor = 1.5

      switch(nesw) {
        case 'E':
          push[0] = -this.width * pushFactor
          break
        case 'W':
          push[0] = this.width * pushFactor
          break
        case 'S':
          push[1] = -this.height * pushFactor
          break
        case 'N':
          push[1] = this.height * pushFactor
          break
        default:
          break
      }

      scene.feller.sprite.x += push[0]
      scene.feller.sprite.y += push[1]

      EventEmitter.emit('spawnDoors', this.room.guid)
    })

    scene.physics.add.collider(this, scene.enemies)
    scene.physics.add.collider(this, scene.feller.bullets, (me, bullet) => {
      bullet.destroy()
    })

    EventEmitter.on('spawnDoors', (guid: string) => {
      if (guid === this.room.guid && !this.spawned) {
        scene.physics.world.removeCollider(overlapper)
        this.spawned = true
        this.setVisible(true)
        scene.physics.add.collider(this, [scene.feller.sprite])
      }
    })

    EventEmitter.on('openDoors', (guid: string) => {
      if (guid === this.room.guid) {
        this.destroy()
      }
    })
  }

  preUpdate(time: any, delta: any) {
    super.preUpdate(time, delta);

  }
}