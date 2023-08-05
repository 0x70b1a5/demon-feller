import React, { useEffect, useState } from 'react';
import EventEmitter from '../game/EventEmitter';
import classNames from 'classnames';

interface AudioControlsProps {
  nowPlaying: string
}

const AudioControls = ({ nowPlaying }: AudioControlsProps) => {
  const prefix = '__demonfeller-'
  const DEFAULT_VOLUME = 0.5
  let startMuted: any = localStorage.getItem(prefix+'isMuted') === 'true'
  let startMusicVolume: any = +localStorage.getItem(prefix+'musicVolume')!
  let startSfxVolume: any = +localStorage.getItem(prefix+'sfxVolume')!
  
  startMusicVolume = isNaN(startMusicVolume) ? DEFAULT_VOLUME : startMusicVolume
  startSfxVolume = isNaN(startSfxVolume) ? DEFAULT_VOLUME : startSfxVolume

  const [isMuted, setMuted] = useState(startMuted);
  const [musicVolume, setMusicVolume] = useState(startMusicVolume);
  const [sfxVolume, setSfxVolume] = useState(startSfxVolume);
  const [rwdFwdDisabled, setRwdFwdDisabled] = useState(false)

  const handleMute = () => {
    const nextMuteState = !isMuted;
    setMuted(nextMuteState);
    localStorage.setItem(prefix+'isMuted', String(nextMuteState))
    EventEmitter.emit('muteChanged', nextMuteState);
  };

  const handleMusicVolumeChange = (event: any) => {
    const volume = event.target.value;
    setMusicVolume(volume);
    localStorage.setItem(prefix+'musicVolume', volume)
    EventEmitter.emit('musicVolumeChanged', volume);
  };

  const handleSfxVolumeChange = (event: any) => {
    const volume = event.target.value;
    setSfxVolume(volume);
    localStorage.setItem(prefix+'sfxVolume', volume)
    EventEmitter.emit('sfxVolumeChanged', volume);
  };

  const handleRewind = (event: any) => {
    setRwdFwdDisabled(true)
    EventEmitter.emit('musicRewind');
    setTimeout(() => setRwdFwdDisabled(false), 1000)
  };

  const handleForward = (event: any) => {
    setRwdFwdDisabled(true)
    EventEmitter.emit('musicForward');
    setTimeout(() => setRwdFwdDisabled(false), 1000)
  };

  return (
    <div className='audio-controls'>

      <div className='controls'>
        <h2> 
          AUDIO: 
        </h2>
        
        <div className='shado slider'>
          <label>Music:</label>
          <input
            type='range'
            min='0'
            max='1'
            step={0.01}
            value={musicVolume}
            onChange={handleMusicVolumeChange}
          />
        </div>

        <div className='shado slider'>
          <label>SFX:</label>
          <input
            type='range'
            min='0'
            max='1'
            step={0.01}
            value={sfxVolume}
            onChange={handleSfxVolumeChange}
          />
        </div>
        
        <button className={classNames('btn mute shado', { isMuted })} onClick={handleMute}>
          {isMuted ? 'Unmute' : 'Mute'} All
        </button>
      </div>

      {nowPlaying && <div className='now-playing-mini'>
        <p>🔊 NOW PLAYING: {nowPlaying.replace(/_/g, ' ').replace(/-/g, ' - ').toUpperCase()} 🎵</p>
          
        {/* <button className="btn rwd" disabled={rwdFwdDisabled} onClick={handleRewind}>
          ⏪
        </button> */}

        <button className="btn fwd shado" disabled={rwdFwdDisabled} onClick={handleForward}>
          Skip ⏩
        </button>
      </div>}
    </div>
  );
};

export default AudioControls;
