const clc = require("cli-color");
class logging {

  static discord(message){
  var disclog = clc.xterm(75);
  console.log(disclog("[Discord]"),message)
}
  static stream(message){
  var streamlog = clc.xterm(93);
  console.log(streamlog("[StreamActivity]"),message)
}
  static twitch(label,message){
  var twitchlog = clc.xterm(93);
  console.log(twitchlog(label),message)
}
  static minidb(message){
  var minilog = clc.xterm(80);
  console.log(minilog("[MiniDb]"),message)
}
  static youtube(message){
  var ytlog = clc.xterm(196);
  console.log(ytlog("[Youtube]"),message)
}
  static error(label,message,err=""){
  var errorlog = clc.xterm(88);
  console.log(errorlog(label),message,err)
}
} 
module.exports = logging;