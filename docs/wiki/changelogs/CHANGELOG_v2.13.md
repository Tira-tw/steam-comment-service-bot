# Version 2.13.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.13.0](#2.13.0)
  
&nbsp;

<a id="2.13.0"></a>

## **2023-06-05, Version 2.13.0**, co-author [@DerDeathraven](https://github.com/DerDeathraven)
**Changes of note (TL;DR):**  
- Added new commands: !upvote, !downvote, !favorite, !unfavorite, !reload
- Added support for commenting on sharefiles (screenshots, artworks & guides)
- Added a completely new plugin system, command handler system and improved the data management system
- Greatly improved handling of long and failed steam chat messages
- Reworked the whole application for better code quality and expansibility
- Added some miscellaneous new features, for example a progress bar during startup, owners not friend with main account check and warning counter
- Fixed a lot of bugs

If you are using a `customlang.json`, make sure to read the language string changes at the end and update your file.

&nbsp;
&nbsp;

**Additions:**
- Added new commands: !upvote, !downvote, !favorite, !unfavorite, !reload
- Added support for commenting, voting & favorizing sharedfiles by updating !comment and adding two new commands as mentioned above!
  - Added a library patches system to load my changes until [my PR to the SteamCommunity library gets accepted](https://github.com/DoctorMcKay/node-steamcommunity/pull/306)
  - Added support for figuring out sharedfile IDs to the handleSteamIdResolving() helper
  - Added a ratingHistory database to track which bot accounts have voted on or favorized which item
- Added a completely new plugin system, co-author @DerDeathraven #174
  - Added a plugin loader which dynamically loads all installed npm packages with the prefix `steam-comment-bot-` @DerDeathraven #174
  - Added new template plugin which you can [fork here to create your own plugin](https://github.com/HerrEurobeat/steam-comment-bot-template-plugin)
  - Added plugin functions: `load`, `ready`, `statusUpdate`, `steamGuardInput`
  - Added plugin data directory and functions to handle data reading & writing: `getPluginDataPath`, `loadPluginData`, `writePluginData`, `loadPluginConfig`, `writePluginConfig`
  - Added a reload system to apply changes at runtime for development using command !reload
- Added a separate data management system
  - Added dataProcessing helper to handle converting group & ownerids
  - Added support for repairing `defaultlang.json` and `quotes.txt`
  - Added a handleCooldown helper
  - Added warning for long language strings
- Added a Controller event system
  - Added events: `ready`, `statusUpdate`, `steamGuardInput`
  - steamGuardInput event allows plugins to submit steam guard codes as well
- Added a command handler system
  - Added `restrictAdditionalCommandsToOwners` setting to `advancedconfig.json` to restrict specific commands to owners only. Supports aliases.
  - Added system for dynamically loading core commands on start
  - Added functions for registering & unregistering commands at runtime
  - Added a reload system to apply changes at runtime for development using command !reload
  - Added a respond module system that supports the usage of core commands from different sources. Callers can supply this information to the `resInfo` object: `steamID64`, `prefix`, `cmdprefix`, `charLimit`, `cutChars`
  - Command prefixes are now replaced dynamically in language strings, based on the `cmdprefix` value in `resInfo`. If omitted, the default prefix "!" will be used
  - Steam Chat message prefixes are now added dynamically based on the `prefix` value in `resInfo`
- Added a proper steam chat message handler
  - Send long log messages in intelligently cut parts to not break links etc. 
  - Retry failed messages with increasing delay and ignore them on certain errors
  - Added a typing indicator when the bot is waiting for the next msg part to be sent
- Added a readChatInput helper function to get user input from the steam chat
- Added algorithm for handling tokens that either expire soon or are already expired
- Added proxy support to the sessionHandler
- Added an EStatus enum for storing the online status of every bot account
- Added more misc helpers and referenced them from Controller
  - Added getAvailableAccounts(), timeToString() and cutStringsIntelligently() helper
- Added support for forcing an update from a compatibility feature
- Added support for accepting logins from the Mobile Steam App
- Added support for setting a primary group by loading a patch until [my PR to the SteamCommunity library gets accepted](https://github.com/DoctorMcKay/node-steamcommunity/pull/307)
- Added support for requesting free games licenses for missing games set in config.json. This also adds a listener for the SteamUser ownershipCached event
- Added Controller restart() & stop() functions to replace all manual process.send()'s
- Added Controller getBots() helper function to easily get bot accounts filtered by status
- Added proper JsDoc documentation for every function & object for full IntelliSense support and generated `d.ts` file for TypeScript support
- Added a different finished message sent to users when their request was aborted
- Added a different message sent to users if either not enough unlimited accounts are found for a request or the bot has none at all
- Added check with warning message on ready for owners who are not friend with the main bot account
- Added a fancy progress bar to startup, powered by my output-logger library
- Added startup warnings counter with log message on ready
- Added compatibility feature for update from 2.12 to 2.13

&nbsp;

**Reworks:**
- Reworked basically the whole application to follow a proper object oriented approach
- Reworked login function to wait for last user object to populate before calling ready event
- Reworked comment cmd to support profiles, groups and sharedfiles from the same command instead of 3
- Reworked comment cmd to work with the new OOP structure and reduced complexity
- Reworked comment error handler
- Reworked lots of messages and comment cmd references to be applicable to other request types as well
- Reworked retry comments algorithm to work with the new OOP structure 
- Reworked how references to bot accounts are stored
- Reworked how imported logininfo data is formatted & stored
- Reworked checkAvailability & getAccountOrder helpers with a better getAvailableAccounts helper
- Reworked getCommentArgs to work with new OOP structure
- Reworked logger to work with the new OOP structure
- Reworked friendlist helper to work with the new OOP structure
- Reworked checkMsgBlock helper to the new OOP structure
- Reworked message prefixes to be prepended dynamically instead of being hardcoded to support different message destinations (e.g. a Discord plugin)
- Reworked the existing webserver plugin to work with the new OOP structure
- Simplified skippedaccounts system
- Simplified proxy index calculation for all bot accounts
- Simplified waitTime & commentCounter calculation
- Improved !failed command to group the same request errors together
- Improved login function to handle filtering and relogging
- Improved log footprint of updater
- Improved error messages when file can't be restored and make sure to stop the bot
- Updated error & disconnect events to work with the improved login function
- Updated sessionHandler to work with the new OOP structure
- Updated handleLoginTimeout() to work with the new OOP structure
- Updated the updater itself and its prepareUpdate(), createBackup(), customUpdateRules(), downloadUpdate() and restoreBackup() helpers to work with the new OOP structure
- Updated all compatibility features to work with the new OOP structure
- Updated various core commands to work with the new OOP structure
- Replaced activecommentprocess object with an activeRequests object that supports other request types as well
- Removed additionalaccinfo obj and replaced usage with new system
- Converted all event listeners to use OOP structure

&nbsp;

**Fixes:**
- Fixed the webserver plugin from being completely broken #172
- Fixed return parameters of checkConnection
- Fixed webSession looping caused by broken botsgroup check
- Fixed accounts.txt import still checking for loginfo.json
- Fixed limited check sometimes failing because user object was not fully populated instantly after login
- Fixed login function not waiting correctly between accounts
- Fixed botIsReady not being updated when logAfterReady is empty
- Fixed singular comment requests not being handled correctly
- Fixed first comment process iteration being counted in until calculation
- Fixed possible inconsistencies in comment error checks by forcing them to lowercase
- Fixed relog on error not using advancedconfig relogTimeout
- Fixed duplicate SessionHandler object being created on relogs
- Fixed prepareUpdate() response message sometimes failing by increasing log off delay
- Fixed bot softlocking on start when ownerids array is empty
- Fixed !help and !info commands inflating message length with unnecessary whitespaces
- Fixed error on update when certain data.json keys were missing
- Fixed friendlist checks failing when accounts were skipped
- Fixed cooldown issues when cooldown is disabled and process got aborted
- Fixed a data check error on broken internet connection by checking it beforehand
- Fixed handleLoginTimeout causing a DuplicateRequest error on 2FA input
- Fixed output-logger causing crash when running bot with pm2 #48
- Fixed potential bug where whenAvailableStr in comment command could display wrong information if allAccounts was empty or if more accounts got removed after the activeRequests loop ran 9e6c569
- Fixed/Removed minor unnecessary checks in comment command
- Fixed user added while offline message being able to fail because it was sent too early after logging in

&nbsp;

**Changes:**
- Removed support for the old login flow: f5957bb
- Removed v2.13 login flow change notification message
- Removed `disableCommentCmd` setting from `advancedconfig.json` and replaced it with `restrictAdditionalCommandsToOwners` array
- Removed `enableurltocomment` setting from `advancedconfig.json`. Toggling the webserver plugin is now done in the plugin config in the `plugins` directory #172
- Removed `urlrequestsecretkey` from `data.json`. This key is now stored in the plugin config in the `plugins` directory. The update will cause a new key to be generated. #172
- Removed most global variables
- Removed (nearly) every usage of `var`
- Removed lots of unnecessary variables that are now replaced by better systems
- Removed main.js
- Removed old relogAccount helper
- Removed old unused 2.10 -> 2.11 compatibility files
- Tokens will now be invalidated on AccessDenied login error
- Renamed command file `commentmisc.js` to `requests.js`
- Moved error handlers to a separate helper file
- Moved various updater, controller & bot helper files to new objects
- Moved various log messages to log at more appropriate times
- Shortened most comment error descriptions
- Improved eslint styling rules, formatting & code quality and added prettier config @DerDeathraven #171
- Updated dependencies
- Tons of fixes for features that have been added in this update and are therefore not listed here
- Minor other changes

<details>
  <summary>A lot of language strings have changed to mention sharedfiles for example. This list is long, to see it click me</summary>

  - These language keys have been added:
    - updaterautoupdatedisabled
    - commentnoaccounts
    - commentnounlimitedaccs
    - commentsuccess
    - votenoaccounts
    - voterequestless
    - votenotenoughavailableaccs
    - voteprocessstarted
    - votesuccess
    - favoritenoaccounts
    - favoriterequestless
    - favoritenotenoughavailableaccs
    - favoriteprocessstarted
    - favoritesuccess
    - invalidnumber
    - invalidsharedfileid
    - errloadingsharedfile
    - idalreadyreceiving
    - idoncooldown
    - requestaborted
    - reloadcmdreloaded
    - activerelog
  - These language keys have been removed:
    - pleasedontspam
    - commentactiverelog
    - commentcmdowneronly
    - commentuseroncooldown
    - commentuseralreadyreceiving
    - commentglobaloncooldown
    - commentinvalidnumber
    - commentaccslimitedremoved
    - commentsuccess1
    - commentsuccess2
    - commentlimitederror
    - botmaintenance
  - These language key's values have changed:
    - note
    - commentcmdusageowner
    - commentcmdusageowner2
    - commentcmdusage
    - commentcmdusage2
    - commentinvalidid
    - commentprofileidowneronly
    - commentzeroavailableaccs
    - commentnotenoughavailableaccs
    - commentuserprofileprivate
    - commenterroroccurred
    - commentprocessstarted
    - commentfailedcmdreference
    - commentretrying
    - useradded
    - userspamblock
    - usernotfriend
    - botnotready
    - commandnotfound
    - commandowneronly
    - invalidprofileid
    - idisownererror
    - updatecmdforce
    - updatecmdcheck
    - restartcmdrestarting
    - stopcmdstopping
    - helpjoingroup
    - ownercmdmsg
    - abortcmdnoprocess
    - abortcmdsuccess
    - settingscmdvaluechanged
    - failedcmdmsg
    - unfriendallcmdpending
    - unfriendallcmdstart
    - leaveallgroupscmdabort
    - leaveallgroupscmdpending
    - leaveallgroupscmdstart
    - blockcmdsuccess
    - unblockcmdsuccess
    - evalcmdturnedoff
    - childbotmessage

  This list was generated using my `langStringsChangeDetector.js` script.

</details>

&nbsp;

**Stats:**  
This update is the largest yet and took ~2.5 months with many full days.  
332 commits have been added, 10962 lines have been added and 11894 removed.  
Check out the full PR [here](https://github.com/HerrEurobeat/steam-comment-service-bot/pull/176).

Commit: [3fa6a50](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/3fa6a50)