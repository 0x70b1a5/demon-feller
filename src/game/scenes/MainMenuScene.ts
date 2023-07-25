import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import colors from '../constants/colors'
import EventEmitter from '../EventEmitter';

export class MainMenuScene extends Phaser.Scene {
  private rexUI!: RexUIPlugin
  bat!: Phaser.Sound.HTML5AudioSound
  magic!: Phaser.Sound.HTML5AudioSound

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const prefix = '__demonfeller-'
    let startMuted: any = localStorage.getItem(prefix+'isMuted')
    if (startMuted) startMuted = (startMuted === true || startMuted === 'true')
    let startMusicVolume: any = +localStorage.getItem(prefix+'musicVolume')!
    startMusicVolume = isNaN(startMusicVolume) ? 0.5 : startMusicVolume
    let startSfxVolume: any = +localStorage.getItem(prefix+'sfxVolume')!
    startSfxVolume = isNaN(startSfxVolume) ? 0.5 : startSfxVolume


    // Add title image
    const demon = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'DEMON', {
        fontFamily: 'pkmn', color: 'white', fontSize: 128
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor: {
        centerY: 'center-300'
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
        centerY: 'center-150'
      },

      x: 2*-this.game.config.width
    })
    .setOrigin(0.5, 0.5)
    .layout()

    this.bat = this.sound.add('bat') as Phaser.Sound.HTML5AudioSound
    this.magic = this.sound.add('magic') as Phaser.Sound.HTML5AudioSound

    this.sound.setVolume(startMusicVolume)
    this.sound.setMute(startMuted)

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

      anchor: {
        centerX: 'center',
        centerY: 'bottom-72'
      }
    })
    .layout()
    .setVisible(false)

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

      this.bat.play();
      this.tweens.add({
        targets: demon,
        x: this.cameras.main.centerX,
        ease: 'Elastic',
        duration: 700,
        onComplete: () => {
          this.bat.play();
  
          this.tweens.add({
            targets: feller,
            x: this.cameras.main.centerX,
            ease: 'Elastic',
            duration: 700,
            onComplete: () => {
              this.magic.play()
              playButton.setVisible(true)
              presented.setVisible(true)
              this.cameras.main.flash(1000)
            }
          });
        }
      });
    })
  }
}
