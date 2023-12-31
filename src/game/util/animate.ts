const animations = {
  wobbleSprite: (me: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, minRotation: number = -10, maxRotation: number = 10, duration = 2000, randomDuration = true, repeat = true) => {
    if (!me) return
    me.tweens.add({
      targets: sprite,
      rotation: {
        value: { from: Phaser.Math.DegToRad(sprite.rotation + minRotation), to: Phaser.Math.DegToRad(sprite.rotation + maxRotation) },
        duration: duration + (randomDuration ? Math.random() * 1000 : 0),
        yoyo: true,  // Go back to original position after reaching target
        repeat: repeat ? -1 : false,  // Repeat forever
        ease: 'Sine.easeInOut'  // Use a sine wave for smooth start and end
      },
    });
  },
  enshadow: (sprite: Phaser.GameObjects.Sprite) => {
    sprite.preFX?.addShadow(-5, -5, 0.01, 0.5, 0x0)
  },
  fadeInOut: (me: Phaser.Scene, targets: Phaser.GameObjects.Sprite[], duration: number, to = 1) => {
    me.tweens.add({
      targets,
      alpha: {
        from: 0,
        to
      },
      yoyo: true,
      duration,
      ease: 'Sine.easeInOut',
      repeat: -1
    })
  }
}

export default animations
