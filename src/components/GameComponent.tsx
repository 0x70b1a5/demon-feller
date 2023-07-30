import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/scenes/GameScene';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { MainMenuScene } from '../game/scenes/MainMenuScene';
import { BootScene } from '../game/scenes/BootScene';
import EventEmitter from '../game/EventEmitter';
import classNames from 'classnames';
import { UIScene } from '../game/scenes/UIScene';
import AudioControls from './AudioControls';
import { AudioScene } from '../game/scenes/AudioScene';

export const GameComponent: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [currentHp, setCurrentHp] = useState(3)
  const [maxHp, setMaxHp] = useState(3)
  const [speed, setSpeed] = useState(300)
  const [reloadSpeed, setReloadSpeed] = useState(40)
  const [gameOver, setGameOver] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const [demonsFelled, setDemonsFelled] = useState(0)
  const [demonsFelledLevel, setDemonsFelledLevel] = useState(0)
  const [demonsToFell, setDemonsToFell] = useState(0)
  const [minimap, setMinimap] = useState<number[][]>([])
  const [level, setLevel] = useState(1)
  const [damage, setDamage] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [fallenFelled, setFallenFelled] = useState(false)
  const [reloadSpeedUp, setReloadSpeedUp] = useState(false)
  const [damageUp, setDamageUp] = useState(false)
  const [speedUp, setSpeedUp] = useState(false)
  const [hpUp, setHpUp] = useState(false)
  const [paused, setPaused] = useState(false)
  const [stun, setStun] = useState(0)
  const [stunUp, setStunUp] = useState(false)
  const [temporaryNowPlaying, setNowPlaying] = useState('')
  const [persistentNowPlaying, setPersistentNowPlaying] = useState('')

  const minimapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: windowSize.width,
      height: windowSize.height,
      scene: [BootScene, MainMenuScene, GameScene, UIScene, AudioScene],
      physics: {
        default: 'arcade',
      },
      // pixelArt: true, // enable for no antialiasing
      plugins: {
        scene: [{
          key: 'rexUI',
          plugin: RexUIPlugin,
          mapping: 'rexUI'
        }]
      },
      audio: {
        disableWebAudio: true 
      },
      fps: {
        target: 60,
        limit: 60,
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  const toggle1s = (fn: (b: boolean) => void): void => {
    fn(true)
    setTimeout(() => fn(false), 1000)
  }

  const onUnpause = () => {
    EventEmitter.emit('unpause')
    setPaused(false)
  }

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.scale.resize(windowSize.width, windowSize.height);
    }
  }, [windowSize]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const healthListener = ([hp, max]: [number, number]) => {
      console.log('health event', hp, max)
      setCurrentHp(hp)
      setMaxHp(max)

      if (hp > currentHp) {
        toggle1s(setHpUp)
      }
    };

    const speedListener = (speed: number) => {
      console.log('speed event', speed)
      setSpeed(speed)

      toggle1s(setSpeedUp)
    }

    const reloadSpeedListener = (rSpeed: number) => {
      console.log('rspeed event', rSpeed)
      setReloadSpeed(rSpeed)

      toggle1s(setReloadSpeedUp)
    }

    const demonsFelledListener = (felled: number) => {
      console.log('felled event', felled)
      setDemonsFelled(felled)

      if (felled > 0) {
        // toggle the css class on the element
        toggle1s(setFallenFelled)
      }
    }

    const damageListener = (d: number) => {
      setDamage(d)

      toggle1s(setDamageUp)
    }

    const demonFelledLevelListener = (demons: number) => {
      setDemonsFelledLevel(demons)
    }

    const demonsToFellListener = (demons: number) => {
      setDemonsToFell(demons)
    }

    const stunListener = (newStun: number) => {
      setStun(newStun)
      toggle1s(setStunUp)
    }

    const gameOverListener = () => {
      setGameOver(true)
    }

    const levelUpListener = (newLevel: number) => {
      setLevel(newLevel)
      setLevelUp(true)
    }

    const gameStartedListener = () => {
      setGameStarted(true)
    }

    const pausedListener = () => {
      setPaused(true)
    }

    const nowPlayingListener = (song: string) => {
      setNowPlaying(old => song)
      setPersistentNowPlaying(old => song)
      setTimeout(() => {
        setNowPlaying(old => '')
      }, 5000)
    }
    
    EventEmitter.on('gameStarted', gameStartedListener);
    EventEmitter.on('health', healthListener);
    EventEmitter.on('speed', speedListener);
    EventEmitter.on('reloadSpeed', reloadSpeedListener);
    EventEmitter.on('gameOver', gameOverListener);
    EventEmitter.on('demonsFelledLevel', demonFelledLevelListener);
    EventEmitter.on('demonsFelled', demonsFelledListener);
    EventEmitter.on('demonsToFell', demonsToFellListener);
    EventEmitter.on('stun', stunListener);
    EventEmitter.on('levelUp', levelUpListener);
    EventEmitter.on('damage', damageListener);
    EventEmitter.on('pause', pausedListener);
    EventEmitter.on('nowPlaying', nowPlayingListener)

    return () => {
      EventEmitter.off('gameStarted', gameStartedListener);
      EventEmitter.off('health', healthListener);
      EventEmitter.off('speed', speedListener);
      EventEmitter.off('damage', damageListener);
      EventEmitter.off('reloadSpeed', reloadSpeedListener);
      EventEmitter.off('gameOver', gameOverListener);
      EventEmitter.off('demonsFelledLevel', demonFelledLevelListener);
      EventEmitter.off('demonsFelled', demonsFelledListener);
      EventEmitter.off('demonsToFell', demonsToFellListener);
      EventEmitter.off('stun', stunListener);
      EventEmitter.off('levelUp', levelUpListener);
      EventEmitter.off('pause', pausedListener);
      EventEmitter.off('nowPlaying', nowPlayingListener)
    };
  }, [])

  // Define the function to generate the tweet URL
  const tweetStats = () => {
    const message = `Check out my stats! \n
      Health: ${currentHp}/${maxHp} \n
      Speed: ${Math.round(speed / 24)}MPH \n
      Damage: ${damage || 1} \n
      Rate of Fire: ${Number(40 / (reloadSpeed || 40)).toPrecision(3)}x \n
      Stun: ${Number(stun / 100).toPrecision(3)}x \n
      Demons Felled (Level): ${demonsFelledLevel}/${demonsToFell} \n
      Demons Felled: ${demonsFelled}`;

    const encodedMessage = encodeURIComponent(message);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;

    return tweetUrl;
  };

  const stats = <div className='stats'>
    <div className='health bar'>
      HP:
      <div className={classNames('stat', { rainbowShake: hpUp })}> {currentHp}/{maxHp}</div>
    </div>
    <div className='speed bar'>
      SPEED:
      <div className={classNames('stat', { rainbowShake: speedUp })}> {Math.round(speed / 24)}MPH</div>
    </div>
    <div className='damage bar'>
      DMG:
      <div className={classNames('stat', { rainbowShake: damageUp })}>{damage || 1}</div>
    </div>
    <div className='reloadSpeed bar'>
      R.O.F.:
      <div className={classNames('stat', { rainbowShake: reloadSpeedUp })}>{Number(40 / (reloadSpeed || 40)).toPrecision(3)}x</div>
    </div>
    <div className='stun bar'>
      STUN:
      <div className={classNames('stat', { rainbowShake: stunUp })}>{Number(stun / 100).toPrecision(3)}x</div>
    </div>
    <div className='demonsFelled bar'>
      FELLED (LV):
      <div className='stat'>{demonsFelledLevel}/{demonsToFell}</div>
    </div>
    <div className='demonsFelled bar'>
      FELLED:
      <div className={classNames('stat', { rainbowShake: fallenFelled })}>{demonsFelled}</div>
    </div>
  </div>
  const restartButton = <button className='btn restart' onClick={() => {
    // (gameRef?.current?.scene.getScene('GameScene') as GameScene).restart()
    setGameOver(false)
    setPaused(false)
    window.location.reload()
  }}>RESTART GAME</button>
  return <>
    <div style={{visibility: 'hidden', position: 'absolute'}}>.</div>
    <div id="game-container" style={{ width: '100%', height: '100%' }} />
    {gameStarted && stats}
    {temporaryNowPlaying && <div className='now-playing-container'>
      <div className='now-playing'>
        🔊 {temporaryNowPlaying.replace(/_/g, ' ').replace(/-/g, ' - ').toUpperCase()} 🎵
      </div>
    </div>}
    {levelUp && <div className='level-up overlay'>
      <div className='notice'>
        <h1>LEVEL {level} COMPLETE!</h1>
        {stats}
        <p className='ty'>
          BUT HELL IS NOT YET EMPTY
        </p>
        <button className='big-btn continue' onClick={() => {
          setLevelUp(false)
          EventEmitter.emit('goToNextLevel')
        }}>GO DEEPER</button>
      </div>
    </div>}
    {gameOver && <div className='game-over overlay'>
      <div className='notice'>
        <h1>GAME OVER</h1>
        <p className='ty'>
          THANK YOU FOR YOUR SERVICE
        </p>
        {restartButton}
        <div className='after-action-report'>
          {stats}
          <button className='btn tweet-em' onClick={() => window.open(tweetStats(), '_blank')}>TWEET 'EM</button>
        </div>
      </div>
    </div>}
    {paused && <div className='pause-menu overlay'>
      <div className='notice'>
        <h1>GAME PAUSED</h1>
        <AudioControls nowPlaying={persistentNowPlaying} />
        <h2>CONTROLS:</h2>
        <p>WASD or arrow keys: move</p>
        <p>Click: shoot</p>
        <br/>
        <h2>STATS:</h2>
        {stats}
        <div className='btn resume' onClick={onUnpause}>RESUME</div>
        {restartButton}
      </div>
    </div>}
  </>;
};
