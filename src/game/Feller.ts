import Bullet from "./Bullet";
import Enemy from "./Enemy";
import EventEmitter from "./EventEmitter";
import PowerUp, { PowerUpType } from "./Powerup";
import Stuff from "./Stuff";
import powerUps from "./constants/powerups";
import TILE_MAPPING from "./constants/tiles";
import { GameScene } from "./scenes/GameScene";
import animations from "./util/animate";
import assert from "./util/assert";
import roll from "./util/roll";

/**
 * A class that wraps up our top down player logic. It creates, animates and moves a sprite in
 * response to WASD keys. Call its update method from the scene's update and call its destroy
 * method when you're done with the player.
 */
export default class Feller {
  debug = false

  
  scene!: GameScene
  sprite!: Phaser.Physics.Arcade.Sprite
  keys!: Phaser.Types.Input.Keyboard.CursorKeys & { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  gunSprite!: Phaser.Physics.Arcade.Sprite;
  debugGraphics!: Phaser.GameObjects.Graphics;
  shootCooldown = 0
  RELOAD_COOLDOWN = 40
  IFRAMES_DURATION = 100
  STUN_DURATION = 25
  knockback = 0
  bullets: Bullet[] = []
  hp = 3
  MAX_HEALTH = 3
  iframes = 0
  stun = 0
  speed = 800
  damage = 1
  container!: Phaser.GameObjects.Container;
  minimapMarker!: Phaser.GameObjects.Sprite;

  constructor(scene: GameScene, x: number, y: number) {
    this.scene = scene;
    const anims = scene.anims;
    if (!(anims.exists('feller-walk') && anims.exists('feller-sheet'))) {
      anims.create({
        key: 'feller-walk',
        frames: anims.generateFrameNumbers('feller-sheet', { frames: [1,2,3,2] }),
        frameRate: 10,
        repeat: -1
      })
      anims.create({
        key: 'feller-hurt',
        frames: anims.generateFrameNumbers('feller-sheet', { start: 4, end: 4 }),
        frameRate: 12,
        repeat: -1
      })
    }

    console.log('newed up a feller')

    this.createNewSprite(x, y)

    this.keys = this.scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,          
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Phaser.Types.Input.Keyboard.CursorKeys & { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
   
    this.debugGraphics = this.scene.add.graphics({ 
      lineStyle: { color: 0x0 }, 
      fillStyle: { color: 0x0000ff },
    })

    EventEmitter.emit('health', [this.hp, this.MAX_HEALTH])
    EventEmitter.emit('speed', this.speed)
    EventEmitter.emit('reloadSpeed', this.RELOAD_COOLDOWN)
    EventEmitter.emit('demonsFelled', 0)

  }

  createNewSprite(x: number, y: number) {
    if (this.sprite) {
      this.sprite.destroy()
    }

    if (this.gunSprite) {
      this.gunSprite.destroy()
    }

    if (this.container) {
      this.container.destroy()
    }

    if (this.minimapMarker) {
      this.minimapMarker.destroy()
    }

    this.gunSprite = this.scene.physics.add
      .sprite(x, y, 'gun')
      .setScale(0.35)
      .setOrigin(0.5, 0.5);

    // --- //
    
    this.sprite = this.scene.physics.add
      .sprite(x, y, 'feller-sheet')
      // .setOrigin(1, 0.5)

    // DO NOT CHAIN THESE CALLS TO THE ABOVE CALLS
    this.sprite
    .setScale(0.5)
    .setSize(135, 185)
    .setBounce(1, 1)

    this.sprite.anims.play('feller-walk');

    this.scene.physics.add.collider(this.sprite, this.scene.stuffs)

    this.minimapMarker = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'mm-feller').setScale(20);
    this.scene.cameras.main.ignore([this.minimapMarker])
    // this.container = this.scene.add.container(x, y);
    // this.container.add(this.sprite)
    // this.container.add(this.gunSprite)
    // this.scene.physics.world.enable(this.container)
    // this.container.add(this.gunSprite)
  }

  freeze() {
    this.bodify(this.sprite).moves = false;
  }

  bodify(sprite: Phaser.Physics.Arcade.Sprite) {
    return (sprite.body as Phaser.Physics.Arcade.Body)
  }

  move(delta: number) {
    const keys = this.keys;
    const sprite = this.sprite;
    const body = this.bodify(sprite)

    if (this.stun <= 0) {
      // Stop any previous movement from the last frame
      body.setVelocity(0);

      // Horizontal movement
      if (keys.left.isDown || keys.a.isDown) {
        body.setVelocityX(-this.speed);
        sprite.setFlipX(false);
      } else if (keys.right.isDown || keys.d.isDown) {
        sprite.setFlipX(true);
        body.setVelocityX(this.speed);
      }

      // Vertical movement
      if (keys.up.isDown || keys.w.isDown) {
        body.setVelocityY(-this.speed);
      } else if (keys.down.isDown || keys.s.isDown) {
        body.setVelocityY(this.speed);
      }

      // Normalize and scale the velocity so that sprite can't move faster along a diagonal
      body.velocity.normalize().scale(this.speed);

      // Update the animation last and give left/right/down animations precedence over up animations
      if (keys.left.isDown || keys.right.isDown || keys.down.isDown || keys.up.isDown || keys.a.isDown || keys.d.isDown || keys.w.isDown || keys.s.isDown) {
        sprite.anims.play('feller-walk', true);
      } else {
        sprite.anims.stop();

        // If we were moving & now we're not, then pick a single idle frame to use
        sprite.setTexture('feller-sheet', 0);
      }
    } else {
      this.stun--
      this.sprite.anims.play('feller-hurt')
    }

    let collision = null
    if (body.velocity.x !== 0 || body.velocity.y !== 0) {
      // Check for collision using fast voxel http://www.cs.yorku.ca/~amana/research/grid.pdf
      collision = this.testVoxelCollide();
    }

    if (collision) {
      // Respond to the collision, e.g., stop movement or adjust the position
      body.setVelocity(0)
      console.log({collision})
    } else {
      // Normalize and scale the velocity so that sprite can't move faster along a diagonal
      body.velocity.normalize().scale(this.speed);
    }
  }

  testVoxelCollide() {
    // this.debugGraphics.clear().setDepth(this.sprite.depth + 1)

    // The traversal algorithm consists of two phases: initialization and incremental traversal. 
    
    // The initialization phase begins by identifying the voxel in which the ray origin, →u, is found. 
    //   The integer variables X and Y are initialized to the starting voxel coordinates.
    let [X, Y] = [this.tileX, this.tileY]
    const v = this.sprite.body?.velocity
    if (!v) return null
    const theta = Math.atan2(v.y, v.x)

    // If the ray origin is outside the grid, we find the point
    //   in which the ray enters the grid and take the adjacent voxel. 
    // TODO

    // In addition, the variables stepX and stepY are initialized to either 1 or -1 
    //   indicating whether X and Y are incremented or decremented 
    //   as the ray crosses voxel boundaries 
    //   (this is determined by the sign of the x and y components of →v).
    const [stepX, stepY] = [Math.sign(v.x || 0), Math.sign(v.y || 0)]
    
    // Next, we determine the value of t at which the ray crosses the first vertical voxel boundary and
    //   store it in variable tMaxX. We perform a similar computation in y and store the result in tMaxY. The
    //   minimum of these two values will indicate how much we can travel along the ray and still remain in the
    //   current voxel.
    let [tMaxX, tMaxY] = [
      Math.abs(this.sprite.x % this.scene.map.tileWidth) / this.scene.map.tileWidth,
      Math.abs(this.sprite.y % this.scene.map.tileHeight) / this.scene.map.tileHeight 
    ]

    // Finally, we compute tDeltaX and tDeltaY. TDeltaX indicates how far along the ray we must move
    //   (in units of t) for the horizontal component of such a movement to equal the width of a voxel. Similarly,
    //   we store in tDeltaY the amount of movement along the ray which has a vertical component equal to the
    //   height of a voxel.
    let [sin, cos] = [Math.sin(theta), Math.cos(theta)]
    if (sin < 0.00001) sin = 0
    if (cos < 0.00001) cos = 0
    let [tDeltaX, tDeltaY] = [
      this.scene.map.tileHeight * 1/(sin || 2), // cosecant(theta) = hyp/opp. if would div by 0 then use height
      this.scene.map.tileWidth * 1/(cos || 2),  // secant (theta) = hyp/adj. if would div by 0 then use width
    ]

    console.log({tMaxX, tMaxY, tDeltaX, tDeltaY, sin, cos, theta })

    let foundWallTile = 0
    let steps = 0
    while (Math.abs(this.tileX - X) < 2 && Math.abs(this.tileY - Y) < 2) {
      if (tMaxX < tMaxY) {
        tMaxX += tDeltaX
        X += stepX
      } else {
        tMaxY += tDeltaY
        Y += stepY
      }
      this.debugGraphics.fillPoint(this.scene.map.tileToWorldX(X)!, this.scene.map.tileToWorldY(Y)!, 5)
      foundWallTile = this.scene.walkableTilesAs01?.[Y]?.[X]
      console.log({ X, Y, foundWallTile, tDeltaX, tDeltaY, tMaxX, tMaxY, stepX, stepY })
      if (foundWallTile) return { x: X, y: Y }
    }

    return null; // No collision detected
  }
  
  makeGunFollowPointer() {
    const sprite = this.sprite;
    // Calculate the angle between the gun and the mouse cursor
    const pointer = this.scene.input.mousePointer;
    // const [px, py] = [
    //     Math.max(pointer.x, pointer.x - (this.scene.game.config.width as number)/2 + sprite.x),
    //     Math.max(pointer.y, pointer.y - (this.scene.game.config.height as number)/2 + sprite.y)
    // ]
    // Convert the pointer position to the world position
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    const [px, py] = [worldPoint.x, worldPoint.y];
    
    const angleToPointer = Phaser.Math.Angle.Between(sprite.x, sprite.y, px, py);

    if (this.debug) {
      this.debugGraphics.clear()
      this.debugGraphics.lineBetween(sprite.x, sprite.y, px, py)
      // console.log(angleToPointer)
    }

    // Rotate the gun to face the cursor
    this.gunSprite.setRotation(angleToPointer);

    // Position the gun 20px from the feller's center towards the cursor
    const distanceFromCenter = this.sprite.width/4;
    this.gunSprite.x = sprite.x + distanceFromCenter * Math.cos(angleToPointer);
    this.gunSprite.y = sprite.y + distanceFromCenter * Math.sin(angleToPointer);

    this.gunSprite.flipY = this.gunSprite.x < sprite.x

    return angleToPointer
  }

  tileX!: number
  tileY!: number
  update(time: any, delta: any) {
    this.move(delta)  
    this.tileX = this.scene.groundLayer.worldToTileX(this.sprite.x);
    this.tileY = this.scene.groundLayer.worldToTileY(this.sprite.y);

    const angleToPointer = this.makeGunFollowPointer()

    if (this.shootCooldown > 0) {
      this.shootCooldown--
    } else if (this.scene.input.mousePointer.primaryDown || this.keys.space.isDown) {
      this.shoot(angleToPointer);
    }

    if (this.iframes > 0) {
      this.iframes--
      if (time % 2 === 0) {
        this.sprite.setVisible(false)
      } else {
        this.sprite.setVisible(true)
      }
    } else {
      !this.sprite.visible && this.sprite.setVisible(true)
    }

    let depth = this.sprite.depth
    this.scene.stuffs.forEach(stuff => depth = Math.max(depth, stuff.depth))
    this.sprite.setDepth(depth+2)
    this.gunSprite.setDepth(depth+1)
    // this.bullets.forEach(b => b.fixedUpdate(time, delta))
    this.minimapMarker?.setX(this.sprite.x).setY(this.sprite.y)
  }

  hit(by: Phaser.Physics.Arcade.Sprite & { damage: number, knockback: number }) {
    if (this.iframes > 0) {
      return
    }

    EventEmitter.emit('playSound', 'fellerhurt')

    this.scene.cameras.main.flash(10, 255, 100, 100, true)

    console.log('feller hit by enemy', by, this.hp)

    this.hp = Math.max(0, this.hp - Math.floor(by.damage))

    EventEmitter.emit('health', [this.hp, this.MAX_HEALTH])
    
    if (this.hp <= 0) {
      EventEmitter.emit('gameOver')
      return
      // TODO implement game over or respawn logic here
    } 
    
    this.iframes = this.IFRAMES_DURATION
    this.stun = this.STUN_DURATION

    // radians 
    const knockbackDir = Phaser.Math.Angle.BetweenPoints(by, this.sprite)
    let knockbackVelocityX = (by.x < this.sprite.x ? 1 : -1) * (Math.sin(knockbackDir) + by.knockback)
    let knockbackVelocityY = (by.y < this.sprite.y ? 1 : -1) * (Math.cos(knockbackDir) + by.knockback)

    this.sprite.setVelocityX(knockbackVelocityX)
    this.sprite.setVelocityY(knockbackVelocityY)
  }

  pickupPowerUp(powerup: PowerUp) {
    switch (powerup.powerupType) {
      case PowerUpType.Health: 
        this.MAX_HEALTH++;
        this.heal(this.MAX_HEALTH)
        break
      case PowerUpType.Speed:
        const speedUp = 50
        const speedRatio = this.speed / (this.speed + speedUp)
        this.speed += speedUp
        // TODO tween camera out
        this.scene.tweens.add({
          targets: this.scene.cameras.main,
          zoom: {
            from: this.scene.cameras.main.zoom,
            to: this.scene.cameras.main.zoom * speedRatio,
            duration: 500,
            ease: 'Sine.easeOut'
          }
        })
        const rate = this.scene.anims.get('feller-walk').frameRate 
        this.scene.anims.get('feller-walk').frameRate = Math.min(rate + 1, 60)
        this.sprite.anims.stop() // animation won't update until we restart
        EventEmitter.emit('speed', this.speed)
        break
      case PowerUpType.RateOfFire:
        this.RELOAD_COOLDOWN = Math.max(this.RELOAD_COOLDOWN * 0.85, 1)
        EventEmitter.emit('reloadSpeed', this.RELOAD_COOLDOWN)
        break
      case PowerUpType.Bullet:
        this.damage++;
        EventEmitter.emit('damage', this.damage)
        break
      case PowerUpType.Knockback:
        this.knockback += 22
        EventEmitter.emit('stun', this.knockback)
        break
      default:
        break
    }
  }

  heal(points: number) {
    this.hp += points
    if (this.hp > this.MAX_HEALTH) {
      this.hp = this.MAX_HEALTH
    }

    EventEmitter.emit('health', [this.hp, this.MAX_HEALTH])
  }

  shoot(bulletAngle: number) {
    const barrelDistance = 80
    const offset = (Math.abs(bulletAngle) > Math.PI/2 ? 1 : -1) * Math.PI/12
    const barrelX = this.gunSprite.x + barrelDistance * Math.cos(bulletAngle + offset);
    const barrelY = this.gunSprite.y + barrelDistance * Math.sin(bulletAngle + offset);

    // Create new bullet at the barrel's position and set its velocity.
    const bullet = new Bullet(this.scene, barrelX, barrelY, { angle: bulletAngle, scale: Math.sqrt(this.damage), speed: this.speed * 1.5 }); 
    
    this.bullets.push(bullet)
    
    EventEmitter.emit('playSound', 'shoot')

    this.scene.physics.add.overlap(bullet, this.scene.enemies, (bullet, _enemy) => {
      const enemy = _enemy as Enemy
      console.log('bullet hit enemy', enemy);
      enemy.hit( { ...this.sprite, damage: this.damage, knockback: this.knockback } );
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, bulletAngle)
    })
    this.scene.physics.add.overlap(bullet, this.scene.stuffs, (bullet, _stuff) => {
      const stuff = _stuff as Stuff
      console.log('bullet hit stuff');
      stuff.hit(this.damage);
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, bulletAngle)
    })
    this.scene.physics.add.overlap(bullet, [
      this.scene.groundLayer, 
    ], (bullet, tile) => {
      if ((tile as Phaser.Tilemaps.Tile).collides) {
        (bullet as Bullet).bulletHitSomething(this.scene, this.damage, bulletAngle)
      }
    })
    this.shootCooldown = this.RELOAD_COOLDOWN;
  }
  
  destroy() {
    this.sprite.destroy();
    this.gunSprite.destroy();
    this.bullets.forEach(b => b.destroy())
  }
}
