import Bullet from "./Bullet";
import Enemy from "./Enemy";
import EventEmitter from "./EventEmitter";
import PowerUp, { PowerUpType } from "./Powerup";
import { GameScene } from "./scenes/GameScene";
import animations from "./util/animate";

/**
 * A class that wraps up our top down player logic. It creates, animates and moves a sprite in
 * response to WASD keys. Call its update method from the scene's update and call its destroy
 * method when you're done with the player.
 */
export default class Feller {
  scene!: GameScene
  sprite!: Phaser.Physics.Arcade.Sprite
  keys!: Phaser.Types.Input.Keyboard.CursorKeys & { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  gunSprite!: Phaser.Physics.Arcade.Sprite;
  debugGraphics!: Phaser.GameObjects.Graphics;
  shootCooldown = 0
  RELOAD_COOLDOWN = 40
  IFRAMES_DURATION = 100
  bullets: Bullet[] = []
  hp = 3
  MAX_HEALTH = 3
  iframes = 0
  speed = 300
  debug = false

  constructor(scene: GameScene, x: number, y: number) {
    this.scene = scene;
    const anims = scene.anims;
    anims.create({
      key: 'player-walk',
      frames: anims.generateFrameNumbers('feller-sheet', { start: 1, end: 3 }),
      frameRate: 12,
      repeat: -1
    })

    this.gunSprite = scene.physics.add
      .sprite(x, y, 'gun')
      .setScale(0.35)
      .setOrigin(0.5, 0.5);

    this.sprite = scene.physics.add
      .sprite(x, y, 'feller-sheet')
      .setScale(0.5);

    this.sprite
      .setSize(this.sprite.width/2, this.sprite.height*0.75)
      .setOrigin(0.5, 0.5);

    this.sprite.anims.play('player-walk');

    animations.enshadow(this.sprite)
    animations.enshadow(this.gunSprite)

    this.keys = this.scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    }) as Phaser.Types.Input.Keyboard.CursorKeys & { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
   
    this.debugGraphics = this.scene.add.graphics({ lineStyle: { color: 0x0 }})

    EventEmitter.emit('health', [this.hp, this.MAX_HEALTH])
    EventEmitter.emit('speed', this.speed)
    EventEmitter.emit('reloadSpeed', this.RELOAD_COOLDOWN)
    EventEmitter.emit('demonsFelled', 0)
  }

  freeze() {
    this.bodify(this.sprite).moves = false;
  }

  bodify(sprite: Phaser.Physics.Arcade.Sprite) {
    return (sprite.body as Phaser.Physics.Arcade.Body)
  }

  update(time: any, delta: any) {
    const keys = this.keys;
    const sprite = this.sprite;
    const body = this.bodify(sprite)

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
      sprite.anims.play('player-walk', true);
    } else {
      sprite.anims.stop();

      // If we were moving & now we're not, then pick a single idle frame to use
      sprite.setTexture('feller-sheet', 0);
    }
    
    // Calculate the angle between the gun and the mouse cursor
    const pointer = this.scene.input.mousePointer;
    const [px, py] = [pointer.x - (this.scene.game.config.width as number)/2 + sprite.x, pointer.y - (this.scene.game.config.height as number)/2 + sprite.y]
    
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

    if (this.shootCooldown > 0) {
      this.shootCooldown--
    } else {
      if (pointer.primaryDown) {
        this.shoot(angleToPointer);
      }
    }

    if (this.iframes > 0) {
      this.iframes--
      if (time % 2 === 0) {
        this.sprite.setVisible(false)
      } else {
        this.sprite.setVisible(true)
      }
    } else {
      this.sprite.setVisible(true)
    }
  }

  hit(byEnemy: Enemy) {
    console.log('feller hit by enemy', byEnemy, this.hp)

    if (this.iframes > 0) {
      return
    }

    this.hp -= byEnemy.damage;
    if (this.hp <= 0) {
      EventEmitter.emit('gameOver')
      return
      // TODO implement game over or respawn logic here
    } 
    
    this.iframes = this.IFRAMES_DURATION

    // radians 
    const knockbackDir = Phaser.Math.Angle.BetweenPoints(byEnemy, this.sprite)
    const knockbackX = this.sprite.x + (byEnemy.x < this.sprite.x ? 1 : -1) * (Math.sin(knockbackDir) + byEnemy.knockback)
    const knockbackY = this.sprite.y + (byEnemy.y < this.sprite.y ? 1 : -1) * (Math.cos(knockbackDir) + byEnemy.knockback)
    this.sprite.setPosition(knockbackX, knockbackY)

    EventEmitter.emit('health', [this.hp, this.MAX_HEALTH])
  }

  pickupPowerUp(powerup: PowerUp) {
    switch (powerup.powerupType) {
      case PowerUpType.Health: 
        this.MAX_HEALTH++;
        this.heal(this.MAX_HEALTH)
        break
      case PowerUpType.Speed:
        this.speed += 50
        EventEmitter.emit('speed', this.speed)
        break
      case PowerUpType.Shoot:
        this.RELOAD_COOLDOWN = Math.max(this.RELOAD_COOLDOWN * 0.8, 1)
        EventEmitter.emit('reloadSpeed', this.RELOAD_COOLDOWN)
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

  shoot(angle: number) {
    const barrelDistance = 80
    const offset = (Math.abs(angle) > Math.PI/2 ? 1 : -1) * Math.PI/12
    const barrelX = this.gunSprite.x + barrelDistance * Math.cos(angle + offset);
    const barrelY = this.gunSprite.y + barrelDistance * Math.sin(angle + offset);

    // Create new bullet at the barrel's position and set its velocity.
    const bullet = new Bullet(this.scene, barrelX, barrelY, angle); 
    this.bullets.push(bullet)
    this.scene.physics.add.overlap(bullet, this.scene.enemies, (bullet, _enemy) => {
      const enemy = _enemy as Enemy
      console.log('bullet hit enemy');
      enemy.hit()
      bullet.destroy()
      if (enemy.originalRoom?.enemies.every(e => e.dead) && !enemy.originalRoom.hasSpawnedPowerup) {
        enemy.originalRoom.hasSpawnedPowerup = true
        this.scene.spawnPowerUp(enemy.currentRoom, this.scene.rollPowerUp())
      }
    })
    this.scene.physics.add.collider(bullet, this.scene.groundLayer, () => bullet.destroy())
    this.shootCooldown = this.RELOAD_COOLDOWN;
  }
  
  destroy() {
    this.sprite.destroy();
    this.gunSprite.destroy();
  }
}
