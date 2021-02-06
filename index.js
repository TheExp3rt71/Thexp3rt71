const Discord = require("discord.js");
const { toLowerCase } = require("ffmpeg-static");
const ytdl = require("ytdl-core");
const { MessageEmbed } = require("discord.js");
const { prefix, token } = require("./config.json");
const fs = require('fs');
const { MessageAttachment } = require("discord.js");

const Command = require('./command/command')
const Ping = require('./command/ping')
const Info = require('./command/info')
const Help = require('./command/help')
const Channel = require('./command/channel')
const Clear = require('./command/clear')
const Sondage = require('./command/sondage')
const Decompte = require('./command/decompte')
const Invite = require('./command/invite')
const Reglement = require('./command/reglement')
const client = new Discord.Client();

const queue = new Map();

client.on("ready" , () => {
     console.log("bot opretationnel");
     client.user.setStatus('test')
     client.user.setActivity('e/help' , { type: 'WATCHING' })
     .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
     .catch(console.error);

     client.guilds.cache.find(guild => guild.id === "695066814920786002").channels.cache.find(channel => channel.id === "787060995397910598").messages.fetch("787757750888431648").then(message => {
      console.log("message ajouter a la memoire : " + message.content);
 }).catch(err => {
      console.log("Impossible d'ajouter le message en memoire : " + err);
 });
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
  
    const serverQueue = queue.get(message.guild.id);
  
    if (message.content.startsWith(`${prefix}play`)) {
      execute(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
      return;
    } 
  });
  
  async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
      );
    }
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
     };
  
    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  }
  
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
      
    if (!serverQueue)
      return message.channel.send("There is no song that I could stop!");
      
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }

client.on("guildMemberAdd" , member => {
     console.log("Un nouveau membre est arrive");
     member.guild.channels.cache.find(channel => channel.id === "728922409532391485").send(member.displayName + " est arrivée !\n Nous somme desormais **" + member.guild.memberCount + "** sur le serveur !");
     member.roles.add("779060546082832415").then(mbr => {
          console.log("Rôle attribue avec succès pour " + mbr.displayName);
     }).catch(() => {
          console.log("le role n'a pas pu etre attribue ")
     });
});

client.on("guildMemberRemove" , member => {
     console.log("Un membre nous a quitté");
     member.guild.channels.cache.find(channel => channel.id === "728922411285872690").send(member.displayName + " nous a quitter :sob:\n Nous somme desormais **" + member.guild.memberCount + "** sur le serveur :sob:");
});

client.on("messageReactionAdd", (reaction, user) => {
  if(user.bot) return;

  console.log("reaction ajouter par : " + user.username + "\nNom de l'emoji " + reaction.emoji.name + " c'est la " + reaction.count + "e reaction");
     
  if(reaction.message.id === "787757750888431648"){
    if(reaction.emoji.name === "horse"){
      var member = reaction.message.guild.members.cache.find(member => member.id === user.id);
      member.roles.add("787613319724793907").then(mbr => {
        console.log("Rôle attribue avec succès pour " + mbr.displayName);
      }).catch(err => {
        console.log("le role n'a pas pu etre attribue : " + err);
      });
    }
  }

/*reaction.users.remove(user.id).then(react => {
  console.log("reaction " + reaction.emoji.name + " retiré par le bot");
  }).catch(err => {
  console.log("Impossible de retiré la réaction : " + err)
 });

reaction.remove().then(react => {
  console.log("reaction " + reaction.emoji.name + " retiré par le bot");
  }).catch(err => {
  console.log("Impossible de retiré la réaction : " + err)
 });*/
});

client.on("messageReactionRemove" , (reaction, user) => {
     if(user.bot) return;
     console.log("reaction retiré");

     if(reaction.message.id === "787757750888431648"){
          if(reaction.emoji.name === "eyes"){
              var member = reaction.message.guild.members.cache.find(member => member.id === user.id);
              member.roles.remove("787613319724793907").then(mbr => {
                console.log("Rôle retiré avec succès pour " + mbr.displayName);
          }).catch(err => {
                console.log("le role n'a pas pu etre retirer : " + err);
            });
          }
     }
});

client.once("ready", () => {
     console.log("Ready!");
   });
   
   client.once("reconnecting", () => {
     console.log("Reconnecting!");
   });
   
   client.once("disconnect", () => {
     console.log("Disconnect!");
   });

   client.on('message', message => {
    if (message.content === 'c quoi mon avatar') {
      message.reply(message.author.displayAvatarURL());
    }
  });

  /*client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.find(ch => ch.name === 'arriver-🛫');
    if (!channel) return;
    messsage.channel.send("Welcome to the server" + member.displayName);
  });*/

