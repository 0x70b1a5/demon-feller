import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import colors from '../constants/colors'
import EventEmitter from '../EventEmitter';
import constants from '../constants/colors';

export class MainMenuScene extends Phaser.Scene {
  private rexUI!: RexUIPlugin
  smallSize = window.innerHeight <= 800

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const fontSize = this.smallSize ? 72 : 128
    // Add title image
    const demon = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'DEMON', {
        fontFamily: constants.FONT_PS2P, color: 'white', fontSize
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor: {
        top: '5%'
      },

      x: 2*+this.game.config.width
    })
    .setOrigin(0.5, 0.5)
    .layout()

    const feller = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'FELLER', {
        fontFamily: constants.FONT_PS2P, color: 'white', fontSize
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor: {
        top: '5%+'+fontSize
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
        fontFamily: constants.FONT_PS2P, color: colors.TEXT_COLOR, fontSize: fontSize/2
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
  
      text: this.add.text(0, 0, 'DEDICATED TO\nTHE SACRED HEART OF JESUS\nTHE IMMACULATE HEART OF MARY\nST DAMIAN OF MOLOKAI\n& VICTIMS OF SUICIDE', {
        fontFamily: constants.FONT_PS2P, color: 'white', fontSize: 20, align: 'center', lineSpacing: 12
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
        fontFamily: constants.FONT_PS2P, color: 'white', fontSize: 36
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
        fontFamily: constants.FONT_PS2P, color: colors.TEXT_COLOR, fontSize: 72
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
