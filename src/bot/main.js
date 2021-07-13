
/**
 * Runs & defines certain stuff only once as bot0
 */
module.exports.run = () => {

    module.exports.quotes               = require("../controller/helpers/dataimport.js").quotes()
    module.exports.lang                 = require("../controller/helpers/dataimport.js").lang()

    module.exports.failedcomments       = [] //array saving failedcomments so the user can access them via the !failecomments command
    module.exports.activecommentprocess = [] //array storing active comment processes so that a user can only request one process at a time and the updater is blocked while a comment process is executed
    module.exports.commentcounter       = 0  //this will count the total of comments requested since the last reboot
    module.exports.commentedrecently    = 0  //global cooldown for the comment command


    //Define configgroup64id for the accounts to be able to access
    require("./helpers/steamgroup.js").configgroup64id((configgroup64id) => {
        module.exports.configgroup64id = configgroup64id //just get it and export it
    })
}