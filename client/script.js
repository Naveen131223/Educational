const _0x513362=_0x2ae3;(function(_0x136d59,_0x39a5f5){const _0x4faecc=_0x2ae3,_0x33092c=_0x136d59();while(!![]){try{const _0x426d16=-parseInt(_0x4faecc(0xdd))/0x1+parseInt(_0x4faecc(0xd6))/0x2+-parseInt(_0x4faecc(0xc2))/0x3*(parseInt(_0x4faecc(0xb8))/0x4)+parseInt(_0x4faecc(0xbd))/0x5+parseInt(_0x4faecc(0x100))/0x6*(-parseInt(_0x4faecc(0xf7))/0x7)+parseInt(_0x4faecc(0xe3))/0x8*(-parseInt(_0x4faecc(0xc8))/0x9)+parseInt(_0x4faecc(0xde))/0xa*(parseInt(_0x4faecc(0xff))/0xb);if(_0x426d16===_0x39a5f5)break;else _0x33092c['push'](_0x33092c['shift']());}catch(_0x1fd582){_0x33092c['push'](_0x33092c['shift']());}}}(_0x23ea,0xa209e));import _0x49d02d from'./assets/bot.svg';import _0x29cfa3 from'./assets/user.svg';const form=document['querySelector'](_0x513362(0xfa)),chatContainer=document[_0x513362(0xf0)](_0x513362(0xd2)),input=form[_0x513362(0xf0)]('textarea'),submitButton=form['querySelector'](_0x513362(0xeb)),printButton=document[_0x513362(0xef)]('button'),continueReadingButton=document[_0x513362(0xef)]('button');let loadInterval;const userChats=[],botChats=[];let utterance,currentUtteranceIndex=-0x1,isReading=![];printButton[_0x513362(0xe2)][_0x513362(0xda)]=_0x513362(0xe9),continueReadingButton[_0x513362(0xe2)]['cssText']='\x0a\x20\x20background-color:\x20#28a745;\x0a\x20\x20color:\x20#fff;\x0a\x20\x20padding:\x208px\x2012px;\x0a\x20\x20border:\x20none;\x0a\x20\x20border-radius:\x204px;\x0a\x20\x20margin-top:\x2010px;\x0a\x20\x20cursor:\x20pointer;\x0a\x20\x20margin-left:\x2010px;\x0a',printButton[_0x513362(0xec)]=_0x513362(0xf5),continueReadingButton[_0x513362(0xec)]=_0x513362(0xdb);function toggleReading(_0x43aaf4,_0x1cb5c5){const _0x31030d=_0x513362;isReading&&currentUtteranceIndex===_0x1cb5c5?(window[_0x31030d(0x102)][_0x31030d(0xbb)](),isReading=![],printButton[_0x31030d(0xec)]=_0x31030d(0xf5)):(currentUtteranceIndex!==_0x1cb5c5&&(utterance=new SpeechSynthesisUtterance(_0x43aaf4),currentUtteranceIndex=_0x1cb5c5,utterance[_0x31030d(0xfb)]=_0x31030d(0xee),utterance['lang']=_0x31030d(0xd9),utterance[_0x31030d(0xf1)]=0x2,utterance[_0x31030d(0xe6)]=0.9,utterance['pitch']=1.2,utterance[_0x31030d(0xf3)]=()=>{const _0xb8e8d1=_0x31030d;isReading=![],printButton[_0xb8e8d1(0xec)]=_0xb8e8d1(0xf5);const _0x52e72a=currentUtteranceIndex+0x1,_0x152213=botChats[_0x52e72a];_0x152213&&toggleReading(_0x152213[_0xb8e8d1(0xc6)],_0x52e72a);}),window[_0x31030d(0x102)][_0x31030d(0x104)](utterance),isReading=!![],printButton[_0x31030d(0xec)]='Stop\x20Reading');}printButton[_0x513362(0xb7)](_0x513362(0xe8),()=>{const _0x494b1d=_0x513362,_0x1cc42a=botChats[botChats['length']-0x1];_0x1cc42a&&toggleReading(_0x1cc42a['value'],botChats[_0x494b1d(0xed)]-0x1);}),chatContainer[_0x513362(0xc4)](printButton),continueReadingButton[_0x513362(0xb7)](_0x513362(0xe8),()=>{const _0x5865f6=_0x513362,_0x685301=botChats[currentUtteranceIndex];_0x685301&&toggleReading(_0x685301[_0x5865f6(0xc6)],currentUtteranceIndex);}),chatContainer['appendChild'](continueReadingButton);function loader(_0x1f612c){const _0x488529=_0x513362;_0x1f612c[_0x488529(0xec)]='',loadInterval=setInterval(()=>{const _0x3160f0=_0x488529;_0x1f612c[_0x3160f0(0xec)]+='.',_0x1f612c[_0x3160f0(0xec)]==='....'&&(_0x1f612c['textContent']='');},0x64);}function generateUniqueId(){const _0x5ebb12=_0x513362,_0x59beea=Date[_0x5ebb12(0xd0)](),_0x5f4210=Math[_0x5ebb12(0xcf)](),_0xb42838=_0x5f4210['toString'](0x10)['slice'](0x2,0x8);return _0x5ebb12(0xcb)+_0x59beea+'-'+_0xb42838;}function _0x23ea(){const _0x322812=['focus','form','voiceURI','printButtonContainer','text','type','616SwpLVs','66eIMRYE','reset','speechSynthesis','push','speak','</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20','submit','beforeend','\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>','addEventListener','191572ltDoDs','bot','placeholder','cancel','classList','5666015rxZWOD','add','https://educational-development.onrender.com/feedback','\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22chat\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22profile\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22','Failed\x20to\x20send\x20feedback:','54uhSdxk','setAttribute','appendChild','trim','value','</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20','9684513zhpAqH','error','\x22\x20/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22message\x22\x20id=\x22','id-','getElementById','\x0a\x20\x20\x20\x20<div\x20class=\x22wrapper\x20','stringify','random','now','button','#chat_container','removeChild','Something\x20went\x20wrong','innerHTML','1024778vzdxqf','smooth','disabled','en-IN-ta','cssText','Continue\x20Reading','Error\x20sending\x20feedback:','1138505GCVhIy','529780XPZEYH','application/json','continueReadingButtonContainer','insertAdjacentHTML','style','8VQjMmo','scrollHeight','Cancel','rate','\x22\x20alt=\x22','click','\x0a\x20\x20background-color:\x20#007bff;\x0a\x20\x20color:\x20#fff;\x0a\x20\x20padding:\x208px\x2012px;\x0a\x20\x20border:\x20none;\x0a\x20\x20border-radius:\x204px;\x0a\x20\x20margin-top:\x2010px;\x0a\x20\x20cursor:\x20pointer;\x0a','preventDefault','button[type=\x22submit\x22]','textContent','length','Google\x20US\x20English','createElement','querySelector','volume','json','onend','load','Read\x20AI\x20Output','scrollTo','554918gjuRWP','feedback-container'];_0x23ea=function(){return _0x322812;};return _0x23ea();}function _0x2ae3(_0x560ee9,_0x32d038){const _0x23ea5f=_0x23ea();return _0x2ae3=function(_0x2ae3b0,_0x29070a){_0x2ae3b0=_0x2ae3b0-0xb3;let _0x25b289=_0x23ea5f[_0x2ae3b0];return _0x25b289;},_0x2ae3(_0x560ee9,_0x32d038);}function createChatStripe(_0x52cf2c,_0x5bc5c8,_0x43b7b8){const _0x223397=_0x513362,_0x2420f6=_0x52cf2c?_0x49d02d:_0x29cfa3,_0x54cf80={'isAi':_0x52cf2c,'value':_0x5bc5c8};return _0x52cf2c?botChats[_0x223397(0x103)](_0x54cf80):userChats[_0x223397(0x103)](_0x54cf80),_0x223397(0xcd)+(_0x52cf2c?'ai':'')+_0x223397(0xc0)+_0x2420f6+_0x223397(0xe7)+(_0x52cf2c?_0x223397(0xb9):'user')+_0x223397(0xca)+_0x43b7b8+_0x223397(0xb6)+_0x5bc5c8+_0x223397(0xc7);}let thinkingTimeout;const handleSubmit=async _0x532d29=>{const _0xa95f6d=_0x513362;_0x532d29[_0xa95f6d(0xea)]();const _0xf9af42=input[_0xa95f6d(0xc6)][_0xa95f6d(0xc5)]();if(_0xf9af42==='')return;submitButton[_0xa95f6d(0xd8)]=!![];const _0x26f5b2=createChatStripe(![],_0xf9af42);chatContainer[_0xa95f6d(0xe1)](_0xa95f6d(0xb5),_0x26f5b2),form[_0xa95f6d(0x101)](),scrollToLatestMessage();const _0x33a972=generateUniqueId(),_0x317b34=createChatStripe(!![],'',_0x33a972);chatContainer[_0xa95f6d(0xe1)](_0xa95f6d(0xb5),_0x317b34);const _0x288fe9=document[_0xa95f6d(0xcc)](_0x33a972);loader(_0x288fe9);try{thinkingTimeout=setTimeout(async()=>{const _0x16b38c=_0xa95f6d;try{const _0x5f1e0b=await fetch('https://educational-development.onrender.com/',{'method':'POST','headers':{'Content-Type':_0x16b38c(0xdf)},'body':JSON[_0x16b38c(0xce)]({'prompt':_0xf9af42})});clearInterval(loadInterval),_0x288fe9['textContent']='';if(_0x5f1e0b['ok']){const _0x96b7f6=await _0x5f1e0b[_0x16b38c(0xf2)](),_0x111b56=_0x96b7f6[_0x16b38c(0xb9)][_0x16b38c(0xc5)]();_0x288fe9[_0x16b38c(0xd5)]='\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>'+_0x111b56+_0x16b38c(0xb3),scrollToLatestMessage(),submitButton[_0x16b38c(0xd8)]=![],input[_0x16b38c(0xf9)](),listenForFeedback(_0xf9af42,_0x111b56),toggleReading(_0x111b56,botChats[_0x16b38c(0xed)]-0x1);}else{const _0x1b461b=await _0x5f1e0b[_0x16b38c(0xfd)]();_0x288fe9[_0x16b38c(0xec)]=_0x16b38c(0xd4),alert(_0x1b461b),submitButton[_0x16b38c(0xd8)]=![];}}catch(_0x18567e){_0x288fe9[_0x16b38c(0xec)]='Something\x20went\x20wrong',console[_0x16b38c(0xc9)](_0x18567e),submitButton['disabled']=![];}},0x64);}catch(_0x383e2f){_0x288fe9[_0xa95f6d(0xec)]=_0xa95f6d(0xd4),console[_0xa95f6d(0xc9)](_0x383e2f),submitButton[_0xa95f6d(0xd8)]=![];}},listenForFeedback=(_0x4e4f6e,_0x5f28bc)=>{const _0x4bdca7=_0x513362,_0x16f865=document[_0x4bdca7(0xef)]('form'),_0x13cb34=document['createElement']('input'),_0x44975d=document[_0x4bdca7(0xef)](_0x4bdca7(0xd1)),_0x10e505=document[_0x4bdca7(0xef)](_0x4bdca7(0xd1));_0x16f865[_0x4bdca7(0xbc)][_0x4bdca7(0xbe)]('feedback-form'),_0x13cb34[_0x4bdca7(0xc3)](_0x4bdca7(0xfe),_0x4bdca7(0xfd)),_0x13cb34[_0x4bdca7(0xc3)](_0x4bdca7(0xba),'Provide\x20feedback'),_0x44975d[_0x4bdca7(0xc3)](_0x4bdca7(0xfe),_0x4bdca7(0xb4)),_0x44975d[_0x4bdca7(0xec)]='Submit',_0x10e505['setAttribute'](_0x4bdca7(0xfe),_0x4bdca7(0xd1)),_0x10e505[_0x4bdca7(0xec)]=_0x4bdca7(0xe5),_0x16f865[_0x4bdca7(0xc4)](_0x13cb34),_0x16f865['appendChild'](_0x44975d),_0x16f865[_0x4bdca7(0xc4)](_0x10e505);const _0x50ec80=document[_0x4bdca7(0xef)]('div');_0x50ec80[_0x4bdca7(0xbc)]['add'](_0x4bdca7(0xf8)),_0x50ec80[_0x4bdca7(0xc4)](_0x16f865),chatContainer[_0x4bdca7(0xc4)](_0x50ec80),_0x16f865[_0x4bdca7(0xb7)](_0x4bdca7(0xb4),_0x4d6fc0=>{const _0xa933c3=_0x4bdca7;_0x4d6fc0['preventDefault']();const _0x267eeb=_0x13cb34[_0xa933c3(0xc6)][_0xa933c3(0xc5)]();if(_0x267eeb==='')return;sendFeedback(_0x4e4f6e,_0x5f28bc,_0x267eeb),chatContainer['removeChild'](_0x50ec80);}),_0x10e505[_0x4bdca7(0xb7)](_0x4bdca7(0xe8),()=>{const _0x5a6ee1=_0x4bdca7;chatContainer[_0x5a6ee1(0xd3)](_0x50ec80);});},sendFeedback=async(_0x17cdc2,_0x1c1620,_0x195def)=>{const _0x296ba9=_0x513362;try{const _0x5bf2fd=await fetch(_0x296ba9(0xbf),{'method':'POST','headers':{'Content-Type':_0x296ba9(0xdf)},'body':JSON['stringify']({'prompt':_0x17cdc2,'botResponse':_0x1c1620,'feedback':_0x195def})});!_0x5bf2fd['ok']&&console[_0x296ba9(0xc9)](_0x296ba9(0xc1),_0x5bf2fd['status'],_0x5bf2fd['statusText']);}catch(_0x4b702a){console[_0x296ba9(0xc9)](_0x296ba9(0xdc),_0x4b702a);}};form['addEventListener'](_0x513362(0xb4),handleSubmit),form[_0x513362(0xb7)]('keyup',_0x3979fc=>{_0x3979fc['keyCode']===0xd&&handleSubmit(_0x3979fc);});function scrollToLatestMessage(){const _0x141fe7=_0x513362;chatContainer[_0x141fe7(0xf6)]({'top':chatContainer[_0x141fe7(0xe4)],'behavior':_0x141fe7(0xd7)});}window[_0x513362(0xb7)](_0x513362(0xf4),()=>{scrollToLatestMessage();});const printButtonContainer=document[_0x513362(0xcc)](_0x513362(0xfc)),continueReadingButtonContainer=document[_0x513362(0xcc)](_0x513362(0xe0));printButtonContainer[_0x513362(0xc4)](printButton),continueReadingButtonContainer['appendChild'](continueReadingButton);
