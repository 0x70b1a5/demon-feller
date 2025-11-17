import Phaser from 'phaser'
import { GameScene, RoomWithEnemies } from './scenes/GameScene';
import Feller from './Feller';
import EventEmitter from './EventEmitter';
import { v4 as uuid } from 'uuid'
import Bullet from './Bullet';

export interface EnemyConfig {
  level: number
  damage?: number
  health?: number
  room: RoomWithEnemies
  texture: string
  velocity?: number
  enemyType?: EnemyType
}

export enum EnemyType {
  None,
  Goo,
  Pig,
  Soul,
  Glutton,
  Imp,
  Hothead,
  ImpMother,
  Covetor,
}

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  debug = false


  target!: Phaser.Types.Math.Vector2Like;
  config!: EnemyConfig;
  health!: number;
  damage!: number;
  room!: RoomWithEnemies
  scene!: GameScene
  _scene!: GameScene
  seenFeller = false
  speed = 100
  knockback = 100
  dead = false
  gfx!: Phaser.GameObjects.Graphics;
  pushing = 0
  enemyType?: EnemyType
  movementAngle = 0
  stun = 0
  stunImmunity = 0
  guid = uuid()
  minimapMarker!: Phaser.GameObjects.Sprite

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, 0, 0, config.texture);
    this.health = config.health || 3
    this.damage = config.damage || 1
    this.room = config.room
    this.scene = this._scene = scene
    this.speed = config.velocity || this.speed
    this.enemyType = config.enemyType
    this.config = config

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.groundLayer)
    scene.physics.add.collider(this, scene.stuffs)

    // console.log('enemy', config, this.damage, this.health)

    this
      .setOrigin(0.5, 0.5)
      .setBounce(1, 1)

    if (!(x && y)) {
      [x, y] = scene.findUnoccupiedRoomTile(config.room, 3)
    }

    this.debug && console.log('actually spawning enemy at', { x, y })

    const [spawnX, spawnY] = [
      scene.map.tileToWorldX(this.room.x + x)! + scene.map.tileWidth / 2,
      scene.map.tileToWorldY(this.room.y + y)! + scene.map.tileHeight / 2
    ]

    this
      .setX(spawnX)
      .setY(spawnY)

    this.debug && (this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x0 }, fillStyle: { color: 0xff0000 }}))

    this.minimapMarker = scene.add.sprite(spawnX, spawnY, 'mm-demon').setScale(10);
    scene.cameras.main.ignore(this.minimapMarker)

    if (this.debug) {
      this.gfx
      .fillRect(this.x, this.y, 10, 10)
    }

    this.debug && console.log('enemy constructed:', this)
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

    return this
  }

  attack(feller: Feller) {
    if (this.dead) return
    feller.hit(this)
  }

  getKnockbacked(by: Phaser.Types.Math.Vector2Like & { knockback: number }, byBullet?: Bullet) {
    EventEmitter.emit('playSound', 'stun')

    this.stun = by.knockback
    this.stunImmunity = this.stun * 2
    // radians
    const knockbackDir = byBullet ? byBullet.angle : Phaser.Math.Angle.BetweenPoints(by, this)
    const knockbackVelocityX = (by.x! < this.x ? 1 : -1) * (Math.sin(knockbackDir) + 100);
    const knockbackVelocityY = (by.y! < this.y ? 1 : -1) * (Math.cos(knockbackDir) + 100);

    this.setVelocityX(knockbackVelocityX);
    this.setVelocityY(knockbackVelocityY);

    const origRotation = this.rotation
    this.scene.tweens.add({
      targets: this,
      rotation: {
        value: { from: Phaser.Math.DegToRad(-45), to: origRotation },
        duration: this.stun,
        repeat: false,
        ease: 'Elastic',
      },
    });
  }

  hit(by: Phaser.Types.Math.Vector2Like & { damage: number, knockback: number }, byBullet?: Bullet) {
    this.health -= by.damage;
    if (this.health <= 0) {
      this.die();
      return
    }

    if (by.knockback && this.stunImmunity < 1) {
      this.getKnockbacked(by, byBullet)
    }
  }

  fixedUpdate(time: any, delta: any) {
    if (this.dead || !this.body) return

    super.preUpdate(time, delta);

    // if we spawned outside the room for some reason, warp back to the center.
    const ourTileXY = this.scene.map.worldToTileXY(this.x, this.y)
    const roomMinTileXY = this.scene.map.worldToTileXY(this.room.x, this.room.y)
    const roomMaxTileXY = this.scene.map.worldToTileXY(this.room.x + this.room.width, this.room.y + this.room.height)
    if (
      !ourTileXY || !roomMinTileXY || !roomMaxTileXY
      || ourTileXY.x < roomMinTileXY.x
      || ourTileXY.x > roomMaxTileXY.x
      || ourTileXY.y < roomMinTileXY.y
      || ourTileXY.y > roomMaxTileXY.y
    ) {
      this.setX(this.scene.map.tileToWorldX(this.room.centerX)!)
      this.setY(this.scene.map.tileToWorldY(this.room.centerY)!)
    }

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

    if (this.seenFeller) {
      if (this.stun < 1) {
        this.move(time, delta)
      } else {
        this.stun -= delta
        // Are we inside a wall? Stop moving
        if (this.active && this.scene?.groundLayer) {
          // Check if bullet is inside a colliding tile
          const tileX = this.scene.map.worldToTileX(this.x)
          const tileY = this.scene.map.worldToTileY(this.y)

          if (tileX !== null && tileY !== null) {
            const tile = this.scene.groundLayer.getTileAt(tileX, tileY)
            if (tile && tile.collides) {
              this.setVelocity(0, 0)
            }
          }
        }
        // Are we inside a door? Also stop moving
        if (this.active && this.scene?.rooms) {
          const doors = this.scene.rooms.flatMap(room => room.getDoorLocations()).flat()
          for (const door of doors) {
            if (door.x === this.scene.map.worldToTileX(this.x) && door.y === this.scene.map.worldToTileY(this.y)) {
              this.setVelocity(0, 0)
            }
          }
        }
      }

      if (this.stunImmunity > 0) this.stunImmunity -= delta

      this.minimapMarker.setX(this.x).setY(this.y)
    } else if (this.active && this.visible) {
      this.showIfInRoom()
    }
  }

  activate() {
    this.setActive(true).setVisible(true)
    this.minimapMarker.setVisible(true).setActive(true)
  }

  showIfInRoom() {
    if (this.room.guid === this.scene.fellerRoom.guid) {
      if (!this.visible || !this.active) {
        this.activate()
      }
      this.seenFeller = true
      this.target = this.scene.feller.sprite

      if(this.debug) {
        this.gfx.setDefaultStyles({ fillStyle: { color: 0x0000ff }})
      }
    } else if (this.visible || this.active) {
      // if we are not in same room as player, hide sprite
      this.setVisible(false).setActive(false)
      this.minimapMarker.setVisible(false).setActive(false)
      this.seenFeller = false
    }
  }

  move(time: any, delta: any) {
    this.chaseTarget(delta)
    this.setVelocity(Math.cos(this.movementAngle) * this.speed, Math.sin(this.movementAngle) * this.speed)
    if (delta % 10 === 0) this.wobble()
  }

  chaseTarget(delta: number) {
    this.findPathToTarget(delta)
    this.takePathToTarget()
  }

  path!: number[][]
  pathingCooldown = 0
  PATHING_COOLDOWN_MS = 500
  findPathToTarget(delta: number) {
    if (this.pathingCooldown > 0 || !(this.x && this.y && this.target?.x && this.target?.y)) {
      this.pathingCooldown -= delta
      return
    }

    this.pathingCooldown = this.PATHING_COOLDOWN_MS

    this.path = this.scene.pathfinder.findPath(
      this.scene.map.worldToTileX(this.x)!,
      this.scene.map.worldToTileY(this.y)!,
      this.scene.map.worldToTileX(this.target.x)!,
      this.scene.map.worldToTileY(this.target.y)!,
      this.scene.pathfindingGrid.clone()
    )

    if (this.debug) {
      for (let step of this.path) {
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
        this.gfx.setDefaultStyles({ lineStyle:{ color: 0x0000ff } })
        .lineBetween(this.x, this.y, dest.x, dest.y)
      }
      this.movementAngle = Phaser.Math.Angle.BetweenPoints(this, dest)
    }
  }

  wobble() {
    this.movementAngle += Phaser.Math.FloatBetween(-1, 1) * Phaser.Math.DegToRad(100)
  }

  die() {
    if (this.debug) {
      this.gfx.clear()
    }
    this.dead = true
    EventEmitter.emit('demonFelled')
    this._scene.checkRoomComplete(this.room)
    this._scene.checkLevelComplete() // dont call after destroy()
    this.setVisible(false)
    this.setActive(false)
    this.minimapMarker?.destroy()
    this.body?.destroy()
    setTimeout(() => this.destroy(), 1_000)
  }
}
