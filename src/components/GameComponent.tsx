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
  const gameElementRef = useRef<HTMLDivElement | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [currentHp, setCurrentHp] = useState(3)
  const [maxHp, setMaxHp] = useState(3)
  const [speed, setSpeed] = useState(300)
  const [reloadSpeed, setReloadSpeed] = useState(40)
  const [gameOver, setGameOver] = useState(false)
  const [levelCompleted, setLevelCompleted] = useState(false)
  const [demonsFelled, setDemonsFelled] = useState(0)
  const [demonsFelledLevel, setDemonsFelledLevel] = useState(0)
  const [demonsToFell, setDemonsToFell] = useState(0)
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
  const [minimapTransparent, setMinimapTransparent] = useState(true)
  const [startButtonClicked, setStartButtonClicked] = useState(false)

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
      setCurrentHp(hp)
      setMaxHp(max)

      if (hp > currentHp) {
        toggle1s(setHpUp)
      }
    };

    const speedListener = (speed: number) => {
      setSpeed(speed)

      toggle1s(setSpeedUp)
    }

    const reloadSpeedListener = (rSpeed: number) => {
      setReloadSpeed(rSpeed)

      toggle1s(setReloadSpeedUp)
    }

    const demonsFelledListener = (felled: number) => {
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

    const levelCompletedListener = () => {
      setLevelCompleted(true)
    }

    const levelChangedListener = (newLevel: number) => {
      setLevel(newLevel)
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

    const startButtonClickedListener = () => {
      setStartButtonClicked(true)
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
    EventEmitter.on('levelCompleted', levelCompletedListener);
    EventEmitter.on('levelChanged', levelChangedListener);
    EventEmitter.on('damage', damageListener);
    EventEmitter.on('pause', pausedListener);
    EventEmitter.on('nowPlaying', nowPlayingListener)
    EventEmitter.on('startButtonClicked', startButtonClickedListener)

    if (gameElementRef?.current) {
      gameElementRef.current.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopImmediatePropagation()
      })
    }

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
      EventEmitter.off('levelCompleted', levelCompletedListener);
      EventEmitter.off('levelChanged', levelChangedListener);
      EventEmitter.off('pause', pausedListener);
      EventEmitter.off('nowPlaying', nowPlayingListener)
      EventEmitter.off('startButtonClicked', startButtonClickedListener)
    };
  }, [])

  // Define the function to generate the tweet URL
  const tweetStats = () => {
    const message = `My last DEMON FELLER run:\n
      Highest Level: ${level} \n
      HP: ${currentHp}/${maxHp} \n
      Speed: ${Math.round(speed / 24)}MPH \n
      Damage: ${damage || 1} \n
      Rate of Fire: ${formatReloadSpeed(reloadSpeed)} \n
      Stun: ${formatReloadSpeed(stun)} \n
      Demons Felled: ${demonsFelled}`;

    const encodedMessage = encodeURIComponent(message);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;

    return tweetUrl;
  };

  const formatReloadSpeed = (rspd: number) => Number((rspd/1000).toPrecision(2))+'s'

  const onMinimapSizeChange = (xy: string, transparent?: boolean) => {
    EventEmitter.emit('resizeMinimap', xy, transparent)
  }

  const stats = <div className='stats'>
    <div className={classNames('health shado bar', { 
      rainbowShake: hpUp, 
      damaged: currentHp < maxHp && currentHp > (maxHp||3)/3, 
      critical: currentHp <= (maxHp||3)/3 
    })}>
      HP:
      <div className={classNames('stat')}> {currentHp}/{maxHp}</div>
    </div>
    <div className={classNames('speed shado bar', { rainbowShake: speedUp })}>
      SPEED:
      <div className={classNames('stat')}> {Math.round(speed / 24)}MPH</div>
    </div>
    <div className={classNames('damage shado bar', { rainbowShake: damageUp })}>
      DMG:
      <div className={classNames('stat')}>{damage || 1}</div>
    </div>
    <div className={classNames('reloadSpeed shado bar', { rainbowShake: reloadSpeedUp })}>
      R.O.F.:
      <div className={classNames('stat')}>{formatReloadSpeed(reloadSpeed)}</div>
    </div>
    <div className={classNames('stun shado bar', { rainbowShake: stunUp })}>
      STUN:
      <div className={classNames('stat')}>{formatReloadSpeed(stun)}</div>
    </div>
    <div className={classNames('demonsFelled shado bar', { rainbowShake: fallenFelled })}>
      LV {level}:
      <div className='stat'>{demonsFelledLevel}/{demonsToFell}</div>
    </div>
    <div className={classNames('demonsFelled shado bar', { rainbowShake: fallenFelled })}>
      FELLED:
      <div className={classNames('stat')}>{demonsFelled}</div>
    </div>
  </div>
  const restartButton = <button className='btn shado restart' onClick={() => {
    // (gameRef?.current?.scene.getScene('GameScene') as GameScene).restart()
    if (!window.confirm('Are you sure you want to restart?')) return
    setGameOver(false)
    setPaused(false)
    window.location.reload()
  }}>RESTART GAME</button>
  return <>
    <div style={{visibility: 'hidden', position: 'absolute'}}>.</div>
    <div id="game-container" ref={gameElementRef} style={{ width: '100%', height: '100%' }} />
    {!startButtonClicked && <div className='pregame-audio shado'>
      <AudioControls nowPlaying='' />
    </div>}
    {gameStarted && stats}
    {temporaryNowPlaying && <div className='now-playing-container'>
      <div className='now-playing shado'>
        🔊 {temporaryNowPlaying.replace(/_/g, ' ').replace(/-/g, ' - ').toUpperCase()} 🎵
      </div>
    </div>}
    {levelCompleted && <div className='level-up overlay'>
      <div className='notice'>
        <h1>LEVEL {level} COMPLETE!</h1>
        {stats}
        <p className='ty'>
          BUT HELL IS NOT YET EMPTY
        </p>
        <button className='big-btn shado continue' onClick={() => {
          setLevelCompleted(false)
          EventEmitter.emit('goToNextLevel')
        }}>GO DEEPER</button>
      </div>
    </div>}
    {gameOver && <div className='game-over shado overlay'>
      <div className='notice'>
        <h1>GAME OVER</h1>
        <p className='ty'>
          THANK YOU FOR YOUR SERVICE
        </p>
        {restartButton}
        <div className='after-action-report'>
          {stats}
          <button className='btn shado tweet-em' onClick={() => window.open(tweetStats(), '_blank')}>TWEET 'EM</button>
        </div>
      </div>
    </div>}
    {paused && <div className='pause-menu shado overlay'>
      <div className='notice'>
        <h1>GAME PAUSED</h1>
        <AudioControls nowPlaying={persistentNowPlaying} />
        <div className='wrapperupper'>
          <div className='sxn shado'>
            <h2>CONTROLS:</h2>
            <p>WASD or arrow keys: move</p>
            <p>Click: shoot</p>
          </div>
          <div className='sxn shado'>
            <h2>MINIMAP:</h2>
            <div className='x'>
              <input type="checkbox" style={{ transform: 'scale(1.75)', marginRight: 16 }} checked={minimapTransparent} 
                onChange={(e) => {
                  setMinimapTransparent(old => !minimapTransparent)
                  onMinimapSizeChange('', !minimapTransparent)
                }} />
              <span>SEE-THRU</span>
            </div>
            <div className='x'>
              <select className='shado' style={{ padding: '8px 16px' }} onChange={(e) => onMinimapSizeChange(e.currentTarget.value, minimapTransparent)}>
                <option value='small'>SMALL (1/6)</option>
                <option value='medium'>MEDIUM (1/4)</option>
                <option value='large'>LARGE (1/3)</option>
              </select>
            </div>
          </div>
          <div className='sxn shado'>
            <h2>STATS:</h2>
            {stats}
          </div>
          <div className='sxn row'>
            <div className='btn shado resume' onClick={onUnpause}>RESUME</div>
          </div>
          <div className='sxn row'>
            {restartButton}
          </div>
        </div>
      </div>
    </div>}
  </>;
};
