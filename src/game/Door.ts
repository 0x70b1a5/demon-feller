import { Scene } from "phaser";
import EventEmitter from "./EventEmitter";
import { GameScene, RoomWithEnemies } from "./scenes/GameScene";

export default class Door extends Phaser.Physics.Arcade.Sprite {
  room!: RoomWithEnemies;
  scene!: GameScene;
  
  constructor(scene: GameScene, room: RoomWithEnemies, nesw: 'N' | 'E' | 'S' | 'W', x:number, y:number, texture:string='door') {
    super(scene, x, y, texture)
    this.scene = scene
    this.room = room;
    switch(nesw) {
      case 'E':
        this.setRotation(Math.PI/2)
        break
      case 'W':
        this.setRotation(-Math.PI/2)
        break
      case 'S':
        this.setRotation(Math.PI)
        break
      case 'N':
      default:
        break
    }

    this.scene.physics.add.collider(this, this.scene.feller.sprite)

    EventEmitter.on('openDoors', (guid: string) => {
      if (guid === this.room.guid) {
        this.destroy()
      }
    })
  }

  preUpdate(time: any, delta: any) {

  }
}