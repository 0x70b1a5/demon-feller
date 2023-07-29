import Bullet from "./Bullet";
import Enemy from "./Enemy";
import EventEmitter from "./EventEmitter";
import PowerUp, { PowerUpType } from "./Powerup";
import Stuff from "./Stuff";
import powerUps from "./constants/powerups";
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
  speed = 300
  bulletSpeed = 300
  damage = 1
  container!: Phaser.GameObjects.Container;

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

    this.container = this.scene.add.container(x, y);
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
   
    this.debugGraphics = this.scene.add.graphics({ lineStyle: { color: 0x0 }})

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
    .setBounce(1, 1)
    .setCircle(this.sprite.width/3, this.sprite.width/5, this.sprite.height/4)

    this.sprite.anims.play('feller-walk');

    this.scene.physics.add.collider(this.sprite, this.scene.stuffs)

    // animations.enshadow(this.sprite)
    // animations.enshadow(this.gunSprite)

    // this.container.add(this.sprite)
    // this.container.add(this.gunSprite)
  }

  freeze() {
    this.bodify(this.sprite).moves = false;
  }

  bodify(sprite: Phaser.Physics.Arcade.Sprite) {
    return (sprite.body as Phaser.Physics.Arcade.Body)
  }

  move() {
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

  }

  pointAndShoot() {
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


    if (this.shootCooldown <= 0) {
      if (pointer.primaryDown || this.keys.space.isDown) {
        this.shoot(angleToPointer);
      }
    } else {
      this.shootCooldown--
    }
  }

  update(time: any, delta: any) {
    const keys = this.keys;
    const sprite = this.sprite;

    this.move()  
    this.pointAndShoot()

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
    this.bullets.forEach(b => b.fixedUpdate(time, delta))
  }

  hit(by: Phaser.Physics.Arcade.Sprite & { damage: number, knockback: number }) {
    if (this.iframes > 0) {
      return
    }

    console.log('feller hit by enemy', by, this.hp)

    this.hp = Math.max(0, this.hp - by.damage)

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
        const speedRatio = this.speed / (this.speed + 50)
        this.speed += 50
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
        this.bulletSpeed *= 1.25
        EventEmitter.emit('reloadSpeed', this.RELOAD_COOLDOWN)
        break
      case PowerUpType.Bullet:
        this.damage++;
        EventEmitter.emit('damage', this.damage)
        break
      case PowerUpType.Knockback:
        this.knockback += 33
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
    const bullet = new Bullet(this.scene, barrelX, barrelY, { angle: bulletAngle, scale: this.damage/2, speed: this.bulletSpeed + this.speed * 0.5 }); 
    assert(bullet.body && this.sprite.body)
    bullet.body.velocity.x += this.sprite.body.velocity.x
    bullet.body.velocity.y += this.sprite.body.velocity.y
    this.bullets.push(bullet)
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
    this.scene.physics.add.collider(bullet, [
      this.scene.groundLayer, this.scene.stuffLayer, this.scene.shadowLayer
    ], (bullet) => (bullet as Bullet).bulletHitSomething(this.scene, this.damage, bulletAngle))
    this.shootCooldown = this.RELOAD_COOLDOWN;
  }
  
  destroy() {
    this.sprite.destroy();
    this.gunSprite.destroy();
    this.bullets.forEach(b => b.destroy())
  }
}
