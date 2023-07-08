import React from 'react';
import logo from './logo.svg';
import './App.scss';
import { GameComponent } from './components/GameComponent';

function App() {
  return (
    <div className='container h-screen'>
        <GameComponent />
    </div>
  );
}

export default App;
