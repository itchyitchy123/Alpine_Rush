(function(global){
  'use strict';

  const listeners=new Set();
  let gamepadFrame=0;
  let lastGamepad=null;
  const previousButtons=[];
  const bindings=new Map([
    ['ArrowLeft','left'],['a','left'],['A','left'],
    ['ArrowRight','right'],['d','right'],['D','right'],
    ['q','spinL'],['Q','spinL'],['e','spinR'],['E','spinR'],
    ['w','frontFlip'],['W','frontFlip'],['s','backFlip'],['S','backFlip'],
    ['Shift','grab']
  ]);

  function onAction(handler){
    if(typeof handler!=='function')return()=>{};
    listeners.add(handler);
    return()=>listeners.delete(handler);
  }

  function dispatch(action,pressed,event){
    listeners.forEach(handler=>handler({action,pressed,event}));
  }
  function dispatchValue(action,value,event){listeners.forEach(handler=>handler({action,pressed:Math.abs(value)>.12,value,event}))}

  global.addEventListener('keydown',event=>{
    const action=bindings.get(event.key);
    if(action){dispatch(action,true,event);return}
    if(event.code==='Space'){event.preventDefault();dispatch('jump',true,event);return}
    if(['p','P','Escape'].includes(event.key)){event.preventDefault();dispatch('pause',true,event);return}
    if(['x','X'].includes(event.key)){dispatch('boost',true,event)}
  });

  global.addEventListener('keyup',event=>{
    const action=bindings.get(event.key);
    if(action)dispatch(action,false,event);
  });

  function pollGamepad(){
    const pad=[...(navigator.getGamepads?.()||[])].find(Boolean);
    if(pad){
      if(!lastGamepad)dispatch('gamepadConnected',true,{gamepad:pad});
      lastGamepad=pad;
      const raw=pad.axes?.[0]||0;
      dispatchValue('carve',Math.abs(raw)<.12?0:raw,{gamepad:pad});
      const pressed=i=>Boolean(pad.buttons?.[i]?.pressed);
      const edge=i=>{const now=pressed(i),was=previousButtons[i]||false;previousButtons[i]=now;return now&&!was};
      dispatch('jump',edge(0),{gamepad:pad});
      dispatch('boost',edge(1),{gamepad:pad});
      dispatch('grab',pressed(4)||pressed(5),{gamepad:pad});
      dispatch('spinL',pressed(14),{gamepad:pad});
      dispatch('spinR',pressed(15),{gamepad:pad});
      dispatch('pause',edge(9),{gamepad:pad});
    }else lastGamepad=null;
    gamepadFrame=requestAnimationFrame(pollGamepad);
  }
  if(typeof requestAnimationFrame==='function')gamepadFrame=requestAnimationFrame(pollGamepad);

  // Prevent a held carve/flip from continuing after the player tabs away.
  global.addEventListener('blur',()=>dispatch('pause',true));

  global.AlpineRushInput={onAction,hasGamepad:()=>Boolean(lastGamepad),stop:()=>cancelAnimationFrame(gamepadFrame)};
})(window);
