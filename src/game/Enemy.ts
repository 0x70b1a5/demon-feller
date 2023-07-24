import Phaser from 'phaser'
import { GameScene, RoomWithEnemies } from './scenes/GameScene';
import { Room } from '@mikewesthad/dungeon';
import Feller from './Feller';
import EventEmitter from './EventEmitter';
import animations from './util/animate';
import { Exception } from 'sass';
import assert from './util/assert';
import Pathfinding, { DiagonalMovement } from 'pathfinding';
import TILE_MAPPING from './constants/tiles';

export interface EnemyConfig {
  damage?: number
  health?: number
  room: RoomWithEnemies
  texture: string
  velocity?: number
  enemyType?: EnemyType
}

export enum EnemyType {
  Goo,
  Pig,
  Soul,
  Belcher,
  Imp,
}

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  debug = false


  target!: Phaser.Types.Math.Vector2Like;
  health: number;
  damage: number;
  room!: RoomWithEnemies
  scene!: GameScene
  seenFeller = false
  speed = 100
  knockback = 100
  dead = false
  gfx!: Phaser.GameObjects.Graphics;
  pushing = 0
  enemyType?: EnemyType
  movementAngle = 0
  stun = 0

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, 0, 0, config.texture);
    this.health = config.health || 3;
    this.damage = config.damage || 1;
    this.room = config.room
    this.scene = scene
    this.speed = config.velocity || this.speed
    this.enemyType = config.enemyType

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.groundLayer)
    scene.physics.add.collider(this, scene.stuffLayer)
    scene.physics.add.collider(this, scene.stuffs)
    
    let [spawnX, spawnY] = scene.findUnoccupiedRoomTile(config.room, 3)
    while (this.scene.tileIsNearDoor(spawnX, spawnY, this.room, 600)) {
      [spawnX, spawnY] = scene.findUnoccupiedRoomTile(config.room, 3)
    }
    x ||= spawnX
    y ||= spawnY

    this.ensureIsInRoom(x, y)

    this
      .setOrigin(0.5, 0.5)
      .setCircle(this.width/2)


    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x0 }, fillStyle: { color: 0xff0000 }})
    if (this.debug) {
      this.gfx
      .fillRect(this.x, this.y, 10, 10)
    }
  }

  ensureIsInRoom(x: number, y: number) {
    const scene = this.scene
    this
      .setX(
        Phaser.Math.Clamp(
          scene.map.tileToWorldX(x)!, 
          scene.map.tileToWorldX(this.room.x + 2)!, 
          scene.map.tileToWorldX(this.room.x + this.room.width - 2)!
        ))
      .setY(
        Phaser.Math.Clamp(
          scene.map.tileToWorldY(y)!, 
          scene.map.tileToWorldY(this.room.y + 2)!, 
          scene.map.tileToWorldY(this.room.y + this.room.height - 2)!
      ))
    
  }

  attack(feller: Feller) {
    if (this.dead) return
    feller.hit(this)
  }

  hit(by: Phaser.Types.Math.Vector2Like & { damage: number, knockback: number }) {
    this.health -= by.damage;
    if (this.health <= 0) {
      this.die();
    }

    if (by.knockback) {
      this.stun = by.knockback
      // radians 
      const knockbackDir = Phaser.Math.Angle.BetweenPoints(by, this)
      let knockbackVelocityX = (by.x! < this.x ? 1 : -1) * (Math.sin(knockbackDir) + by.knockback);
      let knockbackVelocityY = (by.y! < this.y ? 1 : -1) * (Math.cos(knockbackDir) + by.knockback);
      
      (this.body as Phaser.Physics.Arcade.Body).velocity.x += knockbackVelocityX;
      (this.body as Phaser.Physics.Arcade.Body).velocity.y += knockbackVelocityY;
    }
  }

  preUpdate(time: any, delta: any) {
    super.preUpdate(time, delta);

    assert(this.room)

    if (this.debug) {
      this.gfx
        .clear()
        // .lineBetween(this.x, this.y, 
        //   this.scene.map.tileToWorldX(this.room.centerX)!, this.scene.map.tileToWorldY(this.room.centerY)!
        // )
        if(this.target)
        this.gfx
        .lineBetween(this.x, this.y, this.target.x!, this.target.y!)
        // .fillRect(this.x, this.y, 5, 5)
    }

    if (this.stun < 1) {
      this.lookForFeller()
      if (time % 1000 === delta) {
        this.acquireTarget(time, delta)
      }
      if (this.scene.tileIsNearDoor(this.scene.map.worldToTileX(this.x)!, this.scene.map.worldToTileY(this.y)!, this.room)) {
        this.acquireTarget(time, delta); 
      }
      this.move(time, delta)
    } else {
      this.stun--
    }
  }

  lookForFeller() {
    if (this.room.guid === this.scene.fellerRoom.guid) {
      !this.visible && this.setVisible(true)

      if (!this.seenFeller) {
        console.log('seen feller', this)
        this.seenFeller = true
        if(this.debug) {
          this.gfx.setDefaultStyles({ fillStyle: { color: 0x0000ff }})
        }
        this.target = this.scene.feller.sprite
      }
    } else {
      // if we are not in same room as player, hide sprite
      this.setVisible(false)
      this.seenFeller = false
    }
  }

  acquireTarget(time: any, delta: any) {
    if (!this.seenFeller) {
      const newTarget = () => this.scene.findUnoccupiedRoomTile(this.room, 2)

      let [x, y] = newTarget()

      while (this.scene.tileIsNearDoor(this.scene.map.worldToTileX(x)!, this.scene.map.worldToTileY(y)!, this.room, 500)) {
        [x, y] = newTarget()
      }

      this.target = { x, y }
    } else {
      this.target = this.scene.feller.sprite
    }
  }

  move(time: any, delta: any) {
    if (this.target) {
      this.chaseTarget()
    }
    this.wobble()
    this.setVelocity(Math.cos(this.movementAngle) * this.speed, Math.sin(this.movementAngle) * this.speed)
  }

  chaseTarget() {
    this.findPathToTarget()
    this.takePathToTarget()
  }

  path!: number[][]
  findPathToTarget() {
    if (!(this.x && this.y && this.target.x && this.target.y)) {
      return
    }
    
    this.path = this.scene.pathfinder.findPath(
      this.scene.map.worldToTileX(this.x)!, 
      this.scene.map.worldToTileY(this.y)!, 
      this.scene.map.worldToTileX(this.target.x)!, 
      this.scene.map.worldToTileY(this.target.y)!, 
      this.scene.pathfindingGrid.clone()
    )

    for (let step of this.path) {
      if (this.debug) {
        this.gfx.fillCircle((this.x!)!, (this.y!)!,5)
        .fillRect((this.target.x!)!, (this.target.y!)!, 5, 5)
        .fillRect( this.scene.map.tileToWorldX(step[0])!, this.scene.map.tileToWorldY(step[1])!, 5,5 )
      }
    }
  }

  takePathToTarget() {
    const secondStep = this.path?.[1]
    if (secondStep?.length) {
      // console.log({ firstStep })
      let dest = this.scene.map.tileToWorldXY(secondStep[0], secondStep[1])!
      // we want them to angle for the center of the tile, not the TL corner
      dest.x += this.scene.map.tileWidth / 2
      dest.y += this.scene.map.tileHeight / 2
      if (this.debug) {
        this.gfx.fillCircle(dest.x, dest.y, 10)
      }

      // maybe/maybe not
      // const distance = Phaser.Math.Distance.BetweenPoints(this, dest)
      // // if we're close enough to the goal, move on to the next tile
      // if (distance <= this.scene.map.tileWidth/4) {
      //   const thirdStep = this.path?.[2]
      //   if (thirdStep?.length) {
      //     dest = this.scene.map.tileToWorldXY(thirdStep[0], thirdStep[1])!
      //     dest.x += this.scene.map.tileWidth / 2
      //     dest.y += this.scene.map.tileHeight / 2
      //   }
      // }
      
      if (this.debug) {
        this.gfx.setDefaultStyles({ lineStyle:{ color: 0x0000ff } })
        .lineBetween(this.x, this.y, dest.x, dest.y)
      }
      this.movementAngle = Phaser.Math.Angle.BetweenPoints(this, dest)
    }
  }

  wobble() {
    this.movementAngle += Phaser.Math.FloatBetween(-1, 1) * Phaser.Math.DegToRad(40)
  }

  die() {
    if (this.debug) {
      this.gfx.clear()
    }
    this.dead = true
    EventEmitter.emit('demonFelled')
    this.scene.checkRoomComplete(this.room)
    this.scene.checkLevelComplete() // dont call after destroy()
    this.setVisible(false)
    this.setActive(false)
    this.body!.destroy()
  }
}
