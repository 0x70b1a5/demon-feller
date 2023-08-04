import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import colors from '../constants/colors'
import EventEmitter from '../EventEmitter';

export class MainMenuScene extends Phaser.Scene {
  private rexUI!: RexUIPlugin
  smallSize = window.innerHeight <= 800

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    // Add title image
    const demon = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'DEMON', {
        fontFamily: 'pkmn', color: 'white', fontSize: this.smallSize ? 72 : 128
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor: {
        centerY: this.smallSize ? 'center-150' : 'center-300'
      },
      x: 2*+this.game.config.width
    })
    .setOrigin(0.5, 0.5)
    .layout()

    const feller = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'FELLER', {
        fontFamily: 'pkmn', color: 'white', fontSize: 128
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor: {
        centerY: this.smallSize ? 'center-75' : 'center-150'
      },

      x: 2*-this.game.config.width
    })
    .setOrigin(0.5, 0.5)
    .layout()

    // Add play button
    const playButton = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, colors.TEXTBOX_BG_COLOR),
  
      text: this.add.text(0, 0, 'PLAY', {
        fontFamily: 'pkmn', color: colors.TEXT_COLOR, fontSize: 72
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor:{ 
        centerX: 'center',
        centerY:'center'
      }
    })
    .setInteractive()
    .setOrigin(0.5, 0.5)
    .layout()
    .setVisible(false)

    playButton.on('pointerup', () => {
      // Transition to game scene
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
      EventEmitter.emit('gameStarted')
    }, this);

    const dedicated = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'DEDICATED TO\nTHE SACRED HEART OF JESUS\n& THE IMMACULATE HEART OF MARY', {
        fontFamily: 'pkmn', color: 'white', fontSize: 24, align: 'center', lineSpacing: 16
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',
    })
    .setVisible(false)

    const presented = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'A LOVECRYPT PRODUCTION', {
        fontFamily: 'pkmn', color: 'white', fontSize: 36
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',
    })
    .setVisible(false)

    const sizer = this.rexUI.add.sizer({
      orientation: 'y',
      anchor: {
        centerX: 'center',
        centerY: 'bottom-150%'
      },
      space: {
        item: 10
      }
    })
    .add(dedicated)
    .add(presented)
    .layout()

    const beginButton = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, colors.TEXTBOX_BG_COLOR),
  
      text: this.add.text(0, 0, 'START', {
        fontFamily: 'pkmn', color: colors.TEXT_COLOR, fontSize: 72
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor:{ 
        centerX: 'center',
        centerY:'center'
      }
    })
    .setInteractive()
    .setOrigin(0.5, 0.5)
    .layout()

    beginButton.on('pointerup', () => {
      beginButton.destroy()

      EventEmitter.emit('startButtonClicked')
      EventEmitter.emit('playSound', 'bat')
      this.tweens.add({
        targets: demon,
        x: this.cameras.main.centerX,
        ease: 'Elastic',
        duration: 700,
        onComplete: () => {
          EventEmitter.emit('playSound', 'bat')
  
          this.tweens.add({
            targets: feller,
            x: this.cameras.main.centerX,
            ease: 'Elastic',
            duration: 700,
            onComplete: () => {
              EventEmitter.emit('playSound', 'magic')
              playButton.setVisible(true)
              presented.setVisible(true)
              dedicated.setVisible(true)
              this.cameras.main.flash(1000)
            }
          });
        }
      });
    })
  }
}