/*const hook = new Discord.WebhookClient('787014464461078600', 'KOnfv2ciiw_Q_KXcXGXLVc81QD3dP1l9KNiPU_5CQwHO2xBsXKgZsBohUFSV2i8nRB5i');

hook.send('TheExp3rt71 est de retour');*/

client.on('message' , message => {

    Ping.parse(message)
    Info.parse(message)
    Help.parse(message)
    Channel.parse(message)
    Clear.parse(message)
    Sondage.parse(message)
    Decompte.parse(message)
    Invite.parse(message)
    Reglement.parse(message)
});

client.on("message",message => {

  //----------------------commande N°1 ----------------------
  if(message.author.bot) return ;
  if(message.channel.type == "dm") return;

  if(message.content.startsWith(`${prefix}t`)){
  if(message.member.hasPermission("ADMINISTRATOR")){

        var member = message.mentions.users.first()
 
        const role_add = message.guild.roles.cache.find(role => role.name === "t");
        member.roles.add(`${role_add}`)
        .then(mbr => {console.log("Rôle attribue avec succès pour " + mbr.displayName);})
        .catch(err => {console.log("le role n'a pas pu etre attribue : " + err);
     });
   }
}
  //----------------------commande N°2 ----------------------
  if (message.content === prefix + "discord"){
    var discord_embed = new MessageEmbed()
    .setColor("ff7500")
    .setThumbnail("https://bestsecuritysearch.com/wp-content/uploads/2016/10/discord-logo-bss.png")
    .setTitle("Redirection vers discord.js")
    .addField("**Discord.js**")
    .setURL("https://discord.js.org/#/docs/main/stable/search?q=name")
    .setTimestamp() 
    .setFooter("signaler un bug? faite e/créateur")
    message.author.send(discord_embed)
    message.channel.send(":white_check_mark: | La documentation discord.js ta ete envoyer en mp")
    console.log("commandes envoyés !!!!");
    message.delete();

}
  //----------------------commande N°3 ----------------------
  if (!message.guild) return;
  if(message.author.bot) return;
  if(message.channel.type == "dm") return;

   if(message.member.hasPermission("ADMINISTRATOR")){
  if (message.content.startsWith('e/ban')) {

    const user = message.mentions.users.first();

    if (user) {
      const member = message.guild.member(user);
      if (member) {

        member.ban({
          reason: 'Tes nul',
        }).then(() => {
          message.reply(`Le joueur ${user.tag} a ete ban avec succes`);
        }).catch(err => {
        message.reply('Cette personne ne peut pas etre ban');
          console.error(err);
        });
      } else {
        message.reply("Ce joueur n'existe pas");
      }
    } else {
      message.reply('Quelle est la personne a bannir');
     }
    }
   }
  //----------------------commande N°4 ----------------------
  if (!message.guild) return;
    if(message.author.bot) return;
    if(message.channel.type == "dm") return;

    if(message.member.hasPermission("ADMINISTRATOR")){
    if (message.content.startsWith('e/kick')) {
      const user = message.mentions.users.first();
      if (user) {
        const member = message.guild.member(user);
        if (member) {
 
          member.kick('Raison facultative qui s’affichera dans les journaux d’audit').then(() => {
            message.reply(`Le membre ${user.tag} a bien ete kick`);
          }).catch(err => {

            message.reply('Je ne peut pas kick cette personne');
            console.error(err);
          });
        } else {
          message.reply('Cet utilisateur n est pas dans cette guilde!');
        }
      } else {
        message.reply('Vous n avez pas mentionné l utilisateur pour donner un coup de pied !');
       }
     }
    }
  
  //----------------------commande N°5 ----------------------
  if (message.content === 'e/rip') {
    const attachment = new MessageAttachment("https://i.imgur.com/w3duR07.png");
    message.channel.send(attachment);
  }
  //----------------------commande N°6 ----------------------
  if(message.author.bot) return;
  if(message.channel.type == "dm") return;

  /*
  message.react('🐴')
  message.react('👀')
  */

  if(message.content == prefix + "stat"){
       message.channel.send("**" + message.author.username + "** qui a pour identifiant : __" + message.author.id + "__ a poste un message");
  }
  //----------------------commande N°6 ----------------------
  if(message.content.startsWith("Session")){
    message.react("✔");
    message.react("❌");
    message.react("⏰");
    message.react("❓");
};
  //----------------------commande N°7 -----------------------
  if(message.author.bot) return;

  if(message.content.startsWith(prefix + "restart")){
    
    if (message.author.id !== '439703135771164682') {
      return message.channel.send(`Vous ne pouvez pas utiliser cette commande!`)
  }
  message.channel.send(`Redémarrage du bot...`)
  process.exit();
  }
});

client.login(token);
