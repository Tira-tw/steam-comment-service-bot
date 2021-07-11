
/**
 * Handles messages, cooldowns ad executes commands.
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {SteamCommunity} community The community instance of the calling account
 * @param {Object} steamID The steamID object from steam-user
 * @param {String} message The message string provided by steam-user friendMessage event
 */
module.exports.run = (loginindex, thisbot, bot, community, steamID, message) => {
    var controller = require("../../controller/controller.js")
    var botfile    = require("../bot.js")
    var ready      = require("../../controller/ready.js")

    var SteamID    = require('steamid');

    var chatmsg    = botfile.chatmsg //Make the call a bit shorter for convenience
    var lang       = botfile.lang

    var disablecommentcmd     = false //disables the comment and resetcooldown command and responds with maintenance message
    var commandcooldown       = 12000 //The bot won't respond if a user sends more than 5 messages in this time frame
    var lastcommentrequestmsg = []    //array saving the last comment cmd request to apply higher cooldown to the comment cmd usage compared to normal cmd usage cooldown
    var lastmessage           = {}    //tracks the last cmd usage of a normal command to apply cooldown if the user spams


    /**
     * Function to return last successful comment from lastcomment.db
     * @param {function} [callback] Called with `timestamp` (Number) on completion
     */
    function lastsuccessfulcomment(callback) {
        var greatesttimevalue = 0

        botfile.lastcomment.find({}, (err, docs) => { //get all documents
            docs.forEach((e, i) => {
                if (e.time > greatesttimevalue) greatesttimevalue = Number(e.time)

                if (i == docs.length - 1) {
                    return callback(greatesttimevalue) }
            })
        }) 
    }


    //TODO: COMMENT FUNCTIONS SHOULD BE REMOVED (used by webserver)

    //Comment command (outside of friendMessage Event to be able to call it from controller.js)
    var commentcmd = undefined //this is just here to make eslint happy so that the export in loggedOn is not undefined
    var groupcommentcmd = undefined

    if (loginindex == 0) {
        /**
         * The comment command
         * @param {Object} steamID steamID of message author
         * @param {Array<String>} args An array containing all arguments provided in the message by the user
         * @param {Object} res An express response object that will be available if the function is called from the express webserver
         */
        commentcmd = (steamID, args, res) => {
            var steam64id = new SteamID(String(steamID)).getSteamID64()

            botfile.lastcomment.findOne({ id: steam64id }, (err, lastcommentdoc) => {
                if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err)

                try { //catch any unhandled error to be able to remove user from activecommentprocess array
                    require("../commands/comment/comment.js").run(logger, chatmsg, lang, community, thisbot, steamID, args, res, lastcommentdoc, lastcommentrequestmsg, lastsuccessfulcomment)
                } catch (err) {
                    botfile.activecommentprocess = botfile.activecommentprocess.filter(item => item != steam64id) //Remove user from array to make sure you can't get stuck in there (not perfect as this won't trigger when the error occurrs in a nested function)
                    logger("error", "Error while processing comment request: " + err.stack)
                }
            })
        }

        /**
         * The group comment command
         * @param {Object} steamID steamID of message author
         * @param {Array<String>} args An array containing all arguments provided in the message by the user
         * @param {Object} res An express response object that will be available if the function is called from the express webserver
         */
        groupcommentcmd = (steamID, args, res) => {
            var steam64id = new SteamID(String(steamID)).getSteamID64()

            botfile.lastcomment.findOne({ id: steam64id }, (err, lastcommentdoc) => {
                if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err)

                try { //catch any unhandled error to be able to remove user from activecommentprocess array
                    require("../commands/comment/groupcomment.js").run(logger, chatmsg, lang, community, thisbot, steamID, args, res, lastcommentdoc, lastcommentrequestmsg, lastsuccessfulcomment)
                } catch (err) {
                    botfile.activecommentprocess = botfile.activecommentprocess.filter(item => item != steam64id) //Remove user from array to make sure you can't get stuck in there (not perfect as this won't trigger when the error occurrs in a nested function)
                    logger("error", "Error while processing group comment request: " + err)
                }
            })
        }
    }


    var steam64id = new SteamID(String(steamID)).getSteamID64()
    var ownercheck = config.ownerid.includes(steam64id)
    if (bot.myFriends[steam64id] == 1 || bot.myFriends[steam64id] == 6) return; //User is blocked.

    //Spam "protection" because spamming the bot is bad!
    if (!lastmessage[steam64id] || lastmessage[steam64id][0] + commandcooldown < Date.now()) lastmessage[steam64id] = [Date.now(), 0] //Add user to array or Reset time
    if (lastmessage[steam64id] && lastmessage[steam64id][0] + commandcooldown > Date.now() && lastmessage[steam64id][1] > 5) return; //Just don't respond

    if (lastmessage[steam64id] && lastmessage[steam64id][0] + commandcooldown > Date.now() && lastmessage[steam64id][1] > 4) { //Inform the user about the cooldown
        chatmsg(steamID, lang.userspamblock)
        logger("info", `${steam64id} has been blocked for 90 seconds for spamming.`)
        lastmessage[steam64id][0] += 90000
        lastmessage[steam64id][1]++
        return; 
    }

    if (!ownercheck) lastmessage[steam64id][1]++ //push new message to array if user isn't an owner

    //log friend message but cut it if it is >= 75 chars
    if (message.length >= 75) logger("info", `[${thisbot}] Friend message from ${steam64id}: ${message.slice(0, 75) + "..."}`);
        else logger("info", `[${thisbot}] Friend message from ${steam64id}: ${message}`);
        
    //Deny non-friends the use of any command
    if (bot.myFriends[steam64id] != 3) return chatmsg(steamID, lang.usernotfriend)

    if (loginindex === 0) { //check if this is the main bot
        //Check if bot is not fully started yet and block cmd usage if that is the case to prevent errors
        if (ready.readyafter == 0) return chatmsg(steamID, lang.botnotready)
        if (controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready)

        /**
         * Function to quickly respond with owneronly message and stop command execution
         */
        var notownerresponse = (() => { 
            return chatmsg(steamID, lang.commandowneronly) 
        })

        //Check if user is in lastcomment database
        botfile.lastcomment.findOne({ id: steam64id }, (err, doc) => {
            if (err) logger("error", "Database error on friendMessage. This is weird. Error: " + err)

            if (!doc) { //add user to database if he/she is missing for some reason
                let lastcommentobj = {
                    id: new SteamID(String(steamID)).getSteamID64(),
                    time: Date.now() - (config.commentcooldown * 60000) //subtract commentcooldown so that the user is able to use the command instantly
                }
                
                botfile.lastcomment.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err) }) 
            }
        })

        var cont = message.slice("!").split(" ");
        var args = cont.slice(1); 

        switch(cont[0].toLowerCase()) {
            case '!h':
            case 'help':
            case '!help':
            case '!commands':
                require("../commands/general.js").help(ownercheck, chatmsg, steamID, lang)
                break;
            
            case '!comment':
                if (disablecommentcmd) return chatmsg(steamID, lang.botmaintenance)

                commentcmd(steamID, args) //Just call the function like normal when the command was used
                break;

            
            case '!gcomment':
            case '!groupcomment':
                if (disablecommentcmd) return chatmsg(steamID, lang.botmaintenance)

                groupcommentcmd(steamID, args)
                break;
            
            case '!ping':
                require("../commands/general.js").ping(chatmsg, steamID, lang)
                break;
            
            case '!info':
                require("../commands/general.js").info(steam64id, lastsuccessfulcomment, chatmsg, steamID)
                break;
            
            case '!owner':
                require("../commands/general.js").owner(chatmsg, steamID, lang)
                break;
            
            case '!group':
                require("../commands/group.js").group(bot, chatmsg, steamID, lang)
                break;
            
            case '!abort':
                require("../commands/comment/cmisc.js").abort(chatmsg, steamID, lang, steam64id)
                break;
            
            case '!rc':
            case '!resetcooldown':
                if (!ownercheck) return notownerresponse();
                if (disablecommentcmd) return chatmsg(steamID, lang.botmaintenance)

                require("../commands/comment/cmisc.js").resetCooldown(chatmsg, steamID, lang, args, steam64id)
                break;
            
            case '!config':
            case '!settings':
                if (!ownercheck) return notownerresponse();

                require("../commands/settings.js").run(chatmsg, steamID, lang, loginindex, args)
                break;
            
            case '!failed':
                require("../commands/comment/cmisc.js").failed(chatmsg, steamID, lang, steam64id)
                break;
            
            case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                require("../commands/general.js").about(chatmsg, steamID)
                break;
            
            case '!addfriend':
                if (!ownercheck) return notownerresponse();

                require("../commands/friend.js").addFriend(chatmsg, steamID, lang, args)
                break;

            case '!unfriend':
                if (!ownercheck) return notownerresponse();

                require("../commands/friend.js").unfriend(chatmsg, steamID, lang, args)
                break;
            
            case '!unfriendall':
                if (!ownercheck) return notownerresponse();

                require("../commands/friend.js").unfriendall(chatmsg, steamID, lang, args)
                break;
            
            case '!leavegroup':
                if (!ownercheck) return notownerresponse();

                require("../commands/group.js").leaveGroup(chatmsg, steamID, lang, args)
                break;
            
            case '!leaveallgroups':
                if (!ownercheck) return notownerresponse();

                require("../commands/group.js").leaveAllGroups(chatmsg, steamID, lang, args)
                break;
            
            case '!block': //Well it kinda works but unblocking doesn't. The friend relationship enum stays at 6
                if (!ownercheck) return notownerresponse();

                require("../commands/block.js").block(chatmsg, steamID, lang, args)
                break;
            
            case '!unblock':
                if (!ownercheck) return notownerresponse();

                require("../commands/block.js").unblock(chatmsg, steamID, lang, args)
                break;
            
            case '!rs':
            case '!restart':
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").restart(chatmsg, steamID, lang)
                break;

            case '!stop':
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").stop(chatmsg, steamID, lang)
                break;
            
            case '!update':
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").update(chatmsg, steamID, lang, args)
                break;
            
            case '!log':
            case '!output':
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").output(chatmsg, steamID)
                break;
            
            case '!eval':
                if (config.enableevalcmd !== true) return chatmsg(steamID, lang.evalcmdturnedoff)
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").eval(chatmsg, steamID, lang, args, bot, community)
                break;
            
            default: //cmd not recognized
                if (message.startsWith("!")) chatmsg(steamID, lang.commandnotfound) 
        }
    } else {
        switch(message.toLowerCase()) {
            case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                chatmsg(steamID, extdata.aboutstr)
                break;
            default:
                if (message.startsWith("!")) chatmsg(steamID, `${lang.childbotmessage}\nhttps://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[0].steamID)).getSteamID64()}`)
        }
    }
}